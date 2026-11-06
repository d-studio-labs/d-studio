// Export a track to WAV through SuperDirt: `npm run export -- lantern`
// It plays in real time while superdirt/record.scd records the master, so a
// 6-minute track takes 6 minutes. Needs `npm run dirt`; stop `npm run play` first.
//
//   --bars 32 --from 64   which bars (default: the track's BARS, else 32, from bar 0)
//   --tail 4              seconds after the last bar, for echoes and reverb
//   --solo kick,sub       only these parts (stems)   --mute pad   all but these
//   --mp3                 also an MP3 (ffmpeg)        --out file.wav
//   --lufs -16            normalize the export to this integrated loudness (ffmpeg loudnorm,
//                         true peak capped at the master's own −1 dB ceiling)   --raw   skip it
import { Cyclist, stack, setTime } from '@strudel/core'
import { miniAllStrings } from '@strudel/mini'
import { performance } from 'node:perf_hooks'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { message, bundle, udp } from './osc.mjs'
import { toDirt } from './dirt.mjs'
import { loadTrack } from './track.mjs'
import { PROJECT } from './project.mjs'

miniAllStrings()

const LATENCY = Number(process.env.DIRT_LATENCY ?? 0.4)

// ── Arguments ──
const [trackName, ...rest] = process.argv.slice(2)
const flags = {}
for (let i = 0; i < rest.length; i++) {
  const key = rest[i].replace(/^--/, '')
  flags[key] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true
}
if (!trackName) {
  console.log(
    'usage: npm run export -- <track> [--bars N] [--from N] [--tail S] [--solo a,b] [--mute a,b] [--mp3] [--out file.wav]',
  )
  process.exit(1)
}

const mod = await loadTrack(new URL(`tracks/${trackName}/`, PROJECT))
const cps = (mod.BPM ?? 120) / 240
const from = Number(flags.from ?? 0)
const bars = Number(flags.bars ?? mod.BARS ?? 32)
const tail = Number(flags.tail ?? 4)
const solo = typeof flags.solo === 'string' ? flags.solo.split(',') : null
const mute = typeof flags.mute === 'string' ? flags.mute.split(',') : []
// a part only the keys play (midi(p, { muted: true })) isn't in the export
const lanes = Object.entries(mod.parts ?? {}).filter(
  ([n, p]) => p && n !== mod.muted && (!solo || solo.includes(n)) && !mute.includes(n),
)
if (!lanes.length) {
  console.error(`✗ no parts left to play (parts: ${Object.keys(mod.parts ?? {}).join(' ')})`)
  process.exit(1)
}

const suffix = [solo && solo.join('+'), (flags.from || flags.bars) && `b${from}-${from + bars}`]
  .filter(Boolean)
  .join('-')
const out = resolve(
  typeof flags.out === 'string'
    ? flags.out
    : fileURLToPath(new URL(`exports/${trackName}${suffix ? '-' + suffix : ''}.wav`, PROJECT)),
)
const raw = out.replace(/\.wav$/, '') + '.raw.wav'
mkdirSync(resolve(out, '..'), { recursive: true })

// ── SuperDirt: arm the recording to start at a set moment ──
const dirt = udp('127.0.0.1', Number(process.env.DIRT_PORT ?? 57120))
const waiting = new Map()
dirt.onMessage(({ address, args }) => waiting.get(address)?.(args))
const reply = (address, seconds) =>
  new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error(`no ${address} from SuperDirt after ${seconds} s`)), seconds * 1000)
    waiting.set(address, (args) => (clearTimeout(timer), ok(args)))
  })

const now = () => performance.now() / 1000
const toUnix = (t) => performance.timeOrigin / 1000 + t

// a string: unix seconds need more precision than an OSC float
const recordStart = now() + 1
dirt.send(message('/dstudio/record/start', [raw, toUnix(recordStart).toFixed(6)]))
try {
  await reply('/dstudio/record/started', 5)
} catch {
  console.error("✗ SuperDirt isn't answering. Is `npm run dirt` running (restarted since record.scd was added)?")
  process.exit(1)
}

// ── Play the bars; the first note tells us where bar `from` sits in the recording ──
const seconds = bars / cps
const pattern = stack(...lanes.map(([, p]) => p))
  .early(from)
  .filterHaps((h) => h.whole.begin.valueOf() < bars)
let downbeat
let lastBar = -1
const scheduler = new Cyclist({
  getTime: now,
  latency: LATENCY,
  onTrigger: (hap, _deadline, _duration, c, targetTime) => {
    downbeat ??= targetTime - hap.whole.begin.valueOf() / c
    const bar = Math.floor(hap.whole.begin.valueOf())
    if (bar !== lastBar && bar % 8 === 0) {
      process.stdout.write(`\r  bar ${from + bar} / ${from + bars}`)
      lastBar = bar
    }
    dirt.send(bundle(toUnix(targetTime), message('/dirt/play', toDirt(hap, c))))
  },
  onError: (e) => console.error(e),
})
setTime(() => scheduler.now())
scheduler.setCps(cps)
scheduler.setPattern(pattern)

console.log(
  `● ${trackName} · bars ${from}–${from + bars} · ${fmt(seconds)} + ${tail} s tail · lanes: ${lanes.map(([n]) => n).join(' ')}`,
)
// start so the first bar lands just after the recording does
await new Promise((ok) => setTimeout(ok, Math.max(0, recordStart + 0.1 - LATENCY - now()) * 1000))
const playStart = now()
scheduler.start()
await new Promise((ok) => setTimeout(ok, (LATENCY + seconds + tail) * 1000))
scheduler.stop()
dirt.send(message('/dstudio/record/stop'))
await reply('/dstudio/record/stopped', 10)
dirt.close()
process.stdout.write('\r')

// ── Trim to start on the downbeat and end after the tail ──
const offset = (downbeat ?? playStart + LATENCY) - recordStart
const { sampleRate, channels } = trimWav(raw, out, offset, seconds + tail)
rmSync(raw)
console.log(`✓ ${out}  (${fmt(seconds + tail)}, ${sampleRate / 1000} kHz, 24-bit, ${channels} ch)`)

// ── Optional: loudness normalization and an MP3, when ffmpeg is installed ──
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0
const targetLufs = Number(flags.lufs ?? -16)
const targetTP = -1 // the master's own ceiling (master.scd)
if (hasFfmpeg) {
  // pass 1: measure (also what soundcheck.mjs reads to flag near-silent parts)
  const measure = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      out,
      '-af',
      `loudnorm=I=${targetLufs}:TP=${targetTP}:print_format=json`,
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8' },
  )
  // the json block is followed by ffmpeg's own muxing summary — bound the slice
  // on the matching close brace, or JSON.parse throws on that trailing text
  const stats = JSON.parse(measure.stderr.match(/\{[^{}]*\}/s)?.[0] ?? '{}')
  if (stats.input_i == null) {
    console.log('  ? could not read loudness (unexpected ffmpeg output) — left as recorded')
  } else {
    console.log(`  ${stats.input_i} LUFS integrated · true peak ${stats.input_tp} dBFS`)

    if (!flags.raw && Number(stats.input_i) > -50) {
      // pass 2: apply with the measured stats (linear = a single gain, not dynamic
      // range compression) so quiet mixes reach the target without re-squashing them
      const normalized = out.replace(/\.wav$/, '.norm.wav')
      const apply = spawnSync('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        out,
        '-af',
        `loudnorm=I=${targetLufs}:TP=${targetTP}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:` +
          `measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`,
        '-c:a',
        'pcm_s24le',
        normalized,
      ])
      if (apply.status === 0) {
        rmSync(out)
        renameSync(normalized, out)
        console.log(`✓ normalized to ${targetLufs} LUFS (true peak capped at ${targetTP} dBTP)`)
      } else {
        console.log(`  ✗ normalize failed, left as recorded: ${apply.stderr.trim()}`)
      }
    } else if (!flags.raw) {
      console.log(`  (too quiet to normalize reliably — left as recorded)`)
    }
  }
}
if (flags.mp3) {
  if (!hasFfmpeg) console.log('  no MP3: ffmpeg not found (brew install ffmpeg)')
  else {
    const mp3 = out.replace(/\.wav$/, '.mp3')
    spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', out, '-b:a', '320k', mp3])
    console.log(`✓ ${mp3}`)
  }
}
process.exit(0)

/**
 * Seconds as m:ss.
 *
 * @param {number} s
 * @returns {string}
 */
function fmt(s) {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
}

/**
 * Copy `length` seconds of a PCM WAV starting `start` seconds in, with a plain 44-byte header.
 *
 * @param {string} src
 * @param {string} dst
 * @param {number} start seconds
 * @param {number} length seconds
 * @returns {{ sampleRate: number, channels: number }}
 */
function trimWav(src, dst, start, length) {
  const buf = readFileSync(src)
  let fmtAt = -1
  let dataAt = -1
  let dataSize = 0
  for (let at = 12; at + 8 <= buf.length;) {
    const id = buf.toString('ascii', at, at + 4)
    const size = buf.readUInt32LE(at + 4)
    if (id === 'fmt ') fmtAt = at + 8
    if (id === 'data') {
      dataAt = at + 8
      dataSize = Math.min(size || Infinity, buf.length - dataAt)
      break
    }
    at += 8 + size + (size % 2)
  }
  if (fmtAt < 0 || dataAt < 0) throw new Error(`${src}: not a WAV file SuperDirt wrote`)
  const channels = buf.readUInt16LE(fmtAt + 2)
  const sampleRate = buf.readUInt32LE(fmtAt + 4)
  const frameBytes = buf.readUInt16LE(fmtAt + 12)
  const totalFrames = Math.floor(dataSize / frameBytes)
  const first = Math.max(0, Math.min(totalFrames, Math.round(start * sampleRate)))
  const count = Math.min(totalFrames - first, Math.round(length * sampleRate))
  const data = buf.subarray(dataAt + first * frameBytes, dataAt + (first + count) * frameBytes)
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16)
  buf.copy(header, 20, fmtAt, fmtAt + 16)
  header.writeUInt16LE(1, 20)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  writeFileSync(dst, Buffer.concat([header, data]))
  return { sampleRate, channels }
}

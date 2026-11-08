// Headless engine: Node schedules, SuperDirt plays. `npm run play [-- fog]`
// With no track named: tracks/.default if the project has one, else
// whichever track folder sorts first alphabetically.
// Saves hot-swap the pattern; events go out LATENCY ahead (DIRT_LATENCY=0.3 to override).
// `--from 96 --to 128` loops just those bars (from inclusive, to exclusive).
// MIDI keys play through the part a track wraps in midi(), knobs feed cc() (lib/midi.js).
import { Cyclist, stack, silence, setTime } from '@strudel/core'
import { miniAllStrings } from '@strudel/mini'
import { performance } from 'node:perf_hooks'
import { readdir, readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import { message, bundle, udp } from './osc.mjs'
import { toDirt } from './dirt.mjs'
import { listen } from './midi.mjs'
import { KNOBS, controller } from '../lib/midi.js'
import { mmss, songTime } from './time.js'
import { loadTrack } from './track.mjs'
import { PROJECT } from './project.mjs'

miniAllStrings()

const LATENCY = Number(process.env.DIRT_LATENCY ?? 0.4)
const ROOT = new URL('../', import.meta.url)
const TRACKS = new URL('tracks/', PROJECT)

const args = process.argv.slice(2)
const flags = {}
const positional = []
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[++i]
  else positional.push(args[i])
}

// the bars to loop, or null for the whole song
const loop = flags.from != null || flags.to != null ? { from: Number(flags.from ?? 0), to: Number(flags.to) } : null
if (loop && !(loop.to > loop.from)) {
  console.error(`✗ --from ${loop.from} --to ${flags.to ?? '?'}: need a "to" bar after "from"`)
  process.exit(1)
}

// with no track named on the command line: tracks/.default (one line, the
// track's folder name), if a project sets one, else whichever sorts first
const trackName =
  positional[0] ??
  (await readFile(new URL('.default', TRACKS), 'utf8')
    .then((s) => s.trim())
    .catch(() => null)) ??
  (await readdir(TRACKS, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()[0]

const dirt = udp('127.0.0.1', Number(process.env.DIRT_PORT ?? 57120))
const now = () => performance.now() / 1000
const toUnix = (t) => performance.timeOrigin / 1000 + t
const clock = () => new Date().toLocaleTimeString([], { hour12: false })

// ── The display (`npm run dev`): which cycle sounds at which unix time, once a second ──
const DISPLAY = `${process.env.STUDIO_URL ?? 'http://localhost:5173'}/__engine`
const display = { track: trackName, bpm: null, bars: null, playing: false, anchor: null }
const show = () =>
  fetch(DISPLAY, {
    method: 'POST',
    body: JSON.stringify({ ...display, sent: Date.now() / 1000 }),
    signal: AbortSignal.timeout(500),
  }).catch(() => {})
const heartbeat = setInterval(show, 1000)

// ── Loading a version of the track (same shape as build() in main.js) ──
// ?v=N makes Node re-evaluate index.js and everything it imports (resolve-hook.mjs)
let version = 0
// what lib/midi.js shares: knob values, and the midi() a track evaluation leaves behind
const midiStore = (globalThis.__dstudioMidi ??= { cc: {} })
async function load() {
  const mod = await loadTrack(new URL(`${trackName}/`, TRACKS), `?v=${++version}`)
  // a muted part (midi(p, { muted: true })) isn't played: the keys play it
  const lanes = Object.entries(mod.parts ?? {}).filter(([name, p]) => p && name !== mod.muted)
  const full = lanes.length ? stack(...lanes.map(([, p]) => p)) : silence
  const looped = (p) => (loop ? p.ribbon(loop.from, loop.to - loop.from) : p)
  const pattern = looped(full)
  pattern.queryArc(0, 1)
  const keys = midiStore.next && { ...midiStore.next, pattern: looped(midiStore.next.pattern) }
  // a page's instrument (controls.js): the keys play that part while its page is
  // in use, with midi()'s options or its defaults
  const options = { release: 0.3, hold: 30, ...midiStore.next }
  const instruments = Object.fromEntries(
    Object.entries(mod.instruments ?? {}).map(([page, name]) => [
      page,
      { ...options, name, pattern: looped(mod.parts[name]) },
    ]),
  )
  return {
    pattern,
    keys,
    instruments,
    bpm: mod.BPM ?? 120,
    bars: mod.BARS ?? null,
    lanes: lanes.map(([name]) => name),
    muted: mod.muted,
  }
}

// ── Per-cycle stats: how early each bundle left (ms); negative = it arrived late ──
let stats = { cycle: 0, cps: 0.5, events: 0, minHeadroom: Infinity }
const report = () => {
  if (!stats.events) return
  const flag = stats.minHeadroom < 0 ? '  ← LATE' : ''
  // in a loop, the bar of the song that's playing, not the scheduler's count
  const cycle = loop ? loop.from + (stats.cycle % (loop.to - loop.from)) : stats.cycle
  const time = songTime(cycle, stats.cps, display.bars).padEnd(14)
  console.log(
    `cycle ${String(cycle).padStart(4)}  ${time}  ${String(stats.events).padStart(2)} ev  headroom ≥ ${stats.minHeadroom.toFixed(0)} ms${flag}`,
  )
}

const scheduler = new Cyclist({
  getTime: now,
  latency: LATENCY,
  onTrigger: (hap, _deadline, _duration, cps, targetTime) => {
    const cycle = Math.floor(hap.whole.begin.valueOf())
    if (cycle !== stats.cycle) {
      report()
      stats = { cycle, cps, events: 0, minHeadroom: Infinity }
    }
    stats.events++
    if (!stats.anchored) {
      display.anchor = { cycle: hap.whole.begin.valueOf(), at: toUnix(targetTime), cps }
      stats.anchored = true
    }
    stats.minHeadroom = Math.min(stats.minHeadroom, (targetTime - now()) * 1000)
    dirt.send(bundle(toUnix(targetTime), message('/dirt/play', toDirt(hap, cps))))
  },
  onError: (e) => console.error(e),
})
setTime(() => scheduler.now())

const apply = ({ pattern, keys, instruments, bpm, bars }) => {
  display.bpm = bpm
  display.bars = bars
  midiStore.keys = keys
  midiStore.instruments = instruments
  playing = pattern
  scheduler.setCps(bpm / 60 / 4)
  return scheduler.setPattern(pattern)
}

// ── Live keys: sent straight away, not through the schedule ──
// superdirt/midi.scd plays each note and remembers it by id, so the key coming
// up (or the pedal) can fade that one note out, and a knob can reshape it
let noteId = 0
const down = new Map()
// every note still ringing: id → the hit it was taken from (song time), its key
// velocity and starting gain
const sounding = new Map()
const pedal = { down: false, held: new Set() }
// knob readout: endless encoders have no start or end to look at, so print where
// each one is while it turns, at most every 150 ms, plus once more when it stops
// The channel is printed too: a MiniLab memory (Shift + pad) set to its own
// channel shows which memory the knob was turned in
const shown = new Map()
const showKnob = (n, value, channel) => {
  const bar = '▮'.repeat(Math.round(value / 12.7)).padEnd(10, '▯')
  const i = KNOBS.indexOf(n)
  const name = i < 0 ? `cc(${n})` : `knob(${i + 1})`.padEnd(8) + ` cc(${n})`.padEnd(8)
  // the page this channel is (lib/controllers/), and what the track's controls.js
  // puts on this knob there
  const page = (controller.pages?.indexOf(channel) ?? -1) + 1
  const moves = i < 0 ? null : (midiStore.names?.[`${page || ''}:${i + 1}`] ?? midiStore.names?.[`:${i + 1}`])
  const where = page ? `page ${page}` : `ch ${channel}`
  console.log(
    `MIDI ${where.padEnd(7)} ${name}  ${bar}  ${(value / 127).toFixed(2)}  (raw ${value})${moves ? `  → ${moves}` : ''}`,
  )
}
const readout = (n, value, channel) => {
  const knob = shown.get(`${channel}:${n}`) ?? { at: 0 }
  shown.set(`${channel}:${n}`, knob)
  clearTimeout(knob.stop)
  if (performance.now() - knob.at > 150) {
    knob.at = performance.now()
    showKnob(n, value, channel)
  } else knob.stop = setTimeout(() => showKnob(n, value, channel), 150)
}
let hinted = false

// the hit in `pattern` nearest to `at`: its sound, filters and space for the key.
// Only hits you can hear (not a silent tick carrying the room), and further out
// when the part rests here: the pad's page plays the pad after its last chord too
const nearest = (pattern, at) => {
  for (const reach of [1, 8, 64, 256]) {
    const hap = pattern
      .queryArc(at - reach, at + reach)
      .filter((h) => h.hasOnset() && (h.value.gain ?? 1) > 0)
      .reduce((best, h) => (!best || Math.abs(h.whole.begin - at) < Math.abs(best.whole.begin - at) ? h : best), null)
    if (hap) return hap
  }
  return null
}

// the instrument the keys play: the page in use (the last knob turned there),
// else the part in midi(), else the first page's
const instrument = () =>
  midiStore.instruments?.[midiStore.page] ?? midiStore.keys ?? Object.values(midiStore.instruments ?? {})[0]

const noteOff = (id) => {
  sounding.delete(id)
  dirt.send(message('/dstudio/key/off', [id]))
}

// a key's params from the part's hit: the key's velocity on top of the part's own
const keyParams = (hap, velocity, cps) =>
  toDirt(
    hap.withValue((v) => ({ ...v, velocity: (v.velocity ?? 1) * (velocity / 127) })),
    cps,
  )

// a MIDI key number as a note name: 45 → A2 (60 is C4, as strudel spells them)
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const noteName = (key) => `${NAMES[key % 12]}${Math.floor(key / 12) - 1}`

const keyDown = (key, velocity) => {
  const keys = instrument()
  if (!keys) {
    if (!hinted) console.log('MIDI: no instrument — wrap a part in midi() (lib/midi.js), e.g. throws: midi(throws)')
    hinted = true
    return
  }
  // each key as it's pressed, to read back what was played
  console.log(`MIDI key ${noteName(key)} (${key})  velocity ${velocity}${keys.name ? ` → ${keys.name}` : ''}`)
  // the bar you hear: the scheduler's clock runs LATENCY ahead
  const cps = scheduler.cps
  const hap = nearest(keys.pattern, scheduler.now() - LATENCY * cps)
  if (!hap) return
  // the key fades out as the part's notes do (the pad's long release), else midi()'s
  const params = { ...keyParams(hap, velocity, cps), midinote: key, sustain: keys.hold }
  params.fadeTime = params.release ?? keys.release
  // the key holds as long as it's down. SuperDirt's envelope (on whenever attack or
  // release is set) holds for `hold`, which is 0 unless the part sets one, so a
  // part with only attack and release died after them however long the key was
  // down. A part that sets its own hold (subFlow holds each chord's length) gets
  // the key's instead too
  if (params.hold !== undefined || params.attack !== undefined || params.release !== undefined) params.hold = keys.hold
  delete params.freq
  if (down.has(key)) keyUp(key)
  const id = ++noteId
  down.set(key, id)
  sounding.set(id, { at: hap.whole.begin.valueOf(), velocity, gain: params.gain, pattern: keys.pattern })
  dirt.send(message('/dstudio/key/on', [id, ...Object.entries(params).flat()]))
}

const keyUp = (key) => {
  const id = down.get(key)
  if (id === undefined) return
  down.delete(key)
  if (pedal.down) pedal.held.add(id)
  else noteOff(id)
}

// ── Live space: a knob turn reaches the echoes and reverb already ringing ──
// SuperDirt's delay and reverb belong to the orbit and take their settings from
// the latest event there. So on a turn each orbit gets a silent event carrying its
// part's settings as they are now. Hits already queued (LATENCY ahead) still carry
// the old values: one more silent event after they've played makes the turn stick
// d-studio's own orbit settings too (superdirt/space.scd, spring.scd, drive.scd), so they
// answer a turn as fast as SuperDirt's
const SPACE = [
  'delay',
  'delaytime',
  'delayfeedback',
  'lock',
  'room',
  'size',
  'delayfreq',
  'delaywidth',
  'delayroom',
  'delaydiffuse',
  'delayspread',
  'delaywander',
  'drylevel',
  'spring',
  'springdecay',
  'springtone',
  'drive',
  'drivetone',
  'drivelpf',
]
let playing = silence
const space = () => {
  const cps = scheduler.cps
  const at = scheduler.now() - LATENCY * cps
  const closest = new Map()
  // a muted part isn't playing, but its keys are: its orbit follows the knobs too
  const muted = midiStore.keys?.muted ? midiStore.keys.pattern.queryArc(at - 1, at + 1) : []
  for (const hap of [...playing.queryArc(at - 1, at + 1), ...muted]) {
    if (!hap.hasOnset()) continue
    const orbit = hap.value.orbit ?? 0
    const best = closest.get(orbit)
    if (!best || Math.abs(hap.whole.begin - at) < Math.abs(best.whole.begin - at)) closest.set(orbit, hap)
  }
  return [...closest].flatMap(([orbit, hap]) => {
    const p = toDirt(hap, cps)
    const settings = Object.fromEntries(SPACE.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]))
    if (!Object.keys(settings).length) return []
    return [message('/dirt/play', { s: 'dclick', gain: 0, sustain: 0.02, orbit, cps, ...settings })]
  })
}
const sendSpace = (ahead) => {
  const at = toUnix(now() + ahead)
  for (const m of space()) dirt.send(bundle(at, m))
}
// held keys follow the knobs too: what can change in a note while it rings
// (the filters' cutoff and resonance, phaser, the synth's voice, pan) goes
// straight to its synths. Level as amp, relative to where the note started
// (SuperDirt's amp is 0.4 × gain⁴, and the note's gain is fixed at its start)
const LIVE = ['cutoff', 'resonance', 'hcutoff', 'hresonance', 'phaserrate', 'phaserdepth', 'voice', 'pan']
const reshape = () => {
  const cps = scheduler.cps
  for (const [id, note] of sounding) {
    // the same hit of its own instrument again (its random nudges are fixed by
    // time), with the knobs as they are now
    const hap = nearest(note.pattern, note.at)
    if (!hap) continue
    const p = keyParams(hap, note.velocity, cps)
    const live = LIVE.filter((k) => p[k] !== undefined).flatMap((k) => [k, p[k]])
    dirt.send(message('/dstudio/key/set', [id, ...live, 'amp', 0.4 * (p.gain / note.gain) ** 4]))
  }
}

let spaceTimer
let spaceSettle
const turnSpace = () => {
  // at most every 40 ms while turning
  spaceTimer ??= setTimeout(() => {
    spaceTimer = null
    sendSpace(0.03)
    reshape()
  }, 40)
  clearTimeout(spaceSettle)
  spaceSettle = setTimeout(() => sendSpace(LATENCY + 0.05), 100)
}

const knob = (n, value, channel) => {
  // the sustain pedal holds the notes whose keys come up until it's released
  if (n === 64) {
    pedal.down = value >= 64
    if (pedal.down) return
    pedal.held.forEach(noteOff)
    pedal.held.clear()
    return
  }
  midiStore.cc[n] = value / 127
  ;(midiStore.channels[channel] ??= {})[n] = value / 127
  // a knob turned on a page with an instrument hands the keys to it. The MiniLab
  // sends nothing when you switch memory, so a turn is the first sign of it
  const page = (controller.pages?.indexOf(channel) ?? -1) + 1
  if (midiStore.instruments?.[page] && midiStore.page !== page) {
    midiStore.page = page
    console.log(`MIDI keys → ${midiStore.instruments[page].name} (page ${page})`)
  }
  readout(n, value, channel)
  turnSpace()
}

// pads (lib/controllers/) aren't keys: they print which pad, for now, and play nothing
const padOf = (note, channel) =>
  channel === controller.pads?.channel ? controller.pads.notes.indexOf(note) + 1 || null : null
const closeMidi = listen({
  onNoteOn: (key, velocity, channel) => {
    const pad = padOf(key, channel)
    if (pad) console.log(`MIDI pad(${pad})  velocity ${velocity}`)
    else keyDown(key, velocity)
  },
  onNoteOff: (key, channel) => padOf(key, channel) || keyUp(key),
  onCC: knob,
  log: console.log,
})

// ── Boot ──
try {
  const track = await load()
  await apply(track)
  await scheduler.start()
  display.playing = true
  show()
  const length = track.bars ? ` · ${mmss(track.bars / (track.bpm / 240))} (${track.bars} bars)` : ''
  const looping = loop ? ` · looping bars ${loop.from}–${loop.to}` : ''
  const pages = Object.entries(track.instruments).map(([page, { name }]) => `${page} ${name}`)
  const keys = pages.length ? ` · keys by page: ${pages.join(' · ')}` : track.keys ? ' · keys: midi()' : ''
  const muted = track.muted ? ` · ${track.muted}: the keys only` : ''
  console.log(
    `▶ ${trackName} · ${track.bpm} BPM${length}${looping} · ${LATENCY * 1000} ms latency · lanes: ${track.lanes.join(' ')}${keys}${muted}`,
  )
} catch (err) {
  console.error(`✗ ${trackName}: ${err.message}`)
  process.exit(1)
}

// ── Hot reload: any save in tracks/ or lib/ ──
// all of tracks/, not just this one: a track can play another's parts
// (arctic-circle-node-mix wraps arctic-circle, lantern-ambient borrows from harbor)
let pending
const reload = () => {
  clearTimeout(pending)
  pending = setTimeout(async () => {
    try {
      const track = await load()
      await apply(track)
      show()
      console.log(`↻ ${clock()} updated · lanes: ${track.lanes.join(' ')}`)
    } catch (err) {
      console.log(`✗ ${clock()} ${err.message} — still playing the last good version`)
    }
  }, 60)
}
for (const dir of [TRACKS, new URL('lib/', ROOT)]) {
  watch(dir, { recursive: true }, (_event, file) => file?.endsWith('.js') && reload())
}

process.on('SIGINT', async () => {
  // nothing left ringing for hold seconds after the engine is gone
  ;[...down.values(), ...pedal.held].forEach(noteOff)
  closeMidi()
  scheduler.stop()
  report()
  dirt.close()
  clearInterval(heartbeat)
  display.playing = false
  await show()
  process.exit(0)
})

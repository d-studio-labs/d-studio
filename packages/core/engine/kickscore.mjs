// `d-studio kick-score <kick.wav>`: scores a solo kick export. Quality is measured: the
// headroom to the limiter, and how closely the kick's band balance matches a kick you pick
// as the target. Vibe is yours: the 0–10 you give it with --vibe. Every run appends to
// mastering/kick-scores.jsonl, so changes can be compared over time.
//
//   export a kick:    d-studio export <track> --solo kick --bars 2 --out kick.wav
//   learn a target:   d-studio kick-score kick-good.wav --learn mastering/kick-ref.json
//   score a kick:     d-studio kick-score kick.wav --ref mastering/kick-ref.json --vibe 0
//
// Band levels are relative to each file's own broadband level, so the comparison doesn't
// depend on how loud the kick is. Scores: 10 = best; LOW ≤ 3, MID 4–6, HIGH ≥ 7.
import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeBands, measureLoudness } from './mastering.mjs'
import { PROJECT } from './project.mjs'

const [file, ...rest] = process.argv.slice(2)
const flags = {}
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i]
}
if (!file) {
  console.log('usage: d-studio kick-score <kick.wav> [--ref kick-ref.json] [--learn out.json] [--vibe 0-10]')
  process.exit(1)
}
if (spawnSync('ffmpeg', ['-version']).status !== 0) {
  console.error('✗ ffmpeg not found (brew install ffmpeg)')
  process.exit(1)
}

// the limiter's ceiling is −1 dB (superdirt/master.scd). Peaks from −6 to −1 dBTP score full
// headroom; each dB outside that band costs 2 points.
const HOT = -1
const LOW = -6
// each dB of mean band error costs 2 points: 5 dB off on average scores 0
const POINTS_PER_DB = 2

const label = (s) => (s == null ? '—' : s <= 3 ? 'LOW' : s < 7 ? 'MID' : 'HIGH')
const clamp = (x) => Math.max(0, Math.min(10, x))
const round = (x) => Math.round(x * 10) / 10

function headroomScore(tp) {
  const over = tp > HOT ? tp - HOT : tp < LOW ? LOW - tp : 0
  return clamp(10 - POINTS_PER_DB * over)
}

// astats' overall peak and RMS (the last level block ffmpeg prints)
function levels(src) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', src, '-af', 'astats=metadata=0', '-f', 'null', '-'],
    {
      encoding: 'utf8',
    },
  )
  const last = (re) => {
    const v = [...r.stderr.matchAll(re)].at(-1)?.[1]
    return v === undefined ? null : v === '-inf' ? -Infinity : Number(v)
  }
  return { peak: last(/Peak level dB:\s*(-?[\d.]+|-inf)/g), rms: last(/RMS level dB:\s*(-?[\d.]+|-inf)/g) }
}

const src = resolve(file)
const { bands } = analyzeBands(src)
const loud = measureLoudness(src, { lufs: -14, tp: -1 })
// loudnorm returns no value for very short sounds (a 40 ms click): show —, not NaN
const lufs = Number.isFinite(Number(loud.input_i)) ? Number(loud.input_i) : null
const tp = Number(loud.input_tp)
const lv = levels(src)
const crest = lv.peak == null || lv.rms == null ? null : round(lv.peak - lv.rms)
const shape = bands.map(({ name, lo, hi, relative }) => ({ name, lo, hi, relative: round(relative) }))

if (flags.learn) {
  const out = resolve(flags.learn)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(
    out,
    JSON.stringify({ lufs: lufs == null ? null : round(lufs), tp: round(tp), bands: shape }, null, 2) + '\n',
  )
  console.log(`✓ kick target saved: ${out}`)
  process.exit(0)
}

const headroom = headroomScore(tp)
let profile = null
let meanDev = null
if (flags.ref) {
  const ref = JSON.parse(readFileSync(resolve(flags.ref), 'utf8'))
  const devs = shape.map((b) => {
    const r = ref.bands.find((x) => x.name === b.name)
    return r ? Math.abs(b.relative - r.relative) : 0
  })
  meanDev = round(devs.reduce((a, b) => a + b, 0) / devs.length)
  profile = clamp(10 - POINTS_PER_DB * meanDev)
}
// quality needs a target to compare against; without --ref it's the headroom check alone
const quality = profile == null ? null : round((headroom + profile) / 2)

let vibe = null
if (flags.vibe !== undefined) {
  vibe = Number(flags.vibe)
  if (!Number.isFinite(vibe) || vibe < 0 || vibe > 10) {
    console.error('✗ --vibe takes 0–10')
    process.exit(1)
  }
}

console.log(`── ${basename(src)} ──`)
console.log(`  loudness   ${lufs == null ? '—' : round(lufs)} LUFS · ${round(tp)} dBTP · crest ${crest ?? '—'} dB`)
console.log(`  bands      ${shape.map((b) => `${b.name} ${b.relative >= 0 ? '+' : ''}${b.relative}`).join(' · ')}`)
console.log(`  headroom   ${round(headroom)}/10 ${label(headroom)}`)
if (profile == null) {
  console.log('  profile    — (no --ref: learn a target from a kick you like with --learn)')
} else {
  console.log(`  profile    ${round(profile)}/10 ${label(profile)} · mean band error ${meanDev} dB`)
}
console.log(`  quality    ${quality == null ? '—' : `${quality}/10 ${label(quality)}`}`)
console.log(`  vibe       ${vibe == null ? '— (pass --vibe 0-10)' : `${vibe}/10 ${label(vibe)} (yours)`}`)

const logPath = fileURLToPath(new URL('mastering/kick-scores.jsonl', PROJECT))
mkdirSync(dirname(logPath), { recursive: true })
appendFileSync(
  logPath,
  JSON.stringify({
    at: new Date().toISOString(),
    file: basename(src),
    ref: flags.ref ?? null,
    lufs: lufs == null ? null : round(lufs),
    tp: round(tp),
    crest,
    bands: shape,
    headroom: round(headroom),
    meanBandErrorDb: meanDev,
    profile: profile == null ? null : round(profile),
    quality,
    vibe,
  }) + '\n',
)

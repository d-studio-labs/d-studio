// ── Analyzed mastering: measure a mix against a reference curve, then correct ──
// `learn-reference.mjs` builds the reference from a master you like; `export.mjs`'s
// `--master` flag uses these same functions to analyze and correct each export.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** Bands the analyzer measures RMS in — wide enough to stay stable on music, not noise. */
export const BANDS = [
  { name: 'sub', lo: 20, hi: 60 },
  { name: 'bass', lo: 60, hi: 150 },
  { name: 'lowMid', lo: 150, hi: 400 },
  { name: 'mid', lo: 400, hi: 1000 },
  { name: 'presence', lo: 1000, hi: 3000 },
  { name: 'highMid', lo: 3000, hi: 8000 },
  { name: 'air', lo: 8000, hi: 18000 },
]

/**
 * The "Overall" RMS level ffmpeg's astats prints last, after any per-channel lines.
 *
 * @param {string} file
 * @param {string} filter ffmpeg -af chain, e.g. `'highpass=f=60,lowpass=f=150,astats=metadata=0'`
 * @returns {number} dB, or -Infinity for a silent band
 */
function rmsOf(file, filter) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', filter, '-f', 'null', '-'], {
    encoding: 'utf8',
  })
  const last = [...r.stderr.matchAll(/RMS level dB:\s*(-?[\d.]+|-inf)/g)].at(-1)?.[1]
  return last === '-inf' ? -Infinity : Number(last)
}

/**
 * Per-band RMS, each expressed relative to the file's own broadband RMS so the
 * curve describes tonal *balance* and stays comparable across tracks at different
 * loudnesses.
 *
 * @param {string} file
 * @returns {{ broadbandRms: number, bands: Array<{ name: string, lo: number, hi: number, rms: number, relative: number }> }}
 */
export function analyzeBands(file) {
  const broadbandRms = rmsOf(file, 'astats=metadata=0')
  const bands = BANDS.map(({ name, lo, hi }) => {
    const rms = rmsOf(file, `highpass=f=${lo},lowpass=f=${hi},astats=metadata=0`)
    return { name, lo, hi, rms, relative: rms - broadbandRms }
  })
  return { broadbandRms, bands }
}

/**
 * ffmpeg loudnorm's measure pass. `I`/`TP` only shape `target_offset`, not the
 * measured values, but pass the real target anyway so that offset is usable.
 *
 * @param {string} file
 * @param {{ lufs: number, tp: number }} target
 * @returns {{ input_i?: string, input_tp?: string, input_lra?: string, input_thresh?: string, target_offset?: string }}
 */
export function measureLoudness(file, { lufs, tp }) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', file, '-af', `loudnorm=I=${lufs}:TP=${tp}:print_format=json`, '-f', 'null', '-'],
    { encoding: 'utf8' },
  )
  // the json block is followed by ffmpeg's own muxing summary — bound the slice
  // on the matching close brace, or JSON.parse throws on that trailing text
  return JSON.parse(r.stderr.match(/\{[^{}]*\}/s)?.[0] ?? '{}')
}

/**
 * ffmpeg loudnorm's apply pass, linear (a single gain, not dynamic range
 * compression) using stats already measured from this same file.
 *
 * @param {string} file
 * @param {string} outFile
 * @param {{ lufs: number, tp: number, stats: object }} opts
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
export function applyLoudnorm(file, outFile, { lufs, tp, stats }) {
  return spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    file,
    '-af',
    `loudnorm=I=${lufs}:TP=${tp}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:` +
      `measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`,
    '-c:a',
    'pcm_s24le',
    outFile,
  ])
}

/**
 * @param {string} path
 * @returns {{ lufs: number, tp: number, bands: Array<{ name: string, lo: number, hi: number, relative: number }> }}
 */
export function loadReference(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * Per-band gain correction toward `reference`'s curve, clamped to `maxDb` so a
 * track that's intentionally dark or bright isn't fought into submission.
 *
 * @param {{ bands: Array<{ name: string, relative: number }> }} analyzed
 * @param {{ bands: Array<{ name: string, lo: number, hi: number, relative: number }> }} reference
 * @param {number} [maxDb]
 * @returns {Array<{ name: string, lo: number, hi: number, delta: number }>}
 */
export function correctionFor(analyzed, reference, maxDb = 6) {
  return reference.bands.map((ref) => {
    const found = analyzed.bands.find((b) => b.name === ref.name)
    const delta = found && Number.isFinite(found.relative) ? ref.relative - found.relative : 0
    return { name: ref.name, lo: ref.lo, hi: ref.hi, delta: Math.max(-maxDb, Math.min(maxDb, delta)) }
  })
}

/**
 * An ffmpeg `firequalizer` filter applying per-band corrections, each gain point
 * placed at its band's geometric center.
 *
 * @param {Array<{ lo: number, hi: number, delta: number }>} corrections
 * @returns {string} a complete `-af` filter string
 */
export function firequalizerFilter(corrections) {
  const entries = corrections
    .map(({ lo, hi, delta }) => `entry(${Math.round(Math.sqrt(lo * hi))},${delta.toFixed(2)})`)
    .join(';')
  return `firequalizer=gain_entry='${entries}'`
}

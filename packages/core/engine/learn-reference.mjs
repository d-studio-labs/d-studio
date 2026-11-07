// `d-studio learn-reference <file.wav>`: analyzes a master you like and saves its
// loudness + tonal curve as the house-sound target `export --master` corrects
// every track toward. Re-run it any time you want to change that target.
//
//   --out mastering/reference.json   where to save it (default)
//   --lufs -14                       loudness target (default: the file's own)
//   --tp -1                          true-peak ceiling (default: -1, a safe margin
//                                     for lossy transcoding even if the file peaks hotter)
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeBands, measureLoudness } from './mastering.mjs'
import { PROJECT } from './project.mjs'

const [file, ...rest] = process.argv.slice(2)
const flags = {}
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i]
}
if (!file) {
  console.log('usage: d-studio learn-reference <file.wav> [--out mastering/reference.json] [--lufs -14] [--tp -1]')
  process.exit(1)
}
if (spawnSync('ffmpeg', ['-version']).status !== 0) {
  console.error('✗ ffmpeg not found (brew install ffmpeg)')
  process.exit(1)
}

const src = resolve(file)
const tp = Number(flags.tp ?? -1)
const measured = measureLoudness(src, { lufs: Number(flags.lufs ?? -14), tp })
if (measured.input_i == null) {
  console.error('✗ could not read loudness (unexpected ffmpeg output)')
  process.exit(1)
}
const lufs = Number(flags.lufs ?? measured.input_i)
const { bands } = analyzeBands(src)

const reference = {
  lufs,
  tp,
  bands: bands.map(({ name, lo, hi, relative }) => ({ name, lo, hi, relative: Number(relative.toFixed(2)) })),
}

const outPath = resolve(fileURLToPath(new URL(flags.out ?? 'mastering/reference.json', PROJECT)))
mkdirSync(resolve(outPath, '..'), { recursive: true })
writeFileSync(outPath, JSON.stringify(reference, null, 2) + '\n')

console.log(`✓ ${outPath}`)
console.log(`  target ${reference.lufs} LUFS · ${reference.tp} dBTP`)
for (const b of reference.bands) {
  console.log(
    `  ${b.name.padEnd(10)} ${String(b.lo).padStart(5)}–${String(b.hi).padEnd(5)} Hz  ${b.relative >= 0 ? '+' : ''}${b.relative} dB rel.`,
  )
}

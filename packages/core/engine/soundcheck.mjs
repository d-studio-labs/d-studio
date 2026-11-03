// `d-studio test <track>`: parses the track, then solo-renders each part through
// SuperDirt and flags any that come back effectively silent (wrong sample/synth
// name, a filter that eats the whole signal, etc.). Needs `d-studio dirt` running.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { unlinkSync } from 'node:fs'
import { loadTrack } from './track.mjs'
import { PROJECT } from './project.mjs'

const [trackName] = process.argv.slice(2)
if (!trackName) {
  console.log('usage: d-studio test <track>')
  process.exit(1)
}

const mod = await loadTrack(new URL(`tracks/${trackName}/`, PROJECT))
const parts = Object.keys(mod.parts ?? {})
if (!parts.length) {
  console.error(`✗ ${trackName}: no parts`)
  process.exit(1)
}

const SILENCE_LUFS = -50
const cli = fileURLToPath(new URL('cli.mjs', import.meta.url))
let failed = false
let noFfmpeg = false

console.log(`── ${trackName}: checking ${parts.length} part(s) for silence (< ${SILENCE_LUFS} LUFS) ──`)
for (const part of parts) {
  const out = join(tmpdir(), `d-studio-test-${trackName}-${part}.wav`)
  const r = spawnSync(
    process.execPath,
    [cli, 'export', trackName, '--solo', part, '--bars', '2', '--tail', '0', '--out', out],
    { encoding: 'utf8' },
  )
  if (r.status !== 0) {
    failed = true
    console.log(`  ${part}: ✗ export failed\n${(r.stdout + r.stderr).trim()}`)
    continue
  }
  const lufs = r.stdout.match(/(-?[\d.]+) LUFS integrated/)?.[1]
  try {
    unlinkSync(out)
  } catch {}
  if (!lufs) {
    noFfmpeg = true
    console.log(`  ${part}: ? can't measure (ffmpeg not found)`)
  } else if (Number(lufs) < SILENCE_LUFS) {
    failed = true
    console.log(`  ${part}: ✗ ${lufs} LUFS — effectively silent`)
  } else {
    console.log(`  ${part}: ✓ ${lufs} LUFS`)
  }
}

if (noFfmpeg) console.log('  (install ffmpeg to enable the silence check: brew install ffmpeg)')
if (failed) {
  console.log(`✗ ${trackName}: one or more parts are silent — check sample/synth names and filters`)
  process.exit(1)
}
console.log(`✓ ${trackName}: every part makes sound`)

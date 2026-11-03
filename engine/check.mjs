// Headless sanity check: `npm run check` (every track) or `npm run check fog`
// Parses every part and counts events per cycle, without any audio.
import { miniAllStrings } from '@strudel/mini'
import { readdir } from 'node:fs/promises'
import { loadTrack } from './track.mjs'
import { PROJECT } from './project.mjs'

miniAllStrings()

const TRACKS = new URL('tracks/', PROJECT)
const names = process.argv.slice(2)
const tracks = names.length
  ? names
  : (await readdir(TRACKS, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

const CYCLES = 16
let failed = false

for (const track of tracks) {
  let mod
  try {
    mod = await loadTrack(new URL(`${track}/`, TRACKS))
  } catch (e) {
    failed = true
    console.log(`── ${track}: ERROR ${e.message}\n`)
    continue
  }
  const { parts, BPM } = mod
  console.log(`── ${track} · BPM ${BPM} — events per cycle, cycles 0–${CYCLES - 1}`)
  for (const [name, pat] of Object.entries(parts ?? {})) {
    if (!pat) continue
    try {
      const row = []
      for (let c = 0; c < CYCLES; c++) {
        row.push(pat.queryArc(c, c + 1).filter((h) => h.hasOnset()).length)
      }
      console.log(name.padEnd(8), row.map((n) => String(n).padStart(2)).join(' '))
    } catch (e) {
      failed = true
      console.log(name.padEnd(8), 'ERROR:', e.message)
    }
  }
  console.log()
}
process.exit(failed ? 1 : 0)

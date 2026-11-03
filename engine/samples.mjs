// Download drum machines for SuperDirt: `npm run samples [-- RolandTR707 LinnDrum]` (default 909 + 808)
// Each "<Bank>_<sound>" becomes a samples/ folder in the project; existing files are skipped.
import { mkdir, writeFile, access } from 'node:fs/promises'
import { basename } from 'node:path'
import { PROJECT } from './project.mjs'

const MAP = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json'
const OUT = new URL('samples/', PROJECT)
const banks = process.argv.slice(2).length ? process.argv.slice(2) : ['RolandTR909', 'RolandTR808']

const map = await (await fetch(MAP)).json()
const base = map._base
const exists = (url) =>
  access(url).then(
    () => true,
    () => false,
  )

const jobs = []
for (const [key, files] of Object.entries(map)) {
  if (!banks.some((b) => key.startsWith(`${b}_`))) continue
  // keys are "RolandTR909_bd"; keep only safe names for folders and files
  if (!/^[A-Za-z0-9_-]+$/.test(key)) continue
  const dir = new URL(`${key}/`, OUT)
  await mkdir(dir, { recursive: true })
  for (const path of [files].flat()) {
    const name = basename(path)
    if (!/\.(wav|aiff?|flac)$/i.test(name)) continue
    jobs.push({ key, url: base + path, file: new URL(encodeURIComponent(name), dir) })
  }
}

const missing = banks.filter((b) => !jobs.some((j) => j.key.startsWith(`${b}_`)))
if (missing.length) console.log(`not in the map: ${missing.join(', ')}`)

let done = 0,
  skipped = 0,
  failed = 0
const worker = async () => {
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    if (await exists(job.file)) {
      skipped++
      continue
    }
    const res = await fetch(job.url)
    if (!res.ok) {
      failed++
      console.log(`✗ ${res.status} ${job.url}`)
      continue
    }
    await writeFile(job.file, Buffer.from(await res.arrayBuffer()))
    done++
  }
}
const total = jobs.length
await Promise.all(Array.from({ length: 8 }, worker))
console.log(
  `${banks.join(', ')}: ${done} downloaded, ${skipped} already there, ${failed} failed (of ${total}) → samples/`,
)
console.log('restart `npm run dirt` to load them')

// ── Loading a track: its index.js, with its controls.js (if it has one) on top ──
// One place for headless.mjs, export.mjs and check.mjs, so a track's knobs reach
// every one of them. `query` (?v=N) makes Node re-evaluate the files (resolve-hook.mjs).
import { existsSync } from 'node:fs'
import { controls, describeControls } from '../lib/midi.js'

// what lib/midi.js shares: knob values, and the midi() a track evaluation leaves behind
const midiStore = (globalThis.__dstudioMidi ??= { cc: {} })

/**
 * @param {URL} dir the track's folder, e.g. tracks/arctic-circle-live-mix/
 * @param {string} [query]
 * @returns {Promise<object>} the module, with `parts` under the knobs,
 *   `instruments`: page → the part the keys play on that page, and `muted`: the
 *   part only the keys play (midi(p, { muted: true })), or null
 */
export async function loadTrack(dir, query = '') {
  midiStore.next = null
  midiStore.names = {}
  const mod = await import(new URL(`index.js${query}`, dir).href)
  if (!mod.parts) return { ...mod, instruments: {}, muted: null }
  // the part midi() wraps (wrapped last in index.js, so it's the part itself)
  const keys = midiStore.next
  const keysPart = keys ? (Object.keys(mod.parts).find((n) => mod.parts[n] === keys.pattern) ?? null) : null
  const muted = keys?.muted ? keysPart : null
  if (keys?.muted && !keysPart) console.warn('midi(): muted, but no part is the one it wraps: wrap it in midi() last')

  const file = new URL('controls.js', dir)
  if (!existsSync(file)) return { ...mod, instruments: {}, muted }
  const { default: map } = await import(new URL(`controls.js${query}`, dir).href)
  // the knob sheet once per change, not on every reload
  const { sheet, names, problems } = describeControls(mod.parts, map)
  for (const p of problems) console.warn(`controls: ${p}`)
  if (midiStore.sheet !== sheet) console.log(`knobs: ${sheet}`)
  midiStore.sheet = sheet
  // for the engine's readout: what a knob moves on each page
  midiStore.names = names
  // each page's instrument, the keys play it while that page is in use: the
  // first part the page names that the track has (a lane commented out isn't one)
  const instruments = {}
  for (const [key, name] of Object.entries(names)) {
    const [page] = key.split(':')
    const part = name.split('.')[0]
    if (page && mod.parts[part]) instruments[page] ??= part
  }
  const parts = controls(mod.parts, map)
  // the keys play the part they wrap as it sounds now, knobs and all
  if (keysPart) keys.pattern = parts[keysPart]
  else if (keys && Object.keys(map).length)
    console.warn('controls: the keys play a part without its knobs: wrap it in midi() last')
  return { ...mod, parts, instruments, muted }
}

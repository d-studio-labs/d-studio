// Strudel hap → SuperDirt /dirt/play params.
// Mirrors parseControlsFromHap in @strudel/osc, without its websocket bridge.
import { parseNumeral, isNote, noteToMidi } from '@strudel/core'
import { readdirSync } from 'node:fs'
import { PROJECT } from './project.mjs'

// sample folders from `npm run samples` (RolandTR909_bd, …), read once at startup
const SAMPLES = (() => {
  try {
    return new Set(readdirSync(new URL('samples/', PROJECT)))
  } catch {
    return new Set()
  }
})()
// sample names superdough has but Dirt-Samples spells differently
const ALIASES = { oh: '808oh' }

// superdough: gain (default 0.8) × velocity; SuperDirt: amp 0.4 × gain⁴.
// Solve 0.4·G⁴ = g·v so the same numbers give roughly the same level.
const dirtGain = (gain = 0.8, velocity = 1) => (Math.max(0, gain * velocity) / 0.4) ** 0.25

/**
 * Map a Strudel hap to SuperDirt /dirt/play params.
 *
 * @param {import('@strudel/core').Hap} hap
 * @param {number} cps
 * @returns {Record<string, number | string>}
 */
export const toDirt = (hap, cps) => {
  hap.ensureObjectValue()
  const c = {
    ...hap.value,
    cps,
    cycle: hap.wholeOrPart().begin.valueOf(),
    delta: hap.duration.valueOf() / cps,
  }
  if (c.n !== undefined) c.n = parseNumeral(c.n)
  // a numeric note is MIDI, as in superdough; SuperDirt's own `note` counts from C5
  if (c.note !== undefined) {
    c.midinote = isNote(c.note) ? noteToMidi(c.note, c.octave ?? 3) : parseNumeral(c.note)
    delete c.note
  }
  // .bank("RolandTR909") + "bd" → "RolandTR909_bd", like the browser, when that
  // folder was downloaded; otherwise fall back to Dirt-Samples' bd/cp/hh
  const banked = c.bank && `${c.bank}_${c.s}`
  if (banked && SAMPLES.has(banked)) c.s = banked
  else c.s = ALIASES[c.s] ?? c.s
  delete c.bank
  c.gain = dirtGain(c.gain, c.velocity)
  delete c.velocity
  // superdough's ADSR levels have no SuperDirt equivalent, and SuperDirt reads
  // `sustain` as the note's total length: sustain(0) would drop the note
  delete c.sustain
  delete c.decay
  // .legato()/.clip() already stretched the hap, so delta is the note length.
  // SuperDirt would multiply by legato again (sustain = delta × legato): send it as sustain
  if (c.clip !== undefined) c.sustain = c.delta
  delete c.clip
  // filter Q → SuperDirt's 0–1 resonance (RLPF rq = 1000^-resonance, so Q = 1000^r)
  for (const k of ['resonance', 'hresonance']) {
    if (c[k] !== undefined) c[k] = Math.min(1, Math.log(Math.max(1, c[k])) / Math.log(1000))
  }
  // nudge (seconds) → SuperDirt's lag, added to the event's latency
  if (c.nudge !== undefined) c.lag = c.nudge
  delete c.nudge
  // Strudel stores .sz()/.size() as roomsize; SuperDirt reads size
  if (c.roomsize !== undefined) c.size = parseNumeral(c.roomsize)
  // speed in cycle units: SuperDirt applies cps itself
  if (c.unit === 'c' && c.speed != null) c.speed = c.speed / cps
  // OSC carries only floats and strings
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === 'boolean') c[k] = v ? 1 : 0
    // .duckorbit("3:5") & co: a list, one value per orbit → "3 5" (superdirt/master.scd)
    else if (k.startsWith('duck') && Array.isArray(v)) c[k] = v.join(' ')
    else if (typeof v !== 'number' && typeof v !== 'string') c[k] = JSON.stringify(v)
  }
  return c
}

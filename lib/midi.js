// ── Live MIDI: knobs as signals, keys played through a part ──
// The engine (engine/midi.mjs) fills the store; in the browser it stays empty,
// so cc() holds its initial value and midi() changes nothing.
import * as strudel from '@strudel/core'
// the controller in use: which CC each knob sends, which notes are pads
import controller from './controllers/arturia-minilab-mk2.js'

/** @typedef {import('@strudel/core').Pattern} Pattern */

// on globalThis: hot reload re-evaluates this file, the knob positions stay.
// cc: the last value of each CC, whatever the channel; channels: per channel, so
// each controller memory (page) keeps its own
const store = (globalThis.__dstudioMidi ??= { cc: {} })
store.channels ??= {}

/**
 * A knob or fader, 0–1, read every time the pattern is queried. Until it's moved
 * it sits at `initial`. Turn a knob: the engine prints its number.
 *
 * @example
 * .lpf(cc(74).range(300, 3000))
 * @param {number} n CC number
 * @param {number} [initial]
 * @returns {Pattern}
 */
export const cc = (n, initial = 0.5) => strudel.signal(() => store.cc[n] ?? initial)

export { controller }
// the knobs' CC numbers, by place on the controller
export const KNOBS = controller.knobs

/**
 * A knob by its place on the controller (1–16), see lib/controllers/. With a
 * `page`, only that controller memory moves it (Shift + pad 1–8 on the MiniLab).
 *
 * @example
 * .roomsize(knob(2).range(0.8, 0.97))
 * @param {number} i 1–16
 * @param {number} [initial]
 * @param {number} [page] 1–8
 * @returns {Pattern}
 */
export const knob = (i, initial = 0.5, page) => {
  if (!page) return cc(KNOBS[i - 1], initial)
  const channel = controller.pages[page - 1]
  return strudel.signal(() => store.channels[channel]?.[KNOBS[i - 1]] ?? initial)
}

/**
 * A knob as a multiplier around what the track wrote: ×1 in the centre (and
 * until it's touched), ×`low` fully left, ×`high` fully right. For `.mul()`, so
 * the arrangement's own moves keep going underneath.
 *
 * @example
 * .mul(gain(around(7, 0, 2)))
 * @param {number} i 1–16
 * @param {number} low
 * @param {number} high
 * @returns {Pattern}
 */
export const around = (i, low, high) =>
  knob(i).fmap((x) => (x < 0.5 ? low + (1 - low) * x * 2 : 1 + (high - 1) * (x - 0.5) * 2))

/**
 * Play the keys through this pattern: each key takes the sound, filters and space
 * of the pattern's nearest hit at the bar that's playing, with the key's pitch and
 * velocity, held for as long as the key (or the sustain pedal) is down. Returns
 * the pattern unchanged, so it can wrap a part in place. `muted`: the part itself
 * stays silent and only the keys play it (taking over a line live).
 *
 * @example
 * throws: midi(throws)
 * bass: midi(subFlow, { muted: true })
 * @param {Pattern} pattern
 * @param {{ release?: number, hold?: number, muted?: boolean }} [options] fade
 *   after the key comes up (s); longest a note can ring (s); the keys only
 * @returns {Pattern}
 */
export const midi = (pattern, { release = 0.3, hold = 30, muted = false } = {}) => {
  store.next = { pattern, release, hold, muted }
  return pattern
}

// ── A track's knob map (its controls.js), put on top of the parts ──

// how far a knob may push, whatever the map says: echo feedback above 0.95 builds
// forever, a reverb size above 0.97 rings metallic
const CAPS = { delay: 1, delayfeedback: 0.95, room: 1, roomsize: 0.97 }

/**
 * @typedef {object} Knob
 * @property {string} set the control it moves: 'lpf', 'room', 'gain' …
 * @property {[number, number]} [range] sets the value outright, min … max
 * @property {[number, number]} [scale] ×min … ×max what the part wrote, ×1 in the centre
 * @property {number[]} [steps] picks one value per zone, left to right
 * @property {'exp'} [curve] even steps by ear (frequencies, multipliers); min > 0
 * @property {number} [initial] where it sits until it's touched, 0–1 (0.5)
 */

// a control by name, as `lpf(…)` would build it
const controlOf = (name) => {
  if (typeof strudel[name] !== 'function') throw new Error(`controls: no control '${name}'`)
  return strudel[name]
}

// knob position 0–1 → value
const shape = ({ range, scale, steps, curve }) => {
  if (steps) return (x) => steps[Math.min(steps.length - 1, Math.floor(x * steps.length))]
  if (range) {
    const [min, max] = range
    return curve === 'exp' ? (x) => min * (max / min) ** x : (x) => min + (max - min) * x
  }
  const [low, high] = scale
  // each half on its own, so the centre is ×1 whatever low and high are
  return curve === 'exp'
    ? (x) => (x < 0.5 ? low ** (1 - 2 * x) : high ** (2 * x - 1))
    : (x) => (x < 0.5 ? low + (1 - low) * x * 2 : 1 + (high - 1) * (x - 0.5) * 2)
}

// A map is either one page (part → knobs, any memory moves it) or pages
// (page 1–8 → part → knobs). Flattened: one entry per knob.
const knobsOf = (map) => {
  const flat = (parts, page) =>
    Object.entries(parts).flatMap(([part, knobs]) =>
      Object.entries(knobs).map(([i, k]) => ({ page, part, i: Number(i), k })),
    )
  const paged = Object.keys(map).every((key) => /^\d+$/.test(key))
  return paged ? Object.entries(map).flatMap(([page, parts]) => flat(parts, Number(page))) : flat(map, null)
}

/**
 * What a knob map does, for the engine to print: the knob sheet, which knob is
 * what (`names`, by 'page:knob', page '' for a map without pages), and what's
 * wrong with it (a part that isn't there, a page or knob the controller doesn't
 * have, a knob it keeps for navigation, a knob mapped twice).
 *
 * @param {Record<string, Pattern>} parts
 * @param {object} map
 * @returns {{ sheet: string, names: Record<string, string>, problems: string[] }}
 */
export const describeControls = (parts, map) => {
  const names = {}
  const problems = []
  for (const { page, part, i, k } of knobsOf(map)) {
    const name = `${part}.${k.set}`
    const where = page ? `page ${page} knob ${i}` : `knob ${i}`
    if (!parts[part]) problems.push(`no part '${part}' (${where})`)
    if (page && !(page >= 1 && page <= (controller.pages?.length ?? 0))) problems.push(`no page ${page} (${name})`)
    if (!(i >= 1 && i <= KNOBS.length)) problems.push(`no ${where} (${name})`)
    if (controller.navigation?.includes(i)) problems.push(`${where} is for navigation (${name})`)
    const key = `${page ?? ''}:${i}`
    if (names[key]) problems.push(`${where} is both ${names[key]} and ${name}`)
    names[key] = name
  }
  const pages = {}
  for (const [key, name] of Object.entries(names)) {
    const [page, i] = key.split(':')
    ;(pages[page] ??= []).push([Number(i), name])
  }
  const sheet = Object.entries(pages)
    .map(
      ([page, knobs]) =>
        (page ? `page ${page}: ` : '') +
        knobs
          .sort(([a], [b]) => a - b)
          .map(([i, name]) => `${i} ${name}`)
          .join(' · '),
    )
    .join('\n       ')
  return { sheet, names, problems }
}

/**
 * Put a track's knob map on its parts: each knob sets or scales one control of
 * one part, and the parts stay as written. Parts the map doesn't name pass
 * through. The engine does this with a track's controls.js (engine/track.mjs).
 *
 * @example
 * controls({ throws, pad }, { 1: { throws: { 2: { set: 'lpf', scale: [0.5, 2], curve: 'exp' } } } })
 * @param {Record<string, Pattern>} parts
 * @param {object} map page (1–8) → part → knob place (1–16) → knob; or, for one
 *   page any memory moves, part → knob place → knob
 * @returns {Record<string, Pattern>} the same parts, in the same order
 */
export const controls = (parts, map) => {
  const all = knobsOf(map)
  return Object.fromEntries(
    Object.entries(parts).map(([part, pattern]) => {
      const knobs = all.filter((e) => e.part === part)
      if (!knobs.length) return [part, pattern]
      let p = pattern
      for (const { page, i, k } of knobs) {
        const value = knob(i, k.initial, page).fmap(shape(k))
        const control = controlOf(k.set)
        if (!k.scale) {
          p = p[k.set](value)
          continue
        }
        // ×what the part wrote: an event that didn't write it (a silent tick
        // carrying the room, say) stays without it. Under its own name: lpf → cutoff
        const [key] = Object.keys(control(1).firstCycleValues[0])
        p = p.fmap((v) => (x) => (typeof v[key] === 'number' ? { ...v, [key]: v[key] * x } : v)).appLeft(value)
      }
      // capped only where a knob reaches, so what the part wrote stays as written
      const caps = Object.entries(CAPS).filter(([name]) => knobs.some(({ k }) => k.set === name))
      if (caps.length) {
        p = p.fmap((v) => {
          const out = { ...v }
          for (const [name, max] of caps) if (typeof out[name] === 'number') out[name] = Math.min(out[name], max)
          return out
        })
      }
      return [part, p]
    }),
  )
}

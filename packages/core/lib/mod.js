// ── Modulation & arrangement helpers ──────────────
import { perlin, sine, signal } from '@strudel/core'

/** @typedef {import('@strudel/core').Pattern} Pattern */

/**
 * Random, organic wandering between two values.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} cycles how slowly it wanders
 * @returns {Pattern}
 */
export const drift = (min, max, cycles) => perlin.range(min, max).slow(cycles)

/**
 * A smooth up/down sine wave between two values.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} cycles one full period
 * @returns {Pattern}
 */
export const sweep = (min, max, cycles) => sine.range(min, max).slow(cycles)

/**
 * a → b between cycle `start` and `end`, holding outside that range.
 *
 * @param {number} a
 * @param {number} b
 * @param {number} start
 * @param {number} end
 * @returns {Pattern}
 */
export const ramp = (a, b, start, end) =>
  signal((t) => {
    const x = Math.min(1, Math.max(0, (t - start) / (end - start)))
    return a + (b - a) * x
  })

/**
 * Keep only the events whose cycle number passes the rule.
 *
 * @param {(cycle: number) => boolean} rule
 * @returns {(p: Pattern) => Pattern}
 */
export const gate = (rule) => (p) => p.filterHaps((h) => rule(Math.floor(Number(h.whole.begin))))

// ── Arrangement over a fixed song length that loops ──
import { signal, gain } from '@strudel/core'
import { gate } from './mod.js'

/** @typedef {import('@strudel/core').Pattern} Pattern */

/**
 * Bar-based arrangement helpers for a song of `length` bars that loops.
 *
 * @example
 * const { during, env } = arrangement(192)
 * during([16, 96], [112, 188])   // keep notes only in those bars (from inclusive, to exclusive)
 * env([0, 0], [16, 1], [96, 0])  // a level moving linearly between [bar, value] points
 * @param {number} length song length in bars
 * @returns {{
 *   during: (...ranges: [number, number][]) => (p: Pattern) => Pattern,
 *   env: (...points: [number, number][]) => Pattern,
 * }}
 */
export const arrangement = (length) => {
  const wrap = (t) => ((t % length) + length) % length

  const during = (...ranges) => gate((c) => ranges.some(([from, to]) => wrap(c) >= from && wrap(c) < to))

  const env = (...points) =>
    signal((t) => {
      const b = wrap(t)
      if (b <= points[0][0]) return points[0][1]
      for (let i = 1; i < points.length; i++) {
        const [b1, v1] = points[i]
        if (b < b1) {
          const [b0, v0] = points[i - 1]
          return v0 + ((v1 - v0) * (b - b0)) / (b1 - b0)
        }
      }
      return points[points.length - 1][1]
    })

  return { during, env }
}

// a duck depth (one number, or one per orbit) scaled by a level: the dip is
// 1 − √depth (superdirt/master.scd), so for the dip to follow the level the depth
// follows its square
const scaleDepth = (depth, level) =>
  Array.isArray(depth) ? depth.map((d) => d * level ** 2) : typeof depth === 'number' ? depth * level ** 2 : depth

// a fade's level on a part, and on what its hits duck: a kick fading out stops
// dipping the bass with it, instead of ducking it at full depth while silent
const faded = (level) => (p) =>
  p
    .mul(gain(level))
    .fmap((v) => (l) => (v.duckdepth === undefined ? v : { ...v, duckdepth: scaleDepth(v.duckdepth, l) }))
    .appLeft(level)

/**
 * Fade a part in once, from silence at bar `from` to full at bar `to`, and leave
 * it full from then on (it doesn't loop, unlike arrangement()). The level follows
 * a square curve, so the start creeps in instead of arriving in a step. Its ducks
 * (.duckdepth) fade with it.
 *
 * @example
 * pad.apply(fadeIn(0, 16))   // the first 16 bars
 * @param {number} from bar where it starts, silent
 * @param {number} to bar where it's full
 * @returns {(p: Pattern) => Pattern}
 */
export const fadeIn = (from, to) => faded(signal((t) => Math.min(Math.max((t - from) / (to - from), 0), 1) ** 2))

/**
 * Fade a part out once, from full at bar `from` to silence at bar `to`, and keep
 * it silent after (fadeIn's mirror, the same square curve).
 *
 * @example
 * kick.apply(fadeOut(128, 136))
 * @param {number} from bar where it starts fading, full
 * @param {number} to bar where it's silent
 * @returns {(p: Pattern) => Pattern}
 */
export const fadeOut = (from, to) => faded(signal((t) => Math.min(Math.max((to - t) / (to - from), 0), 1) ** 2))

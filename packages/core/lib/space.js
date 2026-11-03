// ── Ambisonics: where an orbit's sound sits around the listener ──
// SuperDirt side: superdirt/space.scd (ATK). Orbit settings, like delaytime: the
// orbit keeps the last value. space moves only the echoes (the dry sound stays
// where .pan put it); sphere moves the whole orbit (width, roll). azim/spin/elev place both.
// In the browser they're ignored.
import { createParam } from '@strudel/core'

/** @typedef {import('@strudel/core').Pattern} Pattern */

/**
 * How much of the echo goes into the sphere: 0 SuperDirt's stereo delay, 1 all of it.
 *
 * @example
 * .delay(0.8).space(1)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const space = createParam('space')

/**
 * How much of the whole orbit (dry sound and reverb) goes into the sphere: its
 * stereo image laid round the listener, left at 90° left and right at 90° right.
 * For sounds with no echoes to move, like a pad.
 *
 * @example
 * .sphere(1).spin(1 / 32)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const sphere = createParam('sphere')

/**
 * Half the width of an orbit's image in the sphere, in turns: 0.25 = left at 90°
 * left and right at 90° right (the default), 0.08 ≈ ±30°, narrow enough to move as one.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const width = createParam('width')

/**
 * Turns per cycle an orbit rolls over the head, one way only: behind → overhead →
 * front → under the chin → behind (spin turns it round the sides instead).
 *
 * @example
 * .sphere(1).width(0.08).azim(0.5).roll(1 / 32)   // starts behind, over the top
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const roll = createParam('roll')

/**
 * Where the echoes (or the orbit) sit, in turns: 0 front · 0.25 left · 0.5 behind · −0.25 right.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const azim = createParam('azim')

/**
 * Turns per cycle the echoes (or the orbit) circle the listener (+ = front → left → behind → right).
 *
 * @example
 * .space(1).spin(1 / 8)   // once round every 8 bars
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const spin = createParam('spin')

/**
 * Height, in turns: 0 ear level · 0.25 overhead.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const elev = createParam('elev')

/**
 * Seconds a change of place takes (space, sphere, width, azim, elev): 0.3 by
 * default, a quick swoop; around a bar (2 at 110 BPM) and it drifts there instead.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const glide = createParam('glide')

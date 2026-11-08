// ── FX chains (pattern → pattern) ─────────────────
import { createParam } from '@strudel/core'
import { drift, sweep } from './mod.js'

/** @typedef {import('@strudel/core').Pattern} Pattern */

// ── Echo times, in cycles: for .delaytime() with .lock(1), which reads it as a
// fraction of a cycle (a 4/4 bar) and follows the tempo ──

/** A 16th note: a quarter of a beat. */
export const SIXTEENTH = 1 / 16
/** An 8th-note triplet: three to a beat. */
export const EIGHTH_TRIPLET = 1 / 12
/** An 8th note: half a beat. */
export const EIGHTH = 1 / 8
/** A dotted 8th, three 16ths: the dub echo, skipping across the beat. */
export const DOTTED_EIGHTH = 3 / 16
/** A quarter note: one beat. */
export const QUARTER = 1 / 4
/** A dotted quarter, three 8ths: slower, the repeats wide apart. */
export const DOTTED_QUARTER = 3 / 8
/** A half note: two beats. */
export const HALF = 1 / 2
/** A dotted half, three beats: the slowest, each echo three beats after the last. */
export const DOTTED_HALF = 3 / 4

// ── The dub echo's filter (superdirt/space.scd): a band-pass inside the delay's
// feedback loop, so each repeat comes back thinner than the last. An orbit
// setting, like delaytime: the orbit keeps the last value. Needs ATK's space.scd
// loaded (not DIRT_SPACE=off); in the browser it's ignored ──

/**
 * Centre of the band-pass on the echoes, in Hz. 0 turns it off (SuperDirt's own
 * delay, unfiltered); around 400–800 is the classic thin, mid-heavy dub repeat.
 *
 * @example
 * .delay(0.6).delayfeedback(0.42).delayfreq(420).delaywidth(4)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const delayfreq = createParam('delayfreq')

/**
 * Width of the band-pass on the echoes, in octaves (default 4): wider keeps
 * more body, narrower and the repeats turn to telephone.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const delaywidth = createParam('delaywidth')

/**
 * How much of the echoes goes round through the reverb: 0 side by side, as
 * SuperDirt has them (the room hears only the dry hit), 1 every repeat blooming
 * into the room and sinking further off as it fades. Stereo echoes only: with
 * .space(1) they're in the sphere instead.
 *
 * @example
 * .delay(0.6).delayroom(0.5).room(0.5).roomsize(0.9)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const delayroom = createParam('delayroom')

/**
 * How much each echo is smeared on its way round (0–1): 0 clean repeats, 0.6 an
 * echo at first and a wash with no edges or direction a few repeats on.
 *
 * @example
 * .delay(1).delayfeedback(0.85).delaydiffuse(0.6).delayspread(0.5).delaywander(0.3)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const delaydiffuse = createParam('delaydiffuse')

/**
 * How far apart the two ears' echoes come back (0–1, up to 25 ms): wide without
 * pointing anywhere. 0 both the same.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const delayspread = createParam('delayspread')

/**
 * How much the echo time drifts, slowly and differently in each ear (0–1, up to
 * 6 ms), as tape does: the repeats never sit still. 0 still.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const delaywander = createParam('delaywander')

/**
 * The dry sound's level on its orbit, live: a turn reaches a note already
 * ringing. ×1 as played, 0 only its echoes, spring and room, up to ×20. The
 * delay, spring and room still hear the notes at full level: a channel fader
 * with the sends before it.
 *
 * @example
 * .delay(2).drylevel(0.3)   // the echoes carry it, the chord underneath
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const drylevel = createParam('drylevel')

/**
 * A low-pass that drifts open and closed over a slow high-pass sweep.
 *
 * @param {Pattern} p
 * @returns {Pattern}
 */
export const evolvingFilter = (p) =>
  p
    .lpf(drift(600, 1800, 37))
    .hpf(sweep(100, 400, 64))
    .hpq(drift(2, 8, 23))

/**
 * Long, high-feedback delay into a big dark room.
 *
 * @param {Pattern} p
 * @returns {Pattern}
 */
export const dubSpace = (p) =>
  p
    .delay(0.75)
    .delayfeedback(drift(0.81, 0.93, 29))
    .room(0.85)
    .roomsize(0.95)
    .roomlp(2000)

/**
 * Dotted-8th chord echo synced to the tempo, feedback wandering 0.2–0.9.
 *
 * @param {number} bpm
 * @returns {(p: Pattern) => Pattern}
 */
export const dubChord = (bpm) => (p) =>
  p
    .delay(0.95)
    .delaytime((60 / bpm) * 0.75)
    .delayfeedback(drift(0.2, 0.9, 31))
    .room(0.9)
    .roomsize(1.25)
    .roomlp(2000)

// ── Spring reverb (superdirt/spring.scd): the dub spring's drippy, metallic
// splash. An orbit setting, like room: the orbit keeps the last value. After
// the delay, before the room: it hears the dry sound, and the echoes when
// .delayroom > 0. Side by side with .room, not into it. In the browser it's ignored ──

/**
 * How much of the orbit goes into the springs: 0 off (the effect sleeps).
 *
 * @example
 * .spring(0.4).springdecay(2).springtone(0.5)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const spring = createParam('spring')

/**
 * Seconds the spring's tail takes to die away (default 2): 1 a short splash, 4 a long drip.
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const springdecay = createParam('springdecay')

/**
 * The spring's colour: 0 dark … 1 bright (default 0.5).
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const springtone = createParam('springtone')

// ── Drive (superdirt/drive.scd): a gain-compensated soft-clip send, the grit
// any sound can reach for without its synth needing drive built in. An orbit
// setting, like spring: the orbit keeps the last value. Sits right after the
// delay, before the spring and room, so the echoes (and the room, with
// .delayroom) come out already driven ──

/**
 * How hard the clip bites: 0 off (the effect sleeps, the orbit is untouched)
 * up to 1, heavy. Gain-compensated, so the level doesn't lurch as this moves.
 *
 * @example
 * .drive(0.4).drivetone(0.6)
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const drive = createParam('drive')

/**
 * The low-pass after the clip: 0 dark … 1 bright (default 1, 9 kHz).
 *
 * @type {(value: number | string | Pattern) => Pattern}
 */
export const drivetone = createParam('drivetone')

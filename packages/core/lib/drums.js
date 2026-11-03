// ── Shared drums: parts more than one track can play ──
import { sound, noteToMidi } from '@strudel/core'

/** @typedef {import('@strudel/core').Pattern} Pattern */

// the 808 take heartbeat() plays: BD0050, the darkest tone with a medium tail.
// Its pitch barely moves (51.8 → 49.6 Hz), so there's no drop to hear and almost
// no click; it settles on 49.6 Hz, which speed retunes from
const BD0050 = { n: 3, hz: 49.6 }

const hz = (note) => 440 * 2 ** ((noteToMidi(note) - 69) / 12)

/**
 * The heartbeat kick: a soft, dark 808 for dub techno and ambient, a pulse you
 * feel rather than a hit. Tuned to the track's root (speed retunes the sample),
 * a 20 ms swell in, a tail that fades out before the cut (no click), and nothing
 * above 90 Hz: the boxy 100–250 Hz knock is what sounds like a fist on a wall.
 * Almost inaudible on laptop speakers, a pulse on anything with bass. No orbit
 * or ducking: the track adds its own.
 *
 * @example
 * heartbeat('f#1').orbit(0)                // four on the floor on F#1 (46 Hz)
 * heartbeat('f1', 'x ~ x ~').duckorbit(2)  // half time on F1
 * @param {string} root the note the tail sits on, e.g. 'f#1' (around 40–55 Hz suits it)
 * @param {string} [rhythm] where the kicks fall, as a struct ('x*4' four on the floor)
 * @returns {Pattern}
 */
export const heartbeat = (root, rhythm = 'x*4') =>
  sound('bd')
    .struct(rhythm)
    .bank('RolandTR808')
    .n(BD0050.n)
    .speed(hz(root) / BD0050.hz)
    // the tail fades out instead of being cut: in over 20 ms, full for 140 ms,
    // out over 100 ms, silent ~0.26 s in (half a beat up to ~115 BPM). legato
    // only cuts after that, so the cut never lands on sound. attack, hold and
    // release together: attack alone silences it (SuperDirt sends the others nil)
    .attack(0.02)
    .hold(0.14)
    .release(0.1)
    .legato(0.8)
    .lpf(90)
    .gain(1)

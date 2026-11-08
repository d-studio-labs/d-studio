// ── Noise: tape hiss under the kick ──
import { sound } from '@strudel/core'

// dhiss (synths/d-studio.scd): a flat noise bed. legato 1.25 crossfades each cycle's
// note into the next, so it never dips. Its own orbit: the kick's delay, drive and
// ducking stay off it
export const hiss = sound('dhiss').legato(1.25).gain(0.025).orbit(2)

// ── Bass: a sub sine under the chord, on the offbeats between the kicks ──
// dsub (synths/d-studio.scd) on F1 (44 Hz, the root of the chord's F minor), the last bar of each four
// stepping down to Eb1. A little 2nd harmonic (.voice) so it still shows on small speakers. Dead centre
// and out of the sphere: below ~150 Hz there's no direction to hear, and the HRTF would only smear it.
import { note } from '@strudel/core'

export const bass = note('<f1 f1 f1 eb1>')
  .struct('~ x ~ x ~ x ~ x')
  .sound('dsub')
  .legato(0.8)
  .voice(0.25)
  .gain(0.55)
  .orbit(12)

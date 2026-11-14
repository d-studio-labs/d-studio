// ── Sub drone: the floor under the dark pad ──
// dsub (synths/d-studio.scd): a sine on F1 (44 Hz, the root of the pad's F minor), breathing with
// the dark pad in the same eight-bar slots (dark.js has the shape): a swell, a short hold, a fall,
// a rest. It was the kick's companion (offbeat hits); now it doesn't answer the kick, it holds.
// A little 2nd harmonic (voice) so it still reads on small speakers; that level drifts slowly
// (31 cycles) so it never sits still.
// Its own orbit (5): the kick's delay and drive stay off it, but the kick does duck it (drums.js),
// by an amount that follows the kick's level, so the sub and the kick's thump (49 Hz) take turns.
// It sits behind the listener (azim 0.5, one point: width 0). Below about 150 Hz the ears hear no
// direction, so the 44 Hz sine doesn't move; the 2nd harmonic (88 Hz) and the saturation's upper
// partials are what point back there, and the sphere's decoder keeps the low end's level (measured:
// the same, within 0.3 dB, at the back as in front)
import { drift } from '@d-studio-labs/core/mod'
import '@d-studio-labs/core/space'
import { drone } from './dark.js'
import { during, DARK_BUILD, DARK_OUTRO } from './song.js'

export const sub = drone('f1', 'dsub')
  .voice(drift(0.1, 0.4, 31))
  .gain(0.5)
  .sphere(1)
  .width(0)
  .azim(0.5)
  .orbit(5)
  .apply(during(DARK_BUILD, DARK_OUTRO))

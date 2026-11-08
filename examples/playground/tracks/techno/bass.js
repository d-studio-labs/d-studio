// ── Sub drone: the floor under the dark pad ──
// dsub (synths/d-studio.scd): a sine on F1 (44 Hz, the root of the pad's F minor), breathing with
// the dark pad in the same eight-bar slots (dark.js has the shape): a swell, a short hold, a fall,
// a rest. It was the kick's companion (offbeat hits); now it doesn't answer the kick, it holds.
// A little 2nd harmonic (voice) so it still reads on small speakers; that level drifts slowly
// (31 cycles) so it never sits still.
// Its own orbit (5): the kick's delay and drive stay off it, but the kick does duck it (drums.js),
// by an amount that follows the kick's level, so the sub and the kick's thump (49 Hz) take turns.
import { drift } from '@d-studio-labs/core/mod'
import { drone } from './dark.js'
import { during, DARK_BUILD, DARK_OUTRO } from './song.js'

export const sub = drone('f1', 'dsub')
  .voice(drift(0.1, 0.4, 31))
  .gain(0.5)
  .orbit(5)
  .apply(during(DARK_BUILD, DARK_OUTRO))

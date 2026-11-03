// ── techno: a Berghain-flavored loop, the intro/reference track for testing the engine ──
// Saving any file here hot-swaps the pattern while `d-studio play` is running.
// Hard and hypnotic, not rave. A real arrangement, not just a loop — this is
// the example for `@d-studio-labs/core/arrange`: during() for sections,
// fadeIn() for builds.
//
//  0 ────── 16 ────── 32 ────── 40 ────────── 64 (loops)
//  pad opens, intro  full groove   breakdown    kick returns, full energy
//  kick+hats join    +perc+bass    kick OUT —   stab joins for the second half,
//                     +pulse+lead  the "solo":  a different color for the return
//                                  bass+lead+
//                                  pulse+perc+
//                                  pad alone

import { arrangement, fadeIn } from '@d-studio-labs/core/arrange'
import { kick, hats, perc } from './drums.js'
import { bass } from './bass.js'
import { pulse } from './pulse.js'
import { lead } from './lead.js'
import { stab } from './chords.js'
import { pad } from './pad.js'

export const BPM = 132
export const BARS = 64

const { during } = arrangement(BARS)

// every key here is one lane; comment one out to mute it
export const parts = {
  kick: kick.apply(during([2, 32], [40, 64])), // 2 bars of pad alone first, out for the breakdown (32–40): the solo
  hats: hats.apply(fadeIn(0, 2)), // the anchor — in by bar 2, never drops again, even through the breakdown
  perc: perc.apply(fadeIn(0, 8)),
  bass: bass.apply(fadeIn(4, 16)),
  pulse: pulse.apply(fadeIn(8, 20)),
  lead: lead.apply(fadeIn(16, 28)),
  // only from the breakdown on, and eased in over those 8 bars — it was
  // popping in at full volume right as the kick dropped, which read as a
  // loudness surge even though the overall mix is actually quieter there
  stab: stab.apply(during([32, 64])).apply(fadeIn(32, 40)),
  pad: pad.apply(fadeIn(0, 4)), // opens the track — a few bars of atmosphere before the kick joins
}

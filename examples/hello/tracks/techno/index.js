// ── techno: a Berghain-flavored loop, the intro/reference track for testing the engine ──
// Saving any file here hot-swaps the pattern while `d-studio play` is running.
// Hard and hypnotic, not rave. A real arrangement, not just a loop — this is
// the example for `@d-studio-labs/core/arrange`: during() for sections,
// fadeIn() for builds.
//
//  0 ────── 16 ────── 32 ────── 40 ────────── 64 (loops)
//  intro      full groove   breakdown    kick returns, full energy
//  kick+hats  +perc+bass    kick OUT —   stab joins for the second half,
//  only       +pulse+lead   the "solo":  a different color for the return
//                           bass+lead+
//                           pulse+perc
//                           alone

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
  kick: kick.apply(during([0, 32], [40, 64])), // out for the breakdown (32–40): the solo
  hats, // the anchor — never drops, even through the breakdown
  perc: perc.apply(fadeIn(0, 8)),
  bass: bass.apply(fadeIn(4, 16)),
  pulse: pulse.apply(fadeIn(8, 20)),
  lead: lead.apply(fadeIn(16, 28)),
  stab: stab.apply(during([32, 64])), // only from the breakdown on — a color for the return, not a constant
  pad: pad.apply(fadeIn(24, 36)), // joins late, lands under the breakdown — a counterweight to the kick dropping out
}

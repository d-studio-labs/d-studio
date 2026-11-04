// ── techno: a Berghain-flavored loop, the intro/reference track for testing the engine ──
// Saving any file here hot-swaps the pattern while `d-studio play` is running.
// Hard and hypnotic, not rave. A real arrangement, not just a loop — this is
// the example for `@d-studio-labs/core/arrange`: during() for sections,
// fadeIn() for builds.
//
//  0 ── 2 ── 4 ── 16 ────── 32 ────── 40 ────────── 64 (loops)
//  pad   kick  hats   full groove   breakdown    kick returns, full energy
//  alone alone joins  +perc+bass    kick OUT —   stab joins for the second half,
//                     +pulse+lead  the "solo":  a different color for the return
//                                  bass+lead+
//                                  pulse+perc+
//                                  pad alone

import { gain } from '@strudel/core'
import { arrangement, fadeIn } from '@d-studio-labs/core/arrange'
import { kick, hats, perc } from './drums.js'
import { bass } from './bass.js'
import { pulse } from './pulse.js'
import { lead } from './lead.js'
import { stab } from './chords.js'
import { pad } from './pad.js'
import { arp } from './arp.js'

export const BPM = 132
export const BARS = 64

const { during, env } = arrangement(BARS)

// a fast ramp (0->1 over a quarter-bar) right at each entry point (bar 2 and
// the return at bar 40) — the master bus's compressor+saturator cracked on a
// sudden full-volume kick after 2 quiet bars of just pad+arp+hats. fadeIn()
// only ramps once (not on repeats), so this needs the looping env() instead
const kickLevel = env([0, 0], [2, 0], [2.25, 1], [32, 1], [40, 0], [40.25, 1], [64, 1])
// kick establishes the pulse alone for 2 bars before hats joins — the usual
// convention (kick first, then texture layers in), not both at once. No
// breakdown dip for hats (the anchor, stays on through 32-40 unlike the kick)
const hatsLevel = env([0, 0], [4, 0], [4.25, 1], [64, 1])

export const parts = {
  //kick: kick.apply(during([2, 32], [40, 64])).mul(gain(kickLevel)),
  //hats: hats.apply(during([4, 64])).mul(gain(hatsLevel)),
  // perc: perc.apply(fadeIn(0, 8)),
  bass: bass.apply(fadeIn(4, 16)),
  //pulse: pulse.apply(fadeIn(8, 20)),
  //lead: lead.apply(fadeIn(16, 28)),
  //stab: stab.apply(during([32, 64])).apply(fadeIn(32, 40)),
  // pad: pad.apply(fadeIn(0, 4)),
}

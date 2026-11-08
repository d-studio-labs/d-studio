// ── Song: the form, shared by every part ──
import { arrangement } from '@d-studio-labs/core/arrange'
import { gain } from '@strudel/core'

// 128 bars = 4:00 at 128 BPM, then it loops into its own intro. Each entrance lands on a
// four-bar line, where the pad's chords change, so a new layer begins with its own fade-in.
// The build is the long part: about 30 s between entrances, so each layer has time to evolve.
//   0  hiss, fading in over sixteen bars
//   8  pad: the held F (tex)
//  24  pad: the minor third (mid)
//  40  pad: the Fm9 (main)
//  48  a dark drone rises with a sub drone under it, the first sign of the kick; both return at 120
//  56  the kick fades in over sixteen bars, teased by a slow LFO
//  72  main: the full kick with its rumble, no longer teased
//  76  the groove joins: the offbeat open hat first
//  80  the lead: the hypnotic melody
//  84  the closed hats
//  88  the rumble starts to open (drive, echo, filter) over sixteen bars; the discreet pad (air)
//  96  the shaker
// 102  breakdown: the kick, rumble and groove out for two bars, in silence (the lead and pads carry on)
// 104  climax: the kick back with the rumble fully open, the groove complete, the sidechain deeper;
//      the pad down to one layer (the minor third), steady
// 120  outro: the kick fades out over eight bars; groove and rumble go with it
// 124  the pad, lead and air ring out; the hiss carries into the loop
// the forest, a story over the build (forest.js):
//  12  the night comes in: insects and water drops
//  28  an owl calls, far off; again at 44 and 60, nearer
//  52  a wolf howls, far away; at 68 it's close, four bars before the drop
// 124  the owl calls once more, in the outro
export const BPM = 128
export const BARS = 128
export const HISS_FADE = [0, 16]
// the pad, a layer at a time: the held F, the minor third, the Fm9. For the climax (bar 104) two of
// them stop (their last notes ring out) and the minor third (F and Ab, the thinnest) carries on
// alone, to the outro: a climax with one light layer holding leaves room for the kick and lead
export const PAD = { tex: [8, 104], mid: [24, 124], main: [40, 104] }
// the pad's level as a multiple of its own gains: full through the build, then down 4 dB (0.6) at
// the drop and CONSTANT from there, through the climax and the outro. A chord is one four-bar
// note, so it's sampled where each one starts
export const PAD_LEVEL = [
  [66, 1],
  [72, 0.6],
]
// the kick, one part from bar 56 to the end, but for a two-bar breakdown before the climax: its
// level in over sixteen bars to the drop at 72, full for the main part, out over the outro. Until
// bar 68 an LFO (one cycle per TEASE_BARS) pulls it down by up to TEASE_DEPTH and lets it back up,
// so it teases; the depth is gone at 72
export const KICK = [
  [56, 102],
  [104, 128],
]
export const KICK_LEVEL = [
  [56, 0],
  [72, 1],
  [120, 1],
  [128, 0],
]
export const TEASE_BARS = 3
export const TEASE_DEPTH = [
  [56, 0.7],
  [68, 0.7],
  [72, 0],
]
// the climax (drums.js): over these bars the rumble opens up, and the breakdown takes the kick out
// in silence, two bars, with no fill, so the drop lands from nothing
export const RUMBLE_OPEN = [88, 104]
export const BREAKDOWN = [102, 104]
// the groove (groove.js), in layers, out for the breakdown, and out by the outro
export const HATS_OPEN = [
  [76, 102],
  [104, 120],
]
export const HATS_CLOSED = [
  [84, 102],
  [104, 120],
]
export const SHAKER = [
  [96, 102],
  [104, 120],
]
// the lead (lead.js) and the discreet pad (air.js): they carry through the breakdown
export const LEAD = [80, 124]
export const AIR = [88, 124]
// the dark drone (dark.js) and the sub drone under it (bass.js), breathing in eight-bar slots: three
// breaths in the build to the drop (from eight bars before the kick appears) and one in the outro
export const DARK_BUILD = [48, 72]
export const DARK_OUTRO = [120, 128]
// the binaural texture (binaural.js): the crackle and the clicks both from bar 16, to set the
// environment, each fading in over twelve bars and out over the last eight, gone by bar 48
export const DUST = [16, 48]
export const TICKS = [16, 48]
// the forest (forest.js): a bed of insects and water drops, the owl's calls, the wolf's howls
export const FOREST = [12, 72]
export const OWL = [
  [28, 30],
  [44, 46],
  [60, 62],
  [124, 126],
]
export const WOLF = [
  [52, 56],
  [68, 72],
]
export const { during, env } = arrangement(BARS)

// in over twelve bars, out over the last eight of a range (a part's level, for a bed that
// comes and goes)
export const level =
  ([from, to]) =>
  (p) =>
    p.mul(gain(env([from, 0], [from + 12, 1], [to - 8, 1], [to, 0])))

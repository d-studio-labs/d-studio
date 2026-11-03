// ── Pad: a continuous, soft synth wash — counterbalances the kick + stab aggression ──
// sc3-plugins is installed on this machine (confirmed — part of the original
// d-studio setup) — `supersaw` is a real synth voice, not a pitch-shifted
// sample.
//
// Its SynthDef (SuperDirt's default-synths-extra.scd) has no attack/release/
// clip params at all — those were silently ignored. Its envelope is a fixed
// shape whose TOTAL duration is `sustain`, in seconds (not a 0-1 fraction):
// default sustain=1 means the whole note lasts exactly 1 second, which is
// why it kept decaying to silence long before the next chord. 4 bars at 132
// BPM = 7.27s, so sustain is set to just under that.
//
// Same progression as before: C -> Bb -> Ab -> G, a descending bassline, 4
// bars each, 16 bars total before it repeats. Root and fifth, soft filter.
import { note, stack } from '@strudel/core'

const HOLD = 7 // seconds, just under a 4-bar slot at 132 BPM (7.27s)

const root = note('<c2 bb1 ab1 g1>/4').sound('supersaw').sustain(HOLD).decay(0).lpf(700).room(0.2).roomsize(0.6).gain(0.2)

const fifth = note('<g2 f2 eb2 d2>/4')
  .sound('supersaw')
  .sustain(HOLD)
  .decay(0)
  .lpf(700)
  .room(0.2)
  .roomsize(0.6)
  .gain(0.14)

export const pad = stack(root, fifth)

// ── Pad: a continuous, soft synth wash — counterbalances the kick + stab aggression ──
// sc3-plugins is installed on this machine (confirmed — part of the original
// d-studio setup). `supersaw` read as synthwave/EBM, not what was wanted —
// `supertron` instead (likely Mellotron-style: a vintage tape-pad character,
// often the actual source of "cinematic" warmth in film scores).
//
// Same envelope gotcha as supersaw: no attack/release/clip params, just
// `sustain` in seconds (not a 0-1 fraction) — confirmed in its SynthDef.
// 4 bars at 132 BPM = 7.27s, so sustain is set to just under that.
//
// Same progression as before: C -> Bb -> Ab -> G, a descending bassline, 4
// bars each, 16 bars total before it repeats. Root and fifth, soft filter.
import { note, stack } from '@strudel/core'

const HOLD = 7 // seconds, just under a 4-bar slot at 132 BPM (7.27s)

const root = note('<c2 bb1 ab1 g1>/4').sound('supertron').sustain(HOLD).lpf(700).room(0.2).roomsize(0.6).gain(0.3)

const fifth = note('<g2 f2 eb2 d2>/4').sound('supertron').sustain(HOLD).lpf(700).room(0.2).roomsize(0.6).gain(0.22)

export const pad = stack(root, fifth)

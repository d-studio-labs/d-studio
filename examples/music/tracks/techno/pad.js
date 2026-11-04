// ── Pad: a continuous, soft synth wash — counterbalances the kick + stab aggression ──
// `dstudiopad`: a new SynthDef in @d-studio-labs/synths (packages/synths/pad.scd)
// — four detuned saws with slow organic wobble (LFNoise2, not a periodic LFO)
// and a frequency-scaled lowpass. Same idea as the user's private `dpad`
// synth, written fresh for the public package rather than copied — supersaw
// and supertron both turned out to have built-in periodic LFOs that read as
// "EBM pulsing" or literal stuttering; LFNoise2's smoothed-random drift has
// no regular pulse to it at all.
//
// Envelope gotcha (same as every SuperDirt synth): no attack/release/clip
// params, just `sustain` in seconds (not a 0-1 fraction). 4 bars at 132 BPM
// = 7.27s, so sustain is set to just under that.
//
// Progression: C -> Bb -> Ab -> G, a descending bassline, 4 bars each, 16
// bars total before it repeats. Root and fifth, a tempo-synced delay for
// fluidity, light room — not the heavy wash that read as "church" earlier.
//
// An octave up from the first attempt (c2-g2, 49-98 Hz) — that sat right on
// top of the kick's rumble AND the bass's own c1 root, three things fighting
// for the same sub pocket. c3-g3 gives it its own register instead.
import { note, stack } from '@strudel/core'

const HOLD = 7 // seconds, just under a 4-bar slot at 132 BPM (7.27s)

// delayfeedback was 0.35 — fine for a short pluck, but a continuously fed
// signal (this sustains for 7s) keeps re-feeding the loop and builds up to
// roughly 1/(1-feedback) louder than the dry signal, which was cracking
// against the master bus. Lowered across pad/arp/pulse together.
const root = note('<c3 bb2 ab2 g2>/4')
  .sound('dstudiopad')
  .sustain(HOLD)
  .detune(0.12)
  .delay(0.3)
  .delaytime(0.28)
  .delayfeedback(0.15)
  .room(0.5)
  .roomsize(0.6)
  .gain(0.26)

const fifth = note('<g3 f3 eb3 d3>/4')
  .sound('dstudiopad')
  .sustain(HOLD)
  .detune(0.12)
  .delay(0.3)
  .delaytime(0.28)
  .delayfeedback(0.15)
  .room(0.5)
  .roomsize(0.6)
  .gain(0.2)

export const pad = stack(root, fifth)

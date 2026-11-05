// ── Pad: a continuous, soft synth wash — counterbalances the kick + stab aggression ──
// `dstudiopad`: a new SynthDef in @d-studio-labs/synths (packages/synths/pad.scd)
// — four detuned saws with slow organic wobble (LFNoise2, not a periodic LFO)
// and a frequency-scaled lowpass. Same idea as the user's private `dpad`
// synth, written fresh for the public package rather than copied — supersaw
// and supertron both turned out to have built-in periodic LFOs that read as
// "EBM pulsing" or literal stuttering; LFNoise2's smoothed-random drift has
// no regular pulse to it at all.
//
// Envelope gotcha: `.sustain()` is Strudel's ADSR sustain *level* (0-1), not
// a duration — the engine (dirt.mjs) deletes it before sending to SuperDirt
// for that reason, so it was silently doing nothing here. dstudiopad's own
// `sustain` arg defaults to 1 second, so without a real value every chord
// was retriggering a fresh 1s attack each bar instead of holding for its
// full 4-bar slot — that repeated attack, fed into the delay, read as
// cracking. `.clip(1)` is the real note-length control: the engine forwards
// the hap's actual (tempo-correct) duration, 4 bars here, instead.
//
// Progression: C -> Bb -> Ab -> G, a descending bassline, 4 bars each, 16
// bars total before it repeats. Root and fifth, a tempo-synced delay for
// fluidity, light room — not the heavy wash that read as "church" earlier.
//
// An octave up from the first attempt (c2-g2, 49-98 Hz) — that sat right on
// top of the kick's rumble AND the bass's own c1 root, three things fighting
// for the same sub pocket. c3-g3 gives it its own register instead.
import { note, stack } from '@strudel/core'

// delayfeedback was 0.35 — fine for a short pluck, but a continuously fed
// signal (this sustains for ~7s) keeps re-feeding the loop and builds up to
// roughly 1/(1-feedback) louder than the dry signal, which was cracking
// against the master bus. Lowered across pad/arp/pulse together.
// its own orbit (2) so the kick can duck it (drums.js) — it shared orbit 0
// with the kick's dry/sub hits otherwise, no isolation at all between a
// sustained saw wash and a hard transient landing in the same bus
const root = note('<c3 bb2 ab2 g2>/4')
  .sound('dstudiopad')
  .clip(1)
  .detune(0.12)
  .delay(0.3)
  .delaytime(0.28)
  .delayfeedback(0.15)
  .room(0.5)
  .roomsize(0.6)
  .gain(0.26)
  .orbit(2)

const fifth = note('<g3 f3 eb3 d3>/4')
  .sound('dstudiopad')
  .clip(1)
  .detune(0.12)
  .delay(0.3)
  .delaytime(0.28)
  .delayfeedback(0.15)
  .room(0.5)
  .roomsize(0.6)
  .gain(0.2)
  .orbit(2)

export const pad = stack(root, fifth)

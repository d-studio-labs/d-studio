// ── Pad: a continuous, soft synth wash — counterbalances the kick + stab aggression ──
// sc3-plugins is installed on this machine (confirmed — part of the original
// d-studio setup).
//
// Back to `supersaw` (confirmed reliable — sustains correctly) rather than
// `supertron`, which turned out to use a self-modulating Pulse oscillator
// (literally pulses/stutters by design, especially at low pitch — that's
// the "da da da da" character, not a bug in how it was played).
// supersaw's own "EBM" quality was its internal LFO sweeping the filter
// (`lfo` param, default 1) — set to 0 here to stop that movement, plus a
// much lower resonance, for something genuinely static and soft.
//
// Same envelope gotcha either way: no attack/release/clip params, just
// `sustain` in seconds (not a 0-1 fraction) — confirmed in the SynthDef.
// 4 bars at 132 BPM = 7.27s, so sustain is set to just under that.
//
// Same progression as before: C -> Bb -> Ab -> G, a descending bassline, 4
// bars each, 16 bars total before it repeats. Root and fifth, soft filter.
import { note, stack } from '@strudel/core'

const HOLD = 7 // seconds, just under a 4-bar slot at 132 BPM (7.27s)

// a tempo-synced delay (dotted-eighth-ish) to smooth the sustain into
// something more fluid, without the "church" wash a big room caused earlier
const root = note('<c2 bb1 ab1 g1>/4')
  .sound('supersaw')
  .sustain(HOLD)
  .lfo(0)
  .resonance(0.05)
  .lpf(600)
  .delay(0.3)
  .delaytime(0.28)
  .delayfeedback(0.35)
  .room(0.2)
  .roomsize(0.6)
  .gain(0.24)

const fifth = note('<g2 f2 eb2 d2>/4')
  .sound('supersaw')
  .sustain(HOLD)
  .lfo(0)
  .resonance(0.05)
  .lpf(600)
  .delay(0.3)
  .delaytime(0.28)
  .delayfeedback(0.35)
  .room(0.2)
  .roomsize(0.6)
  .gain(0.18)

export const pad = stack(root, fifth)

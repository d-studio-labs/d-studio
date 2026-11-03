// ── Pad: a cinematic wash — counterbalances the aggression, atmosphere not harmony ──
// `gm_synth_strings_1` (used successfully elsewhere) turned out not to be
// loaded on this SuperDirt install at all — "instrument not found" in the
// log, confirmed by direct measurement, not a guess. Back to `padlong`
// (confirmed working), but three slightly detuned copies instead of one —
// the classic chorus trick for width/complexity, rather than a single thin
// voice (which is what was reading as a cheap "UFO" synth pad).
// Two layers:
// 1. low: dark and low, the actual body/warmth (quiet, supportive, not
//    competing with the bass rhythmically)
// 2. high: three detuned voices stacked for complexity, with a progression
//    across the whole 64 bars — separated from gain (which fades in early,
//    see index.js) so the filter sweep is audible once it's not near-silent
// Shifted off beat 1 (.late) so its onset doesn't land in the same instant
// as the kick/hats/bass — it gets a moment of relative space to breathe.
import { note, stack } from '@strudel/core'
import { arrangement } from '@d-studio-labs/core/arrange'

const { env } = arrangement(64)

// a melodic arc, not a ping-pong dyad: root → third → fifth → third, outlining
// the minor triad instead of oscillating between two notes (that oscillation
// under a dark pad is the classic horror-sting interval)
const low = note('<c1 eb1 g1 eb1>/2').sound('padlong').lpf(550).room(0.4).roomsize(0.8).gain(0.26).late(0.5)

const highFilter = env([0, 900], [40, 3500], [64, 900])
const voice1 = note('<c2 eb2 g2 eb2>/2').sound('padlong').lpf(highFilter).room(0.5).roomsize(0.85).gain(0.24).late(0.5)
const voice2 = note('<c2 eb2 g2 eb2>/2')
  .sound('padlong')
  .detune(0.08)
  .lpf(highFilter)
  .room(0.5)
  .roomsize(0.85)
  .gain(0.18)
  .late(0.52)
const voice3 = note('<c2 eb2 g2 eb2>/2')
  .sound('padlong')
  .detune(-0.08)
  .lpf(highFilter)
  .room(0.5)
  .roomsize(0.85)
  .gain(0.18)
  .late(0.48)

export const pad = stack(low, voice1, voice2, voice3)

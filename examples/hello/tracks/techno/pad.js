// ── Pad: a slow, dark wash — counterbalances the aggression, atmosphere not harmony ──
// Two layers, not one — the previous single mid-range layer had no body:
// 1. low: filtered dark and low, the actual warmth/weight (quiet, supportive,
//    not competing with the bass rhythmically)
// 2. high: the audible wash, with a real progression across the whole 64
//    bars — separated from gain (which still fades in early, see index.js)
//    so the filter sweep is actually audible once it's no longer near-silent
//
// `padlong` is longer than the plain `pad` sample but doesn't actually
// sustain for 4 bars (measured) — retriggering every 2 bars instead, so the
// next hit always lands before the previous one's tail runs out. Shifted off
// beat 1 (.late) so its onset doesn't land in the same instant as the
// kick/hats/bass — it gets a moment of relative space to breathe.
import { note, stack } from '@strudel/core'
import { arrangement } from '@d-studio-labs/core/arrange'

const { env } = arrangement(64)

const low = note('<c1 eb1>/2').sound('padlong').lpf(280).room(0.4).roomsize(0.8).gain(0.22).late(0.5)

const high = note('<c2 eb2>/2')
  .sound('padlong')
  .lpf(env([0, 400], [40, 2000], [64, 400]))
  .room(0.5)
  .roomsize(0.85)
  .gain(0.3)
  .late(0.5)

export const pad = stack(low, high)

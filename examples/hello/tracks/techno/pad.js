// ── Pad: a slow, dark wash — counterbalances the aggression, atmosphere not harmony ──
// `padlong` is longer than the plain `pad` sample but doesn't actually
// sustain for 4 bars (measured) — retriggering every 2 bars instead, so the
// next hit always lands before the previous one's tail runs out. Shifted off
// beat 1 (.late) so its onset doesn't land in the same instant as the
// kick/hats/bass — it gets a moment of relative space to breathe. Filter
// range moved up (was 250-500 Hz, same pocket as the bass — it was getting
// completely masked) into its own mid-range space instead of fighting the bass.
//
// Progression, not a static wobble: env() (the other arrange.js primitive,
// alongside during()/fadeIn()) opens the filter as the breakdown develops,
// keeps it brighter through the return, then settles back down before the
// loop restarts — a real arc tied to the song's own structure.
import { note } from '@strudel/core'
import { arrangement } from '@d-studio-labs/core/arrange'
import { drift } from '@d-studio-labs/core/mod'

const { env } = arrangement(64)

export const pad = note('<c2 eb2>/2')
  .sound('padlong')
  .lpf(env([24, 300], [36, 1600], [56, 1600], [64, 300]).mul(drift(0.85, 1.15, 51)))
  .room(0.5)
  .roomsize(0.85)
  .gain(0.28)
  .late(0.5)

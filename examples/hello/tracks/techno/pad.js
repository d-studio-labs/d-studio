// ── Pad: a slow, dark wash — counterbalances the aggression, atmosphere not harmony ──
// `padlong` is longer than the plain `pad` sample but doesn't actually
// sustain for 4 bars (measured) — retriggering every 2 bars instead, so the
// next hit always lands before the previous one's tail runs out. Shifted off
// beat 1 (.late) so its onset doesn't land in the same instant as the
// kick/hats/bass — it gets a moment of relative space to breathe.
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const pad = note('<c2 eb2>/2')
  .sound('padlong')
  .lpf(drift(250, 500, 51))
  .room(0.5)
  .roomsize(0.85)
  .gain(0.25)
  .late(0.5)

// ── Pad: a slow, dark wash — counterbalances the aggression, atmosphere not harmony ──
// `padlong` (not `pad`) is an actual long/sustained sample, not a short
// one-shot — so a note held once every 4 bars reads as a genuine drone
// instead of a choppy repeating stab.
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const pad = note('<c2 eb2>/4').sound('padlong').lpf(drift(250, 500, 51)).room(0.5).roomsize(0.85).gain(0.25)

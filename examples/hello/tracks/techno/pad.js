// ── Pad: a slow, dark wash — counterbalances the aggression, atmosphere not harmony ──
// One note a bar, alternating every 4 bars — a finite sample can't sustain on
// its own for bars, so the wash comes from the long room tail overlapping
// each retrigger, not from holding one note open.
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const pad = note('<c2 c2 c2 c2 eb2 eb2 eb2 eb2>')
  .sound('pad')
  .lpf(drift(300, 700, 51))
  .room(0.6)
  .roomsize(0.9)
  .gain(0.35)

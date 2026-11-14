// ── Drums: four-on-the-floor TR909 and two clicks ──
import { sound } from '@strudel/core'
import '@d-studio-labs/core/space'

export const kick = sound('bd*4').bank('RolandTR909').gain(0.9).legato(1.0)

// two clicks, on beats 2 and 4, each a point just in front: left of centre, then right (±45° round the sphere)
export const click = sound('~ dclick ~ dclick')
  .freq(3600)
  .gain(0.45)
  .legato(0.08)
  .sphere(1)
  .width(0.02)
  .azim('<0.125 -0.125>')
  .glide(0.02)
  .orbit(1)

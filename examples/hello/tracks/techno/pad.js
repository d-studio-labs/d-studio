// ── Pad: a continuous, soft wash — counterbalances the kick + stab aggression ──
// Same progression spirit as before (C -> Bb -> Ab -> G, a descending
// bassline, 4 bars each, 16 bars total before it repeats) but as a slow,
// blended pad instead of a fast arpeggio: root and fifth, each layer
// retriggered once a bar so it never goes silent (`padlong` doesn't actually
// sustain across bars on its own — measured, not assumed), with generous
// room so consecutive hits melt into each other rather than reading as
// separate notes. Soft: moderate filter, no sharp edge, no rhythmic drive —
// this sits back and breathes, letting the kick/drums stay the focal point.
import { note, stack } from '@strudel/core'

const root = note('<c2 c2 c2 c2 bb1 bb1 bb1 bb1 ab1 ab1 ab1 ab1 g1 g1 g1 g1>')
  .sound('padlong')
  .lpf(700)
  .room(0.45)
  .roomsize(0.85)
  .gain(0.3)
  .late(0.5)

const fifth = note('<g2 g2 g2 g2 f2 f2 f2 f2 eb2 eb2 eb2 eb2 d2 d2 d2 d2>')
  .sound('padlong')
  .lpf(700)
  .room(0.45)
  .roomsize(0.85)
  .gain(0.22)
  .late(0.5)

export const pad = stack(root, fifth)

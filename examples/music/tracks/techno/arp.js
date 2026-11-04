// ── Arp: the pad's rhythmic companion — minimal, static, spatial ──
// Root and fifth only, no chord progression (unlike pad.js) — just two
// notes, fast and repeating. Delay + reverb give it body and spatiality
// instead of sitting dry. `arpy` is Dirt-Samples' arpeggio-purpose bank
// (short, clean attack — a sustained sample smears badly at this speed).
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const arp = note('<c3 g3>*8')
  .sound('arpy')
  .lpf(drift(900, 1800, 51))
  .delay(0.35)
  .delaytime(0.28)
  .delayfeedback(0.4)
  .room(0.3)
  .roomsize(0.7)
  .gain(0.14)

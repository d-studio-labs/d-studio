// ── Bass: a driving root pulse, not a melody — full weight, no high-pass ──
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const bass = note('c1*8')
  .sound('jvbass')
  .lpf(drift(400, 1200, 37))
  .gain(0.4)
  .distort(0.15)

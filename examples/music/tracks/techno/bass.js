// ── Bass: a driving root pulse, not a melody — full weight, no high-pass ──
// Root on three hits, a dip to the minor third on the fourth every other bar:
// enough motion to feel like a loop, not a static drone.
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const bass = note('c1 c1 c1 <c1 eb1>').sound('jvbass').clip(1).lpf(drift(250, 600, 37)).gain(0.4)

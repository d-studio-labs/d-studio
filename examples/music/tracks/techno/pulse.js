// ── Pulse: a euclidean click, not a chord — the genre's hypnotic device ──
// 5 hits over 16 steps: a cross-rhythm against the kick's 4/4, never quite
// where you expect it. A plain click, not a rimshot — rim/cowbell-type sounds
// ring with a pitched tone that reads as "cowbell"; this is just a dry tick.
// A short, tight delay for roll, no reverb wash.
import { sound } from '@strudel/core'

export const pulse = sound('click(5,16)').hpf(2000).delay(0.15).delaytime(0.125).delayfeedback(0.25).gain(0.3)

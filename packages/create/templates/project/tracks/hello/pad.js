// ── Pad: a held chord via dstudiopad (@d-studio-labs/synths) ──
// `.clip(1)` holds the note for its full slot — SuperDirt's note length, in
// seconds. Not `.sustain()`: that's Strudel's ADSR sustain *level* (0-1), a
// different control, and the engine drops it before it reaches SuperDirt.
import { note, stack } from '@strudel/core'

const root = note('c3').sound('dstudiopad').clip(1).gain(0.3)
const fifth = note('g3').sound('dstudiopad').clip(1).gain(0.22)

export const pad = stack(root, fifth)

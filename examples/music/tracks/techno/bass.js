// ── Bass: rolling and sustained, not punchy ──
// `jvbass` (a one-shot sample) kept producing a percussive attack no matter
// how it was filtered or clipped — that transient is baked into the
// recording itself. Same "boxing bag punch" problem flagged on the kick
// earlier, now on the bass. `superreese` (sc3-plugins) is a real synth built
// for exactly this: a smooth, detuned, sustained Reese bass — one long held
// note per bar instead of four short hits.
import { note } from '@strudel/core'

export const bass = note('c1').sound('superreese').sustain(1.7).detune(8).lpf(500).gain(0.35)

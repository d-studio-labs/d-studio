// ── Bass: rolling and sustained, not punchy ──
// `jvbass` (a one-shot sample) kept producing a percussive attack no matter
// how it was filtered or clipped — that transient is baked into the
// recording itself. Same "boxing bag punch" problem flagged on the kick
// earlier, now on the bass. `superreese` (sc3-plugins) is a real synth built
// for exactly this: a smooth, detuned, sustained Reese bass — one long held
// note per bar instead of four short hits.
//
// `.sustain()` is Strudel's ADSR sustain *level* (0-1), not a duration — the
// engine (dirt.mjs) deletes it before sending to SuperDirt for that reason.
// superreese's own `sustain` arg has no default (0), so without a real value
// it collapsed to a zero-length envelope: inaudible, not silent by chance.
// `.clip(1)` is the real note-length control — the engine forwards the
// hap's actual (tempo-correct) duration instead.
import { note } from '@strudel/core'

export const bass = note('c1').sound('superreese').clip(1).detune(8).lpf(500).gain(0.35)

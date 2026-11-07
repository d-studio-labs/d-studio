// ── Pad: a chord that moves, voiced to lead by common tones ──
// i (Cm9) → ♭VI (A♭maj9, four of its five tones held over from i — only the
// root really moves) → ♭VII (B♭maj9, the minor "backdoor", resolving straight
// back to i at the loop). dpadsweep carries home; dsuper — already wide from
// its own oscillators, no chorus needed — takes the ♭VI colour, so the
// timbre changes with the harmony, not against it
import { note, sound, createParam, stack } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'
import { arrangement } from '@d-studio-labs/core/arrange'

// dpadsweep's own controls, not yet known to Strudel: how fast its internal
// sine sweeps the filter, how far (in octaves) and how resonant it sounds
createParam('lprate')
createParam('lpdepth')
createParam('resonance')

const BPM = 112
const BARS = 40
const { during } = arrangement(BARS)

// the room breathes on its own slow timescale, independent of the chord
const room = drift(0.5, 0.72, 13)
const size = drift(0.86, 0.93, 19)

// the ghost echo: dubChord's own dotted-8th timing and wandering feedback
// (@d-studio-labs/core/fx), so the chord's tail keeps circling the room on
// its own between hits — a field always there, not a repeat you can count
const echo = drift(0.2, 0.9, 31)

// shared by every voicing: the swell in and out, the echo, the room. Not the
// gain or the filter — dsuper is a brighter, louder voice than dpadsweep at
// the same numbers, so those are set per voicing, by ear, to match
const voiced = (p) =>
  p
    .legato(1.1)
    .attack(2)
    .release(3)
    .hpf(100)
    .pan(0.5)
    .delay(0.95)
    .delaytime((60 / BPM) * 0.75)
    .delayfeedback(echo)
    .room(room)
    .roomsize(size)
    .orbit(1)

// i, bars 0–16 (front and wide): home, dpadsweep's own filter singing slowly
// up and down the chord's harmonic series
const home = voiced(
  note('[c3, eb3, g3, bb3, d4]')
    .sound('dpadsweep')
    .slow(4)
    .lprate(0.1)
    .lpdepth(1.5)
    .resonance(0.6)
    .gain(0.12),
).apply(during([0, 16]))

// ♭VI, bars 16–32 (behind and overhead): dsuper in place of dpadsweep, but
// dsuper has no filter sweep of its own — darkened to sit in the same place
// dpadsweep's sweep lands (the drift stays within dpadsweep's own 500–700 Hz
// wander) and brought down well under dpadsweep's level, so the change in
// colour reads as the same pad turning, not a different one cutting in
const lift = voiced(
  note('[ab2, c3, eb3, g3, bb3]')
    .sound('dsuper')
    .slow(4)
    .voice(0.2)
    .detune(0.15)
    .lpf(drift(500, 700, 43))
    .gain(0.07),
).apply(during([16, 32]))

// ♭VII, bars 32–40 (rolling back to the front): back on dpadsweep, so the
// chord and the timbre resolve home together
const back = voiced(
  note('[bb2, d3, f3, a3, c4]')
    .sound('dpadsweep')
    .slow(4)
    .lprate(0.1)
    .lpdepth(1.5)
    .resonance(0.6)
    .gain(0.12),
).apply(during([32, 40]))

// a silent tick on every beat carries the room/size drift and the echo's own
// feedback between chords, so both keep moving no matter which voicing (or
// which synth) is currently playing
const breath = sound('dclick*4').gain(0).delayfeedback(echo).room(room).roomsize(size).orbit(1)

export const padSweep = stack(home, lift, back, breath)

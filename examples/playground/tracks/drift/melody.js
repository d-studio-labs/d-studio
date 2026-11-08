// ── Melody: an arpeggio across the pad's own chord tones (pad.js), dpluck ──
// (each note decays on its own, unlike a sustained voice). Strudel's own .arp
// walks the stacked chord by index; irand picks a fresh index each of the 8
// steps a bar, so the order never repeats — still only the chord's own
// tones, so it can't play a wrong note, just an unpredictable one
import { note, stack, irand } from '@strudel/core'
import { arrangement } from '@d-studio-labs/core/arrange'

const BARS = 40
const { during } = arrangement(BARS)
const RANDOM = irand(4).segment(12)

const voiced = (p) =>
  p
    .sound('dpluck')
    .voice(0.9)
    .attack(0.105)
    .release(0.15)
    .legato(1.0)
    .lpf(2500)
    .delay(0.75)
    .delaytime(0.15)
    .delayfeedback(0.3)
    .room(0.25)
    .roomsize(0.95)
    .pan(0.5)
    .orbit(6)

// i, bars 0–16 (Cm9, pad.js): an octave above the pad, its own tones
const home = voiced(note('[c4,eb4,g4,bb4,d5]').arp(RANDOM).gain(0.1)).apply(during([0, 16]))

// ♭VI, bars 16–32 (A♭maj9, under dsuper, already the quieter section)
const lift = voiced(note('[ab3,c4,eb4,g4,bb4]').arp(RANDOM).gain(0.06)).apply(during([16, 32]))

// ♭VII, bars 32–40 (B♭maj9): leading back toward home as the chord resolves
const back = voiced(note('[bb3,d4,f4,a4,c5]').arp(RANDOM).gain(0.1)).apply(during([32, 40]))

export const melody = stack(home, lift, back)

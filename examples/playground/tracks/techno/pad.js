// ── Pad: F minor, three layers with different jobs, glued ──
//   main  dpadmain  Fm9 with no 7th: F Ab C F G. The Eb is left out on purpose, so the
//                   chord stays dark instead of turning "happy". Noise and two saws in
//                   unison, a low-pass an LFO sweeps, vibrato
//   mid   dpadfm    the minor third only (F and Ab): body, and the chord's core colour.
//                   Two detuned FM sines, a band-pass an LFO sweeps
//   tex   dpadtex   a held F, the pedal point that anchors the pads. Three sines at
//                   octaves, a band-pass an LFO sweeps
// Each has its own chorus (in the synth), its own reverb send (.room) and a high-pass.
// They share an orbit (3), so the group saturation is one .drive on it. The rack's
// EQ8, to clear the mud, is only the high-passes: there's no EQ band to cut with.
// The drive sits before the room on the orbit, so the reverbs come out unsaturated.
import { note, stack } from '@strudel/core'
import '@d-studio-labs/core/fx'

// each note is held four bars (.slow(4)); legato 1.15 so it crossfades into the next
// hit, the attack and release long enough to match
const hold = (notes, voice) =>
  note(notes).slow(4).sound(voice).attack(2).release(3).legato(1.15)

export const main = hold('f3,ab3,c4,f4,g4', 'dpadmain').hpf(180).room(0.6).gain(0.5)
export const mid = hold('f3,ab3', 'dpadfm').hpf(220).room(0.5).gain(0.45)
// f2: its octave-down sine (44 Hz) falls outside the band-pass, so it doesn't pile onto the kick's sub
export const tex = hold('f2', 'dpadtex').hpf(60).room(0.7).gain(0.35)

export const pad = stack(main, mid, tex).size(0.9).drive(0.3).drivetone(0.6).orbit(3)

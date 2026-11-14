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
import { createParam, gain, note, stack } from '@strudel/core'
import '@d-studio-labs/core/fx'
import '@d-studio-labs/core/space'
import { BPM, during, env, PAD, PAD_LEVEL } from './song.js'

// SuperDirt's .attack/.release envelope runs from the note's start: attack, then hold
// (0 unless it's set), then release, then silence. With only attack and release, a
// note swells, falls and is silent for the rest of its length: a gap. So the hold
// fills the length between them.
// Each chord is four bars (.slow(4)). A note lasts those four bars plus FADE seconds:
// it fades in over FADE, holds, and fades out over FADE while the next chord fades in.
// The curve is linear (0), so the two fades add up to a constant level.
const curve = createParam('curve')
const SLOT = (4 * 4 * 60) / BPM
const FADE = 3
const held = (notes, voice) =>
  note(notes)
    .slow(4)
    .sound(voice)
    .attack(FADE)
    .hold(SLOT - FADE)
    .release(FADE)
    .curve(0)
    .legato((SLOT + FADE) / SLOT)

export const main = held('f3,ab3,c4,f4,g4', 'dpadmain').hpf(180).room(0.6).gain(0.5)
export const mid = held('f3,ab3', 'dpadfm').hpf(220).room(0.5).gain(0.45)
// f2: its octave-down sine (44 Hz) falls outside the band-pass, so it doesn't pile onto the kick's sub
export const tex = held('f2', 'dpadtex').hpf(60).room(0.7).gain(0.35)

// one layer at a time (song.js): the held F, then the minor third, then the Fm9. Each enters on a
// chord change, so it starts with its own three-second fade-in. At the climax (bar 104) the F and
// the Fm9 leave (their last notes ring out) and the minor third holds on alone, at a constant
// level (PAD_LEVEL: down 4 dB at the drop, then steady), to bar 124
export const pad = stack(tex.apply(during(PAD.tex)), mid.apply(during(PAD.mid)), main.apply(during(PAD.main)))
  .mul(gain(env(...PAD_LEVEL)))
  .size(0.9)
  .drive(0.3)
  .drivetone(0.6)
  // the whole orbit round the head, turning once every 16 bars (the drive and rooms are already in it)
  .sphere(1)
  .width(0.25)
  .spin(1 / 16)
  // a canopy over the listener, lifting from 11° to 43° above ear level as the layers join
  .elev(env([8, 0.03], [72, 0.12]))
  .glide(3)
  .orbit(3)

// ── Pad: three layers, one orbit each, held for four bars ──
//   main  dpadmain  the chord: F Ab C F G. Stays in front, plain stereo
//   mid   dpadfm    the minor third (F and Ab), laid round the head, turning slowly
//   tex   dpadtex   a held F, low, wide and still: the floor of the sphere
// Each chord is four bars (.slow(4)). A note lasts those four bars plus FADE seconds: it fades in
// over FADE, holds, and fades out over FADE while the next fades in, so the layers never restart
// with an attack. (SuperDirt's .attack/.release run from the note's start; the hold fills the length
// between them. The curve is linear, so the two fades add up to a constant level.)
// Separate orbits, so each layer has its own colour in the display's halo.
import { createParam, note } from '@strudel/core'
import '@d-studio-labs/core/space'
import { BPM } from './song.js'

createParam('curve') // registers .curve()
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

export const main = held('f3,ab3,c4,f4,g4', 'dpadmain').hpf(180).room(0.6).gain(0.3).orbit(7)
export const mid = held('f3,ab3', 'dpadfm')
  .hpf(220)
  .room(0.5)
  .gain(0.28)
  .sphere(1)
  .width(0.25)
  .spin(1 / 8)
  .orbit(8)
export const tex = held('f2', 'dpadtex').hpf(60).room(0.7).gain(0.22).sphere(1).width(0.4).elev(0.1).orbit(9)

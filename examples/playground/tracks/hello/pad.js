// ── Pad: three layers, as in techno/pad.js, one orbit each ──
//   main  dpadmain  the chord: F Ab C F G. Stays in front, plain stereo
//   mid   dpadfm    the minor third (F and Ab), laid round the head, turning slowly
//   tex   dpadtex   a held F, low, wide and still: the floor of the sphere
// `.clip(1)` holds each note for its full slot — SuperDirt's note length, in seconds. Not
// `.sustain()`: that's Strudel's ADSR sustain *level* (0-1), a different control, and the
// engine drops it before it reaches SuperDirt.
// Separate orbits, so each layer has its own colour in the display's halo.
import { note, stack } from '@strudel/core'
import '@d-studio-labs/core/space'

const main = note('f3,ab3,c4,f4,g4').sound('dpadmain').clip(1).hpf(180).room(0.6).gain(0.3).orbit(7)
const mid = note('f3,ab3')
  .sound('dpadfm')
  .clip(1)
  .hpf(220)
  .room(0.5)
  .gain(0.28)
  .sphere(1)
  .width(0.25)
  .spin(1 / 8)
  .orbit(8)
const tex = note('f2').sound('dpadtex').clip(1).hpf(60).room(0.7).gain(0.22).sphere(1).width(0.4).elev(0.1).orbit(9)

export const pad = stack(main, mid, tex)

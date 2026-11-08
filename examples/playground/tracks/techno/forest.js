// ── The forest: a humid, dark night that builds into the drop ──
// A story over the build (song.js has the bars), all for headphones: each element is on its own
// orbit, laid round the listener (.sphere, the HRTF decoder in superdirt/space.scd).
//   bed   insects and water drops (Dirt-Samples' insect and bubble) at random, far apart, in a very
//         wet room that turns slowly: the air of the place
//   owl   a hoot and three more (dowl, synths/d-studio.scd), up in the trees behind you; far off at
//         bar 28, closer at 44 and 60, once more in the outro
//   wolf  a long howl (dwolf), far away and behind at bar 52; at bar 68, four bars before the drop,
//         close, bright and to the left
// Distance is three things at once: the level, a low-pass (.lpf) and how wet it is (.room). Each
// of these follows an env (song.js) from the far call to the near one.
import { irand, note, rand, sound, stack } from '@strudel/core'
import '@d-studio-labs/core/space'
import { during, env, level, FOREST, OWL, WOLF } from './song.js'

// the humid night: katydids and crickets, and drops. degradeBy keeps the hits where rand is high,
// so n, speed and pan read rand at shifted times (see binaural.js)
const chirps = sound('insect*16')
  .degradeBy(0.97)
  .n(irand(3).late(0.31))
  .speed(rand.late(0.47).range(0.85, 1.25))
  .pan(rand.late(0.17))
  .hpf(2500)
  .lpf(6500)
  .gain(0.025)

const drops = sound('bubble*8')
  .degradeBy(0.985)
  .n(irand(8).late(0.23))
  .speed(rand.late(0.59).range(0.5, 1))
  .pan(rand.late(0.71))
  .lpf(2500)
  .gain(0.02)

export const bed = stack(chirps, drops)
  .room(0.7)
  .size(0.9)
  .sphere(1)
  .width(0.25)
  .spin(1 / 32)
  .elev(0.05)
  .orbit(8)
  .apply(level(FOREST))
  .apply(during(FOREST))

// "hoo . . hoo-hoo-hoo", over two bars: one long, then three, a fifth below
export const owl = note('c4 ~ ~ g3 g3 g3 ~ ~')
  .slow(2)
  .sound('dowl')
  .legato(0.8)
  .lpf(env([28, 1800], [60, 3000]))
  .gain(env([28, 0.04], [60, 0.08]))
  .room(env([28, 0.95], [60, 0.7]))
  .size(0.95)
  .sphere(1)
  .width(0.1)
  .azim(0.375)
  .elev(0.12)
  .orbit(9)
  .apply(during(...OWL))

// one howl per four bars' slot, gated to two of them
export const wolf = note('g4')
  .slow(4)
  .sound('dwolf')
  .legato(0.65)
  .lpf(env([52, 1800], [68, 4500]))
  .gain(env([52, 0.08], [68, 0.15]))
  .room(env([52, 0.95], [68, 0.5]))
  .size(0.95)
  .sphere(1)
  .width(0.1)
  .azim(env([52, 0.5], [68, 0.25]))
  .elev(0.02)
  .glide(3)
  .orbit(10)
  .apply(during(...WOLF))

export const forest = stack(bed, owl, wolf)

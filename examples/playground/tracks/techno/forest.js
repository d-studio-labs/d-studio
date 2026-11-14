// ── The forest: a humid, dark night that builds into the drop ──
// A story over the build (song.js has the bars), all for headphones: each element is on its own
// orbit, laid round the listener (.sphere, the HRTF decoder in superdirt/space.scd).
//   canopy  the insects (Dirt-Samples' insect), a ring high above ear level, turning slowly, in a
//           very wet room: far and everywhere (orbit 8)
//   puddle  the water drops (bubble), one place low in front on the right that doesn't move, nearly
//           dry: near, at your feet (orbit 12)
//   owl     a hoot and three more (dowl, synths/d-studio.scd), up in a different tree each call:
//           far behind on the left at bar 28, behind on the right at 44, beside you on the left at 60,
//           then behind on the right in the outro: the sides alternate (orbit 9)
//   wolf    a long howl (dwolf), far away and behind at bar 52; at bar 68, four bars before the
//           drop, close and bright, and it runs one full circle round you while it howls: the 360° of the intro
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

// the insects are the canopy: a ring of them high above ear level (elev 0.14, about 50°), turning
// slowly, in a wet room: far and everywhere
const canopy = chirps
  .room(0.7)
  .size(0.9)
  .sphere(1)
  .width(0.25)
  .spin(-1 / 32)
  .elev(0.14)
  .orbit(8)
  .apply(level(FOREST))
  .apply(during(FOREST))

// the drops are one place on the ground, front right and low, and don't turn: a puddle at your
// feet. A narrow image (width 0.06), little room, so it's near and dry next to the canopy
const puddle = drops
  .room(0.35)
  .size(0.6)
  .sphere(1)
  .width(0.06)
  .azim(-0.12)
  .elev(-0.05)
  .orbit(12)
  .apply(level(FOREST))
  .apply(during(FOREST))

export const bed = stack(canopy, puddle)

// a value that holds until the next bar given and jumps there (env moves linearly between points)
const calls = (...points) =>
  env(
    ...points.flatMap(([bar, v], i) =>
      i
        ? [
            [bar - 0.01, points[i - 1][1]],
            [bar, v],
          ]
        : [[bar, v]],
    ),
  )

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
  // a different tree each call, the sides alternating: behind on the left, behind on the right,
  // beside you on the left, and in the outro behind on the right. It jumps there with the call
  // (glide 0.02), not swings
  .azim(calls([28, 0.42], [44, -0.36], [60, 0.22], [124, -0.38]))
  .elev(calls([28, 0.16], [44, 0.13], [60, 0.1], [124, 0.14]))
  .glide(0.02)
  .orbit(9)
  .apply(during(...OWL))

// one howl per four bars' slot, gated to two of them
// The 360°, once in the intro: the second howl (bar 68, four bars before the drop) runs a full circle
// round the listener while it lasts. The howl is legato 0.65 of its four bars, 2.6 bars, so the spin is
// one turn per 2.6 bars (a spin turns the whole orbit, and the howl is its only voice), front → left →
// behind → right. An event resets the spin to (spin × bar) turns, so the start angle is moved back by
// that to leave it on the right at the first note. At bar 52 there's no spin: that howl is far and still
const HOWL_BARS = 4 * 0.65
const CIRCLE = 1 / HOWL_BARS
const RIGHT = 0.75
const circleFrom = (bar, azim) => azim - ((CIRCLE * bar) % 1)

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
  .azim(env([52, 0.5], [68, circleFrom(68, RIGHT)]))
  .spin(calls([52, 0], [68, CIRCLE]))
  .elev(0.02)
  .orbit(10)
  .apply(during(...WOLF))

export const forest = stack(bed, owl, wolf)

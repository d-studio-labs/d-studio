// ── hello: a demo for the display's halo tab — a whole track, 88 bars, every kind of 3D placement ──
// Run `npm run play -- hello` and `npm run display`, open the halo (key 2), use headphones.
// song.js has the shape (intro, build, groove, breakdown, groove 2, outro). Each part is on its own
// orbit, so each has its own colour in the halo; space.js is where each placement is written.
// Edit any file a part imports and save: `d-studio play` hot-swaps the pattern without restarting
// the clock.
import { gain } from '@strudel/core'
import { kick, click } from './drums.js'
import { main, mid, tex } from './pad.js'
import { bass } from './bass.js'
import { hiss } from './noise.js'
import { melody } from './melody.js'
import { tour, sweep, roll, circle, swing, echo, chord } from './space.js'
import { BPM, BARS, during, env } from './song.js'

export { BPM, BARS }

// a part inside its bars, at a level that moves between [bar, level] points
const part =
  (ranges, ...levels) =>
  (p) =>
    p.apply(during(...ranges)).mul(gain(env(...levels)))

export const parts = {
  // the bed, then the pads one layer at a time: the low F, the minor third, the chord. Each note
  // has its own three-second fade in and out (pad.js), so they enter and leave without a level curve
  hiss,
  tex: tex.apply(during([4, 84])),
  mid: mid.apply(during([8, 80])),
  main: main.apply(during([16, 76])),
  // muted: the music box (melody.js). Uncomment to bring it back, over the intro and the breakdown
  // melody: melody.apply(
  //   part(
  //     [
  //       [8, 32],
  //       [48, 64],
  //       [72, 80],
  //     ],
  //     [8, 0],
  //     [16, 1],
  //     [30, 1],
  //     [32, 0],
  //     [48, 0],
  //     [52, 1],
  //     [62, 1],
  //     [64, 0],
  //     [72, 0],
  //     [74, 1],
  //     [78, 1],
  //     [80, 0],
  //   ),
  // ),
  // the dub chord: ghost echoes at first, open by bar 24, the last thing to leave but the pads
  chord: chord.apply(part([[12, 80]], [12, 0], [24, 1], [72, 1], [80, 0])),
  // the pulse: the kick fades in over eight bars, leaves for the breakdown, and goes first in the outro
  kick: kick.apply(
    part(
      [
        [16, 48],
        [56, 76],
      ],
      [16, 0],
      [24, 1],
      [66, 1],
      [76, 0],
    ),
  ),
  bass: bass.apply(
    part(
      [
        [24, 48],
        [56, 76],
      ],
      [24, 0],
      [28, 1],
      [72, 1],
      [76, 0],
    ),
  ),
  click: click.apply(
    part(
      [
        [32, 48],
        [56, 68],
      ],
      [32, 1],
      [68, 1],
    ),
  ),
  sweep: sweep.apply(
    part(
      [
        [32, 48],
        [56, 68],
      ],
      [32, 1],
      [68, 1],
    ),
  ),
  // the 3D toys: points, then round the head, then everything, then they leave
  tour: tour.apply(
    part(
      [
        [36, 44],
        [60, 68],
      ],
      [36, 1],
      [68, 1],
    ),
  ),
  circle: circle.apply(
    part(
      [
        [40, 48],
        [56, 70],
      ],
      [40, 1],
      [70, 1],
    ),
  ),
  swing: swing.apply(
    part(
      [
        [44, 48],
        [60, 66],
      ],
      [44, 1],
      [66, 1],
    ),
  ),
  roll: roll.apply(part([[48, 76]], [48, 0], [56, 1], [72, 1], [76, 0])),
  echo: echo.apply(
    part(
      [
        [52, 60],
        [64, 72],
      ],
      [52, 1],
      [72, 1],
    ),
  ),
}

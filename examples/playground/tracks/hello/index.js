// ── hello: a demo for the display's halo tab — a whole track, 128 bars, every kind of 3D placement ──
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
  tex: tex.apply(during([4, 124])),
  mid: mid.apply(during([12, 116])),
  main: main.apply(during([24, 108])),
  // muted: the music box (melody.js). Uncomment to bring it back, over the intro and the breakdown
  // melody: melody.apply(
  //   part(
  //     [
  //       [12, 40],
  //       [68, 96],
  //       [108, 120],
  //     ],
  //     [12, 0],
  //     [24, 1],
  //     [38, 1],
  //     [40, 0],
  //     [68, 0],
  //     [72, 1],
  //     [94, 1],
  //     [96, 0],
  //     [108, 0],
  //     [110, 1],
  //     [118, 1],
  //     [120, 0],
  //   ),
  // ),
  // the dub chord: ghost echoes at first, open by bar 32, the last thing to leave but the pads
  chord: chord.apply(part([[16, 116]], [16, 0], [32, 1], [104, 1], [116, 0])),
  // the pulse: the kick fades in over eight bars, leaves for the breakdown, and goes first in the outro
  kick: kick.apply(
    part(
      [
        [24, 64],
        [80, 112],
      ],
      [24, 0],
      [32, 1],
      [104, 1],
      [112, 0],
    ),
  ),
  bass: bass.apply(
    part(
      [
        [32, 64],
        [80, 116],
      ],
      [32, 0],
      [36, 1],
      [108, 1],
      [116, 0],
    ),
  ),
  click: click.apply(
    part(
      [
        [40, 64],
        [80, 100],
      ],
      [40, 1],
      [100, 1],
    ),
  ),
  sweep: sweep.apply(
    part(
      [
        [40, 64],
        [80, 100],
      ],
      [40, 1],
      [100, 1],
    ),
  ),
  // the 3D toys: points, then round the head, then everything, then they leave
  tour: tour.apply(
    part(
      [
        [44, 56],
        [84, 100],
      ],
      [44, 1],
      [100, 1],
    ),
  ),
  circle: circle.apply(
    part(
      [
        [52, 64],
        [80, 106],
      ],
      [52, 1],
      [106, 1],
    ),
  ),
  swing: swing.apply(
    part(
      [
        [56, 64],
        [88, 102],
      ],
      [56, 1],
      [102, 1],
    ),
  ),
  roll: roll.apply(part([[64, 116]], [64, 0], [72, 1], [108, 1], [116, 0])),
  echo: echo.apply(
    part(
      [
        [68, 76],
        [88, 108],
      ],
      [68, 1],
      [108, 1],
    ),
  ),
}

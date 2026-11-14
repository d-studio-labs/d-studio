// ── hello: a demo for the display's halo tab — every kind of 3D placement, 16 bars ──
// Run `npm run play -- hello` and `npm run display`, open the halo (key 2), use headphones.
// Four scenes of four bars (each part is on its own orbit, so each has its own colour):
//   bars  1–4   stereo     kick, the three pad layers (one turning round the head), hats panned by .pan,
//                          the sub bass on the offbeats (dead centre), and the dub chord: Fm7 stabs in
//                          front, their echoes flying round the head. These play all 16 bars
//   bars  5–8   points     clicks at ±45°, pings on the four sides of the head, and above and below
//   bars  9–12  round      a click train all the way round (360°), another swept 180° back and forth,
//                          a held note rolled over the head
//   bars 13–16  everything the above, and an echo whose repeats fly round the head (.space)
// Edit any file a part imports and save: `d-studio play` hot-swaps the pattern without restarting
// the clock. space.js is where each placement is written.
import { arrangement } from '@d-studio-labs/core/arrange'
import { kick, click } from './drums.js'
import { pad } from './pad.js'
import { bass } from './bass.js'
import { tour, sweep, roll, circle, swing, echo, chord } from './space.js'

export const BPM = 120
export const BARS = 16

const { during } = arrangement(BARS)

export const parts = {
  kick,
  pad,
  bass,
  chord,
  sweep,
  click: click.apply(during([4, 16])),
  tour: tour.apply(during([4, 8], [12, 16])),
  circle: circle.apply(during([8, 16])),
  swing: swing.apply(during([8, 12])),
  roll: roll.apply(during([8, 16])),
  echo: echo.apply(during([12, 16])),
}

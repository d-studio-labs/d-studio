// ── Clicks: a soft, dark tick on a Euclidean prime rhythm (5 in 16) ──
// dclick: a tiny noise burst through a bandpass at its own pitch — a knock,
// not a cymbal, so it sits under the kick instead of cutting across it
import { note, rand } from '@strudel/core'

export const clicks = note('c2(5,16)')
  .sound('dclick')
  .gain(0.05)
  .velocity(rand.range(0.7, 1))
  .pan(0.5)
  .delay(0.8)
  .room(0.25)
  .roomsize(0.9)
  .orbit(5)

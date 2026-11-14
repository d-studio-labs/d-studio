// ── Noise: tape hiss, the first sound and the last: the bed under the whole track ──
// dhiss (synths/d-studio.scd): a flat noise bed. legato 2.5, so three notes overlap and the
// crossfades between them keep the level steady (techno/noise.js has the numbers). Its own
// orbit, and laid round the head (.sphere, wide, turning very slowly): the hiss is the room
// the rest sits in, and the halo shows it as a ring of grey.
import { gain, sound } from '@strudel/core'
import '@d-studio-labs/core/space'
import { env } from './song.js'

export const hiss = sound('dhiss')
  .legato(2.5)
  .gain(0.018)
  .sphere(1)
  .width(0.25)
  .spin(-1 / 48)
  .orbit(13)
  .mul(gain(env([0, 0], [10, 1], [78, 1], [87, 0])))

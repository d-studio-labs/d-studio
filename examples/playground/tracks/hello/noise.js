// ── Noise: tape hiss, the first sound and the last: the bed under the whole track ──
// dhiss (synths/d-studio.scd): a flat noise bed. legato 2.5, so three notes overlap and the
// crossfades between them keep the level steady (techno/noise.js has the numbers). Its own
// orbit, and laid round the head (.sphere, wide, turning very slowly): the hiss is the room
// the rest sits in, and the halo shows it as a ring of grey.
import { createParam, gain, sound } from '@strudel/core'
import '@d-studio-labs/core/space'
import { env } from './song.js'

// dcrackle's own control: crackles per second
createParam('density')

export const hiss = sound('dhiss')
  .legato(2.5)
  .gain(0.018)
  .sphere(1)
  .width(0.25)
  .spin(-1 / 48)
  .orbit(13)
  .mul(gain(env([0, 0], [14, 1], [116, 1], [127, 0])))

// vinyl surface under the hiss: dust and a few soft pops, a different noise in each ear. dcrackle fades
// like dhiss, so notes at legato 1.25 crossfade into one steady bed. It shares the hiss's orbit (13), and
// so its place round the head (an orbit keeps the last sphere settings it was sent). Quiet: you should
// miss it when it's gone, not hear it come in
export const crackle = sound('dcrackle')
  .legato(1.25)
  .density(3)
  .gain(0.1)
  .sphere(1)
  .width(0.25)
  .spin(-1 / 48)
  .orbit(13)
  .mul(gain(env([0, 0], [24, 1], [112, 1], [124, 0])))

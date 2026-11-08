// ── Binaural texture: the small sounds that move around the head, for the build ──
// Meant for headphones: each element sits on its own orbit and that orbit's stereo image is
// laid round the listener (.sphere, the HRTF decoder in superdirt/space.scd) and turned
// slowly (.spin), the two in opposite directions. On speakers the same sounds are a plain
// stereo image (DIRT_SPACE=stereo).
//   ticks  tiny clicks at random: a random place across the front (.pan(rand)) and a
//          random pitch, a few a bar, so the spin carries them to every side of the head
//   dust   vinyl crackle, a different noise in each ear, a bed that drifts the other way
// Each fades in over twelve bars and out over the last eight of its range (song.js): both start
// at bar 16 to set the environment and are gone by bar 48, before the wolf and the soft kick.
import { createParam, rand, sound, stack } from '@strudel/core'
import '@d-studio-labs/core/space'
import { during, level, TICKS, DUST } from './song.js'

// dcrackle's own control: crackles per second
const density = createParam('density')

// one 16th in ~six has a click, ~2.4 a bar; dclick's length is its sustain, so a short legato.
// degradeBy keeps the hits where rand is high, so pan and freq read rand at shifted times:
// the same rand would put every click hard right and high
export const ticks = sound('dclick*16')
  .degradeBy(0.85)
  .freq(rand.late(0.29).range(2500, 9000))
  .pan(rand.late(0.13))
  .legato(0.1)
  .gain(0.12)
  .sphere(1)
  .width(0.25)
  .spin(1 / 16)
  .elev(0.03)
  .orbit(6)
  .apply(level(TICKS))
  .apply(during(TICKS))

// legato 1.25 crossfades each bar's note into the next (see dcrackle), so the bed never dips
export const dust = sound('dcrackle')
  .legato(1.25)
  .density(3)
  .gain(0.15)
  .sphere(1)
  .width(0.25)
  .spin(-1 / 24)
  .elev(-0.02)
  .orbit(7)
  .apply(level(DUST))
  .apply(during(DUST))

export const binaural = stack(ticks, dust)

// ── Groove: the hypnotic layer ──
// Three small parts that lock to the kick and never change, so the ear settles into
// them: an offbeat open hat, 16th closed hats with an accent loop, a 16th shaker.
// The repetition stays alive through slow drift (perlin, 17–43 cycles, so the loop
// never lines up with the same filter twice): the hats' high-pass, the gains and the pan.
// Its own orbit (4): the kick's delay, drive and ducking stay off it.
import { sound, stack } from '@strudel/core'
import { drift, sweep } from '@d-studio-labs/core/mod'
import { during, HATS_CLOSED, HATS_OPEN, SHAKER } from './song.js'

// the open hat on every offbeat, choked by the closed hats (.cut)
const open = sound('~ oh ~ oh ~ oh ~ oh')
  .bank('RolandTR909')
  .gain(0.17)
  .hpf(drift(4000, 6500, 29))

// closed 16ths: the third of every four loud, the others tucked under
const closed = sound('hh*16')
  .bank('RolandTR909')
  .gain('[0.10 0.07 0.22 0.07]*4')
  .velocity(drift(0.7, 1, 43))
  .hpf(drift(7000, 10000, 37))
  .pan(sweep(0.4, 0.6, 31))

// a 808 shaker on the 16ths, leaning on the second of every four
const shaker = sound('sh*16')
  .bank('RolandTR808')
  .gain('[0.13 0.22 0.13 0.2]*4')
  .hpf(5000)
  .pan(sweep(0.3, 0.7, 23))

// the groove in layers (song.js): the open hat first, then the closed hats, then the shaker, all
// out for the breakdown and by the outro
export const groove = stack(
  stack(open.apply(during(...HATS_OPEN)), closed.apply(during(...HATS_CLOSED))).cut(1),
  shaker.apply(during(...SHAKER)),
)
  .gain(0.035)
  .room(0.45)
  .roomsize(0.9)
  .orbit(4)

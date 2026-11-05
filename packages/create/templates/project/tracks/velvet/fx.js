// ── FX: noise risers into the sections ──
import { sound } from '@strudel/core'
import { during } from './song.js'

// 4 bars of white noise whose low-pass opens 5 octaves over the whole note
// (lpattack = its length, held open by lpsustain)
export const riser = sound('dwhite')
  .struct('<x ~ ~ ~>')
  .legato(4)
  .attack(3)
  .release(0.2)
  .lpf(400)
  .lpenv(5)
  .lpattack(7.8)
  .lpsustain(1)
  .hpf(300)
  .gain(1.3)
  .room(0.5)
  .size(0.9)
  .orbit(7)
  .apply(during([12, 16], [76, 80], [108, 112]))

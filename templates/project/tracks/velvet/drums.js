// ── Drums: 909 kick on a tuned dkick, 909/808 clap, 909 hats, 808 shaker and congas ──
import { sound, note, stack } from '@strudel/core'
import { drift, sweep } from '@d-studio-labs/core/mod'
import { during, env, groove } from './song.js'

// the 909 for the punch, a short dkick on A (55 Hz) under it for the weight.
// Dips the bass hard (it's the sidechain pump) and the keys and pad a little
export const kick = stack(
  sound('bd*4').bank('RolandTR909').lpf(7000).gain(0.75),
  note('a1*4').sound('dkick').penv(14).pdecay(0.04).legato(0.55).gain(0.7),
)
  .duckorbit('2:3:5')
  .duckdepth('0.35:0.15:0.15')
  .duckattack('0.18:0.2:0.25')
  .orbit(0)
  .apply(during([0, 64], [80, 160]))

// two claps a hair apart, spread left and right: wider than either
export const clap = stack(
  sound('~ cp ~ cp').bank('RolandTR909').pan(0.42),
  sound('~ cp ~ cp').bank('RolandTR808').pan(0.58).nudge(0.012).gain(0.6),
)
  .hpf(250)
  .lpf(drift(6000, 10000, 37))
  .gain(env([16, 0.25], [24, 0.33]))
  .room(0.3)
  .size(0.6)
  .orbit(6)
  .apply(during([16, 64], [80, 152]))

// closed 16ths, loud on the offbeat 8ths, swung
const closed = sound('hh*16')
  .bank('RolandTR909')
  .gain('[0.10 0.07 0.22 0.07]*4')
  .velocity(drift(0.7, 1, 43))
  .hpf(env([0, 9000], [16, 6000]))
  .pan(sweep(0.4, 0.6, 31))

const open = sound('~ oh ~ oh ~ oh ~ oh').bank('RolandTR909').gain(0.17).hpf(4500)

export const hats = groove(stack(closed.apply(during([0, 64], [80, 160])), open.apply(during([16, 64], [80, 152]))))
  .cut(1)
  .room(0.15)
  .size(0.4)
  .orbit(1)

export const shaker = groove(sound('sh*16'))
  .bank('RolandTR808')
  .gain('[0.2 0.13 0.27 0.13]*4')
  .hpf(5000)
  .pan(sweep(0.3, 0.7, 23))
  .room(0.15)
  .orbit(1)
  .apply(during([4, 160]))

// 808 toms as congas, and the 909 rim answering them
export const congas = groove(
  stack(
    sound('~ ~ ~ mt ~ ~ lt ~ ~ mt ~ ~ ~ ~ lt ~').bank('RolandTR808').gain(0.3),
    sound('~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ rim ~ ~ ~ ~').bank('RolandTR909').gain(0.19),
  ),
)
  .hpf(220)
  .pan(sweep(0.35, 0.65, 19))
  .room(0.2)
  .size(0.5)
  .orbit(1)
  .apply(during([8, 128], [144, 160]))

// a crash on the first beat of each new section
export const crash = sound('cr')
  .bank('RolandTR909')
  .gain(0.14)
  .hpf(400)
  .room(0.5)
  .size(0.9)
  .orbit(7)
  .apply(during([16, 17], [32, 33], [80, 81], [112, 113], [144, 145]))

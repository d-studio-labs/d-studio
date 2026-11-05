// ── Track: velvet — deep house, 122 BPM, D minor ──
// 160 bars that loop; the parts bring themselves in and out (song.js has the form)
import { gain } from '@strudel/core'

import { kick, clap, hats, shaker, congas, crash } from './drums.js'
import { bass } from './bass.js'
import { keys, held, pad, pluck } from './keys.js'
import { riser } from './fx.js'

export { BARS } from './song.js'
export const BPM = 122

// the whole mix into the master: +7.6 dB lands ≈ −14 LUFS (the glue
// compressor halves everything above −18 dBFS)
const trim = (p) => p.mul(gain(2.4))

export const parts = Object.fromEntries(
  Object.entries({
    kick,
    clap,
    hats,
    shaker,
    congas,
    crash,
    bass,
    keys,
    held,
    pad,
    pluck,
    riser,
  }).map(([name, p]) => [name, trim(p)]),
)

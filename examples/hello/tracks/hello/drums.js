// ── Drums: a hard, hypnotic four-on-the-floor — Berghain-style, not rave ──
import { sound } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

// kick: four-on-the-floor, straight from the base Dirt-Samples pack (no download needed)
export const kick = sound('bd*4').attack(0.001).decay(0.12).distort(0.3).gain(0.95)

// hats: steady 16ths, a slow drift on the filter so the loop never sits still
export const hats = sound('hh*16').gain('[0.08 0.14]*8').lpf(drift(3000, 6000, 17))

// the "dum-tak": an off-beat clap/rim, minimal, into a dark room
export const perc = sound('~ cp ~ cp').room(0.2).gain(0.5)

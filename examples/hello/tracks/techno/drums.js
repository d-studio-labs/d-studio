// ── Drums: a hard, hypnotic four-on-the-floor — Berghain-style, not rave ──
import { sound, stack } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

// kick: the track's engine — three layers, not one filtered sample.
// 1. the dry hit: clean and punchy, untouched so the transient stays sharp
// 2. a sub layer, pitched an octave down, for the weight under the click
// 3. a rumble: the reverb return, band-limited to 120-200 Hz (hpf protects the
//    clean sub above from being smeared, lpf strips the tail's mud/highs so
//    it's a dark low-mid roll, not a wash) and crushed for grit — on its own
//    orbit, sidechain-ducked by dry+sub on every hit so it pumps, not pools
const dry = sound('bd*4').bank('RolandTR909').gain(0.95).duckorbit('1')
const sub = sound('bd*4').bank('RolandTR909').note(-12).lpf(100).gain(0.6).duckorbit('1')
const reverbReturn = sound('bd*4')
  .bank('RolandTR909')
  .hpf(120)
  .lpf(200)
  .crush(4)
  .room(1)
  .roomsize(0.75)
  .gain(0.4)
  .orbit(1)
export const kick = stack(dry, sub, reverbReturn)

// hats: a 4-bar cycle of different angles — straight 16ths, a euclidean
// variant, a syncopated feel, then sparser — plus a slow filter drift so it
// never fully repeats
export const hats = sound('<hh*16 hh(11,16) [hh hh ~ hh]*4 hh*8>')
  .bank('RolandTR909')
  .gain('[0.08 0.14]*8')
  .lpf(drift(3000, 6000, 17))

// the "dum-tak": TR909 clap, high-passed to cut the boomy ring that reads as
// a cowbell, layered with a short noise burst for broadband texture — the
// clap alone is too tonal; the noise breaks that up into something grittier
const clap = sound('~ cp ~ cp').bank('RolandTR909').hpf(500).room(0.2).gain(0.5)
const texture = sound('~ noise2 ~ noise2').hpf(3000).gain(0.12)
export const perc = stack(clap, texture)

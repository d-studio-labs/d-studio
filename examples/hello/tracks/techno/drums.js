// ── Drums: a hard, hypnotic four-on-the-floor — Berghain-style, not rave ──
import { sound, stack } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

// kick: three layers. Dropped the high-passed click layer — between this,
// the hats, and the clap, there were too many high-passed/crushed "noise"
// elements stacking into a harsh wall; the dry hit's own transient is enough
// 1. the dry hit: clean and punchy, untouched so the transient stays sharp
// 2. a sub layer, pitched an octave down, for the weight under the click
// 3. a rumble: the reverb return, band-limited to 120-200 Hz (hpf protects the
//    clean sub above from being smeared, lpf strips the tail's mud/highs so
//    it's a dark low-mid roll, not a wash) and crushed for grit — on its own
//    orbit, sidechain-ducked by dry+sub on every hit so it pumps, not pools
// every 16 bars, the dry hit gets noticeably crushed for that one bar only —
// a textural accent, not a constant; same hits, same count, just dirtier
const dry = sound('bd*4')
  .bank('RolandTR909')
  .gain(0.95)
  .duckorbit('1')
  .every(16, (p) => p.crush(3))
const sub = sound('bd*4').bank('RolandTR909').note(-12).lpf(100).gain(0.6).duckorbit('1')
const reverbReturn = sound('bd*4')
  .bank('RolandTR909')
  .hpf(120)
  .lpf(200)
  .crush(8)
  .room(1)
  .roomsize(0.75)
  .gain(0.4)
  .orbit(1)
export const kick = stack(dry, sub, reverbReturn)

// hats: a 4-bar cycle of different angles — straight 16ths, a euclidean
// variant, a syncopated feel, then sparser. A light swing (every other 8th
// nudged late) is where the groove comes from — kick and bass stay straight
export const hats = sound('<hh*16 hh(11,16) [hh hh ~ hh]*4 hh*8>')
  .bank('RolandTR909')
  .gain('[0.08 0.14]*8')
  .lpf(drift(1800, 3500, 17))
  .swingBy(0.08, 8)

// the "dum-tak": two TR909 claps stacked a few ms apart with a slight pitch
// offset (the classic "fat clap" trick), a dark room return for size. Dropped
// the dedicated noise-texture layer and backed off the crush amounts — this
// plus the kick's click and the hats' crush was too much noise/grit at once
const clap1 = sound('~ cp ~ cp').bank('RolandTR909').hpf(300).gain(0.5)
const clap2 = sound('~ cp ~ cp').bank('RolandTR909').hpf(300).note(-1).gain(0.35).nudge(0.015)
const clapRoom = sound('~ cp ~ cp').bank('RolandTR909').hpf(300).lpf(2500).room(1).roomsize(0.85).gain(0.3)
export const perc = stack(clap1, clap2, clapRoom)

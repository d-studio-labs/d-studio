// ── Drums: a hard, hypnotic four-on-the-floor — Berghain-style, not rave ──
import { sound, stack } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

// kick: the track's engine — four layers, not one filtered sample.
// 1. a high-passed click, right on the attack — the transient snap that cuts
//    through a club system (a dry sample alone has a soft, round attack)
// 2. the dry hit: clean and punchy, untouched so the transient stays sharp
// 3. a sub layer, pitched an octave down, for the weight under the click
// 4. a rumble: the reverb return, band-limited to 120-200 Hz (hpf protects the
//    clean sub above from being smeared, lpf strips the tail's mud/highs so
//    it's a dark low-mid roll, not a wash) and crushed for grit — on its own
//    orbit, sidechain-ducked by dry+sub on every hit so it pumps, not pools
const click = sound('click*4').hpf(6000).gain(0.3)
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
export const kick = stack(click, dry, sub, reverbReturn)

// hats: a 4-bar cycle of different angles — straight 16ths, a euclidean
// variant, a syncopated feel, then sparser. Darker filter range and a touch
// of crush so it reads as worn/analog, not a clean digital drum-machine demo
export const hats = sound('<hh*16 hh(11,16) [hh hh ~ hh]*4 hh*8>')
  .bank('RolandTR909')
  .gain('[0.08 0.14]*8')
  .lpf(drift(1800, 3500, 17))
  .crush(6)

// the "dum-tak": two TR909 claps stacked a few ms apart with a slight pitch
// offset (the classic "fat clap" trick — one clap alone sounds thin/toy),
// high-passed to cut the cowbell-ish ring, crushed for grit, into a bigger,
// darker room than before — underground, not a clean preset
const clap1 = sound('~ cp ~ cp').bank('RolandTR909').hpf(500).gain(0.5)
const clap2 = sound('~ cp ~ cp').bank('RolandTR909').hpf(500).note(-1).gain(0.35).nudge(0.015)
const clapRoom = sound('~ cp ~ cp').bank('RolandTR909').hpf(400).lpf(2500).room(1).roomsize(0.85).crush(5).gain(0.3)
const texture = sound('~ noise2 ~ noise2').hpf(3000).gain(0.12)
export const perc = stack(clap1, clap2, clapRoom, texture)

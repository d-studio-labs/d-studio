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
// of crush so it reads as worn/analog, not a clean digital drum-machine demo.
// A light swing (every other 8th nudged late) is where the groove actually
// comes from — the kick and bass stay dead straight as the anchor
export const hats = sound('<hh*16 hh(11,16) [hh hh ~ hh]*4 hh*8>')
  .bank('RolandTR909')
  .gain('[0.08 0.14]*8')
  .lpf(drift(1800, 3500, 17))
  .crush(6)
  .swingBy(0.08, 8)

// the "dum-tak": two TR909 claps stacked a few ms apart with a slight pitch
// offset (the classic "fat clap" trick), crushed for grit, a dark room — and
// a prominent noise layer, since a clean 909 clap on its own always reads as
// a drum-machine demo; the broadband noise is what makes it feel underground
// rather than synthetic. hpf is lower than before (300, not 500) so it keeps
// some low-mid body instead of being thin and bright.
const clap1 = sound('~ cp ~ cp').bank('RolandTR909').hpf(300).crush(5).gain(0.5)
const clap2 = sound('~ cp ~ cp').bank('RolandTR909').hpf(300).crush(5).note(-1).gain(0.35).nudge(0.015)
const clapRoom = sound('~ cp ~ cp').bank('RolandTR909').hpf(300).lpf(2500).room(1).roomsize(0.85).crush(5).gain(0.3)
const texture = sound('~ noise2 ~ noise2').hpf(1200).lpf(6000).gain(0.2)
export const perc = stack(clap1, clap2, clapRoom, texture)

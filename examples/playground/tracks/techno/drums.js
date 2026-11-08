// ── Rumble kick, after the Ableton rack ──
// Two layers, each a different kick, shaped after the two waveforms in the rack:
// a fat sine (`body`) and a short pitch-dropped sub thump (`thump`). Both go into
// the rack's two chains:
//   dry  (orbit 0)  the layers as they are: the kick you hear
//   wet  (orbit 1)  the same layers → delay (1/16, 50% feedback) → drive (the Amp)
//                   → a 24 dB low-pass at 97 Hz after it (.drivelpf, the Auto
//                   Filter, static: its envelope and LFO are at 0), so only the sub
//                   the clip thickened is left; then the compressor, sidechained
//                   (2:1, −29 dB, 2 ms / 50 ms): each dry hit ducks this orbit
//                   (.duckorbit), so the punch stays clear and the rumble fills the gaps
// Delay and drive are orbit settings, run in that order on the orbit, which is why
// each chain has its own orbit. The dry orbit is untouched (no drive: the body stays
// a clean sine). The rack's drum buss and EQ8 on the group are only the master's glue
// and tape (master.scd); there's no EQ, so no low boost and no mud cut.
import { createParam, note, stack } from '@strudel/core'
import { SIXTEENTH } from '@d-studio-labs/core/fx'

// dkick's own controls (synths/d-studio.scd): the tail's curve and the click level
const curve = createParam('curve')
const click = createParam('click')

// "Kick": a clean sine at ~60 Hz (B1), no pitch drop, ~240 ms, no click: the fat layer
export const body = note('b1*4').sound('dkick').penv(0).click(0).curve(0).legato(0.34).gain(0.8)
// "Kick 2": the same kind of sine but starting an octave up and falling onto ~49 Hz
// (G1) in ~40 ms, ~300 ms long, low-passed at 100 Hz: a soft sub thump, no click
export const thump = note('g1*4').sound('dkick').penv(12).pdecay(0.04).click(0).curve(0).legato(0.76).lpf(100).gain(0.8)
const layers = stack(body, thump)

export const kick = layers
  .duckorbit(1)
  .duckdepth(0.55)
  .duckonset(0.002)
  .duckattack(0.25)
  .orbit(0)

export const rumble = layers
  .delay(1)
  .lock(1)
  .delaytime(SIXTEENTH)
  .delayfeedback(0.5)
  .drive(0.7)
  .drivelpf(97)
  .gain(0.67)
  .orbit(1)

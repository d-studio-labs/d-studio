// ── Rumble kick, after the Ableton rack ──
// The kick is a TR-909 bass drum (KIT below; the TR-808's and the two synthesised sine layers,
// shaped after the rack's two waveforms, are the alternatives). Both go into
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
import { createParam, gain, note, sine, sound, stack } from '@strudel/core'
import { SIXTEENTH } from '@d-studio-labs/core/fx'
import { during, env, KICK, KICK_LEVEL, RUMBLE_OPEN, TEASE_BARS, TEASE_DEPTH } from './song.js'

// dkick's own controls (synths/d-studio.scd): the tail's curve and the click level
const curve = createParam('curve')
const click = createParam('click')

// "Kick": a clean sine at ~65 Hz (C2, the fifth of the pad's F), no pitch drop, no click: the fat layer
export const body = note('c2*4').sound('dkick').penv(0).click(0.15).curve(0).legato(0.34).gain(0.8)
// "Kick 2": the same kind of sine but starting an octave up and falling onto ~49 Hz
// (G1) in ~40 ms, ~300 ms long, low-passed at 100 Hz: a soft sub thump, no click
export const thump = note('g1*4')
  .sound('dkick')
  .penv(12)
  .pdecay(0.04)
  .click(0.15)
  .curve(0)
  .legato(0.76)
  .lpf(100)
  .gain(0.8)

// ── The kick's source: KIT picks what both chains play ──
//   club    Dirt-Samples' clubkick 1: a short, bright kick (0.2 s) that settles on 63.5 Hz; speed 1.03
//           tunes it to C2 (65 Hz, the fifth of the pad's F, where the synthesised body was), with the
//           soft G1 sub (thump) under it for the weight the sample's short tail doesn't have
//   909     the TR-909's short bass drum (Bassdrum-03), tuned to Ab1 (52 Hz) by speed 0.91
//   808     the TR-808's bass drum BD2550 (n 13): a round boom on 49.5 Hz, G1, as it is; its 1.5 s tail
//           is cut at 0.8 of a beat
//   dkick   the two synthesised sine layers above
// Measured from the samples (spectra of the attack and the tail), not guessed. The Roland samples are
// dull: their first 12 ms hold 30 to 37 dB less above 1.5 kHz than below 120 Hz, the clubkicks' 6 to 9 dB, so
// the 909 and 808 read as filtered
export const KIT = 'club'
const kits = {
  club: stack(sound('clubkick*4').n(0).speed(1.03).legato(0.5).release(0.03).gain(0.7), thump.gain(0.6)),
  909: sound('bd*4').bank('RolandTR909').n(2).speed(0.91).legato(0.5).release(0.03).gain(0.8),
  808: sound('bd*4').bank('RolandTR808').n(13).legato(0.8).release(0.06).gain(0.8),
  dkick: stack(body, thump),
}
const layers = kits[KIT]

// ducks the rumble (orbit 1), the dark drone (11), the sub (5), the lead (13) and the discreet pad
// (14), each less than the one before it
const dry = layers
  .duckorbit('1:11:5:13:14')
  .duckdepth('0.55:0.5:0.5:0.35:0.3')
  .duckonset(0.002)
  .duckattack(0.25)
  .orbit(0)

// the rumble opens over the bars RUMBLE_OPEN (song.js): more drive, a longer echo and its low-pass
// climbing, so it thickens and fills the gaps more as the track approaches the climax
const opens = (from, to) => env([RUMBLE_OPEN[0], from], [RUMBLE_OPEN[1], to])
export const rumble = layers
  .delay(1)
  .lock(1)
  .delaytime(SIXTEENTH)
  .delayfeedback(opens(0.5, 0.7))
  .drive(opens(0.7, 0.9))
  .drivelpf(opens(97, 150))
  .gain(0.67)
  .orbit(1)

// the kick for the whole song, in one part: both chains (two orbits), so it's one part to launch.
// It fades in over the sixteen bars to the drop and out over the outro (the level, squared so the
// start creeps in), and until bar 68 a slow LFO pulls it down by up to 70% and lets it back up: it
// teases, almost arrives, then recedes. The LFO's cycle (TEASE_BARS, three bars) never lines up
// with the pad's four-bar chords; its depth is gone by the drop. A two-bar breakdown takes it out
// before the climax (all in song.js)
const level = env(...KICK_LEVEL)
const tease = sine.range(0, 1).slow(TEASE_BARS)
const lfo = env(...TEASE_DEPTH)
  .mul(tease.sub(1))
  .add(1)
const fade = level.mul(level).mul(lfo)

// what the kick ducks follows its level: the dip is 1 − √depth (superdirt/master.scd), so the
// depth follows the square of the level. A faint kick hardly dips the rumble, the dark drone, the
// sub and the lead; a full one dips them all the way, so they don't pile onto the kick's low end.
// The rumble's own duck (the first of the list) deepens by 30% as the rumble opens (`deep`): the
// climax pumps harder
const deep = env([RUMBLE_OPEN[0], 1], [RUMBLE_OPEN[1], 1.3])
const ducksFollow = (p) =>
  p
    .fmap(
      (v) => (l) => (k) =>
        v.duckdepth === undefined
          ? v
          : { ...v, duckdepth: [].concat(v.duckdepth).map((d, i) => d * l ** 2 * (i === 0 ? k : 1)) },
    )
    .appLeft(fade)
    .appLeft(deep)

export const kick = ducksFollow(
  stack(dry, rumble)
    .apply(during(...KICK))
    .mul(gain(fade)),
)

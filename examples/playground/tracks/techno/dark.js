// ── Dark drone: the tease before the kick, and a marker between states ──
// dbasspad (synths/d-studio.scd) on F2 and C3 (a fifth, no third: bare and dark), and under it
// bass.js's sub on F1. It breathes, and each breath is a swell: a note of eight bars (15 s) that
// comes up over 8 s and rushes at the top, holds 1 s, falls over 4 s and rests for the last 2 s,
// then the next one. Inside each breath the low-pass climbs three times higher and the level
// grows from 10% to full (rise and swell in the synth), so the swell opens as well as grows.
//   build  three breaths, from bar 48 to the drop at 72; each a little brighter (the low-pass
//          at 140, then 360, then 580 Hz) and louder (gain 0.15, 0.21, 0.27) than the last
//   outro  one breath from bar 88 to 96, the move out of the main part
// The notes are F2 and up so the pad doesn't sit on the kick's sub (49 Hz, the thump).
import { createParam, note, stack } from '@strudel/core'
import '@d-studio-labs/core/fx'
import { BPM, during, env, DARK_BUILD, DARK_OUTRO } from './song.js'

// dbasspad's own controls (synths/d-studio.scd)
const bright = createParam('bright')
const rise = createParam('rise')
const swell = createParam('swell')
const lfohz = createParam('lfohz')
const lfodepth = createParam('lfodepth')

// one breath per eight-bar slot, shaped as a swell: it comes up slowly and rushes at the top
// (curve 2: slow then fast), over `attack` seconds, holds, and falls the same way over `release`
// (the first part slow, the end quick); the note ends there (legato < 1) and the rest of the slot
// is silence. Longer attack, shorter hold: more swell, less plateau.
const BAR = (4 * 60) / BPM
const BREATH = { bars: 8, attack: 8, hold: 1, release: 4 }
export const drone = (notes, voice) => {
  const { bars, attack, hold, release } = BREATH
  return note(notes)
    .slow(bars)
    .sound(voice)
    .attack(attack)
    .hold(hold)
    .release(release)
    .curve(2)
    .legato((attack + hold + release) / (bars * BAR))
}

// slower and shallower than the pad's sweep (0.05 Hz, 0.8 octave): more drone, less motion
const calm = (p) => p.lfohz(0.03).lfodepth(0.5)

const build = calm(drone('f2,c3', 'dbasspad'))
  .bright(env([48, 140], [72, 800]))
  .rise(3)
  .swell(0.1)
  .gain(env([48, 0.15], [68, 0.3]))
  .apply(during(DARK_BUILD))

const outro = calm(drone('f2,c3', 'dbasspad'))
  .bright(800)
  .swell(0.1)
  .gain(0.3)
  .apply(during(DARK_OUTRO))

// kept out of the kick's low end: a high-pass at 110 Hz, above its thump (49 Hz), body (65 Hz) and
// rumble (low-passed at 97 Hz). The sub drone (bass.js) is the only thing down there with it. F2's
// fundamental (87 Hz) is cut, so the drone is heard by its harmonics and the C3 (131 Hz)
// a little grit: the orbit's drive (superdirt/drive.scd), after the high-pass and before the room, so
// the reverb is of the driven sound. The synth already soft-clips; this adds a bit more, low and dark
export const dark = stack(build, outro).hpf(110).drive(0.15).drivetone(0.35).room(0.5).size(0.9).orbit(11)

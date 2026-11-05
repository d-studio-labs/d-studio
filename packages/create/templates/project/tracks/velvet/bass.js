// ── Bass: dbass, plucked by its filter, pumped by the kick ──
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'
import { during, groove, bassline } from './song.js'

// short notes; the filter snaps open ~2 octaves and closes in 120 ms, so each
// note has a soft "dum" on top of the sine
export const bass = groove(note(bassline))
  .sound('dbass')
  .voice(0.45)
  .legato(1.6)
  .lpf(drift(220, 420, 41))
  .lpq(1.5)
  .lpenv(2)
  .lpdecay(0.12)
  .gain(0.55)
  .pan(0.5)
  .orbit(2)
  .apply(during([16, 64], [80, 144]))

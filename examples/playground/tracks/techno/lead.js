// ── Lead: the hypnotic melody ──
// What makes it hypnotic is repetition that slowly shifts, not a tune:
//   · a short motif from the Fm9's own notes (F Ab C G), so it can't clash with the pad
//   · seven steps long against a sixteen-step bar (.fast(16 / 7), every step a 16th): it only
//     lines up with the kick every 112 steps (7 bars), so it keeps sliding against the beat
//   · a dotted-8th echo (feedback 0.45) that blurs it into itself
//   · short, plucky notes, with the filter opening a little on each one (.lpenv) and the
//     cutoff drifting slowly over 23 cycles (.lpf(drift)), so the filter does the evolving
//   · every fourth pass of the motif, rotated by two steps: a variation you feel, not hear
// dlead (synths/d-studio.scd), mono and bright-ish, but ducked by the kick (drums.js) and dark
// above 2.4 kHz. Its own orbit (13). It comes in at bar 80, over eight bars, and carries through
// the breakdown to the outro (song.js)
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'
import { DOTTED_EIGHTH } from '@d-studio-labs/core/fx'
import { during, env, LEAD } from './song.js'

const motif = 'f4 ~ ab4 c5 ~ g4 ~'

export const lead = note(motif)
  .every(4, (p) => p.early(2 / 7))
  .fast(16 / 7)
  .sound('dchord')
  .legato(0.75)
  .lpf(drift(700, 2400, 23))
  .lpq(8)
  .lpenv(2.5)
  .lpdecay(0.1)
  .hpf(220)
  .gain(env([LEAD[0], 0], [LEAD[0] + 8, 0.2], [LEAD[1] - 6, 0.2], [LEAD[1], 0]))
  .delay(0.55)
  .lock(1)
  .delaytime(DOTTED_EIGHTH)
  .delayfeedback(0.45)
  .room(0.65)
  .size(0.95)
  .orbit(13)
  .apply(during(LEAD))

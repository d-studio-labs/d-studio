// ── Melody: a music box, three notes every two bars ──
// dbox (synths/d-studio.scd), F Ab C: the notes the pad and both chords share, so it can't clash. It
// rings 2.5 s (a long legato) into a dotted-quarter echo that's thrown into the sphere and circles
// the head: the melody stays in front-left, its echoes wander. Its own orbit.
import { note } from '@strudel/core'
import '@d-studio-labs/core/fx'
import '@d-studio-labs/core/space'

export const melody = note('f5 ~ ~ ab5 ~ ~ c6 ~')
  .slow(2)
  .sound('dbox')
  .voice(0.6)
  .legato(2.5)
  .gain(0.35)
  .pan(0.35)
  .delay(0.55)
  .lock(1)
  .delaytime(3 / 8)
  .delayfeedback(0.55)
  .delayfreq(2400)
  .delaywidth(2)
  .space(1)
  .azim(-0.25)
  .spin(1 / 10)
  .elev(0.05)
  .room(0.8)
  .size(0.95)
  .orbit(14)

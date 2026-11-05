// ── Keys: dkeys chords, dstrings pad, dpluck hook ──
import { note, sine } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'
import { during, env, groove, chords, hook } from './song.js'
import { DOTTED_EIGHTH } from '@d-studio-labs/core/fx'

// the chord stabs, offbeat, a 3rd hit every other bar. The low-pass opens
// through the intro and closes for the outro
export const keys = groove(
  note(chords).struct(`<
  [~ ~ x ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ ~]
  [~ ~ x ~ ~ ~ ~ x ~ ~ x ~ ~ ~ ~ ~]
>`),
)
  .sound('dkeys')
  .voice(drift(0.7, 1.2, 37))
  .legato(3)
  .lpf(env([8, 700], [32, 5000], [128, 5000], [144, 1200]))
  .hpf(260)
  .gain(drift(0.23, 0.28, 29))
  .pan(sine.range(0.4, 0.6).slow(17))
  .delay(0.25)
  .lock(1)
  .delaytime(DOTTED_EIGHTH)
  .delayfeedback(0.35)
  .room(0.3)
  .size(0.7)
  .orbit(3)
  .apply(during([8, 64], [80, 144]))

// the break: the same chords held for two bars, played softer, ringing out
export const held = note(chords)
  .struct('<x ~>')
  .sound('dkeys')
  .voice(0.6)
  .legato(2)
  .hpf(220)
  .gain(0.21)
  .delay(0.35)
  .lock(1)
  .delaytime(DOTTED_EIGHTH)
  .delayfeedback(0.45)
  .room(0.45)
  .size(0.85)
  .orbit(3)
  .apply(during([64, 80]))

// strings an octave up, barely there in the groove, the bed of the break
export const pad = note(chords)
  .add(note(12))
  .sound('dstrings')
  .attack(1.5)
  .release(2)
  .legato(1.15)
  .voice(drift(0.25, 0.45, 47))
  .hpf(400)
  .gain(env([16, 0], [32, 0.15], [64, 0.33], [80, 0.15], [128, 0.15], [144, 0]))
  .room(0.7)
  .size(0.95)
  .orbit(5)
  .apply(during([16, 144]))

// the hook, into a dotted-8th echo, in the break and the drop
export const pluck = groove(note(hook))
  .sound('dpluck')
  .voice(drift(0.45, 0.7, 31))
  .legato(4)
  .hpf(300)
  .gain(env([68, 0.8], [80, 1.1]))
  .pan(sine.range(0.35, 0.65).slow(11))
  .delay(0.4)
  .lock(1)
  .delaytime(DOTTED_EIGHTH)
  .delayfeedback(drift(0.35, 0.5, 43))
  .room(0.4)
  .size(0.8)
  .orbit(4)
  .apply(during([68, 128]))

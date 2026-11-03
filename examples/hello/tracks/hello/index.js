// ── hello: the smallest track that shows the pieces fitting together ──
// Saving this file hot-swaps the pattern while `npm run play` is running.

// @strudel/core: the pattern language (sound/note, built-in SuperDirt synths)
import { sound, note } from '@strudel/core'
// @d-studio-labs/core/mod: a slow drifting number, for filters that breathe
import { drift } from '@d-studio-labs/core/mod'
// @d-studio-labs/core/fx: shared dub helpers (gentle filter swell + echo/reverb)
import { evolvingFilter, dubSpace } from '@d-studio-labs/core/fx'

export const BPM = 120

// kick: four-on-the-floor, SuperDirt's built-in Dirt-Samples bank
export const kick = sound('bd*4').gain(0.9)

// hats: open/closed pair, a slowly drifting filter so it never sits still
export const hats = sound('[hh oh]*4')
  .lpf(drift(800, 2000, 11))
  .gain(0.15)

// bass: one held root note, filter opening and closing on its own
export const bass = evolvingFilter(note('c2').sound('sawtooth').gain(0.3))

// chord: a triad with a wash of delay and room, dub-style
export const chord = dubSpace(note('<[c4,e4,g4]>').sound('sawtooth').gain(0.18))

// every key here is one lane; comment one out to mute it
export const parts = { kick, hats, bass, chord }

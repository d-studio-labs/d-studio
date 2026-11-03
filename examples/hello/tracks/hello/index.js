// ── hello: the smallest track that shows the pieces fitting together ──
// Saving any file here hot-swaps the pattern while `d-studio play` is running.
// Berghain-flavored techno: hard and hypnotic, not rave — kept as the intro/
// reference loop for testing the engine.

import { kick, hats, perc } from './drums.js'
import { bass } from './bass.js'
import { stab } from './chords.js'

export const BPM = 132

// every key here is one lane; comment one out to mute it
export const parts = { kick, hats, perc, bass, stab }

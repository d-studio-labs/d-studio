// ── Chord: one minor stab a bar, dry and tight — an accent, not a wash ──
import { note } from '@strudel/core'

export const stab = note('<[c3,eb3,g3]>').sound('stab').attack(0.001).decay(0.1).sustain(0).room(0.08).gain(0.22)

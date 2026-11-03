// ── Chord: one minor stab a bar, dry and tight — an accent, not a wash ──
// Note: this reads more house/trance than genre-authentic Berghain techno
// (confirmed via research — the style is largely harmony-free). Kept as an
// option alongside `pulse`; mute whichever doesn't fit once you hear both.
import { note } from '@strudel/core'

export const stab = note('<[c3,eb3,g3]>').sound('stab').room(0.08).gain(0.35)

// ── Chord: one minor stab a bar, dry and tight — an accent, not a wash ──
// Note: this reads more house/trance than genre-authentic Berghain techno
// (confirmed via research — the style is largely harmony-free). Kept as an
// option alongside `pulse`; mute whichever doesn't fit once you hear both.
// Had no filter at all before — raw and bright, competing with the kick.
import { note } from '@strudel/core'

export const stab = note('<[c3,eb3,g3]>').sound('stab').lpf(1000).room(0.08).gain(0.3)

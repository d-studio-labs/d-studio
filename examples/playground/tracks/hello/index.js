// ── hello: a minimal starting point — two parts, four bars ──
// Edit any file a part imports and save: `d-studio play` hot-swaps the
// pattern without restarting the clock. Add a new folder next to this one
// for your next track.
import { kick } from './drums.js'
import { pad } from './pad.js'

export const BPM = 120
export const BARS = 4

export const parts = {
  kick,
  pad,
}

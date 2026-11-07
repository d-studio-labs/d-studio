// ── drift: a heartbeat kick and a held sub line, under a chord progression ──
// on dpadsweep/dsuper touring the room (space.js), a sparse dkeys lead over
// the top. Binaural: best on headphones
import { kick } from './kick.js'
import { sub } from './sub.js'
import { clicks } from './clicks.js'
import { melody } from './melody.js'
import { hiss } from './texture.js'
import { padSweepTour } from './space.js'

export const BPM = 112
export const BARS = 40

export const parts = {
  kick,
  sub,
  clicks,
  // melody,
  padSweepTour,
  hiss,
}

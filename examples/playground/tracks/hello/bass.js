// ── Bass: a sub sine under the chord, on the offbeats between the kicks ──
// dsub (synths/d-studio.scd) on F1 (44 Hz, the root of the chord's F minor) for four bars, then Db1 (the
// root of its Dbmaj7). A little 2nd harmonic (.voice) so it still shows on small speakers. Dead centre
import { note } from '@strudel/core'

export const bass = note('<f1 db1>')
  .slow(4)
  .struct('~ x ~ x ~ x ~ x')
  .sound('dsub')
  .legato(0.8)
  .voice(0.25)
  .gain(0.55)
  .orbit(12)

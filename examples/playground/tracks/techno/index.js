// ── techno: it builds from the hiss, one pad layer at a time, a dark drone with a sub under it, into the rumble kick with a groove, a hypnotic lead and a climax ──
// 128 bars (song.js): hiss · pad layers · binaural dust and ticks · the forest · the dark drone and sub · the kick · main (the lead, the discreet pad, the rumble opening) · breakdown · climax · outro, then it loops
import { air } from './air.js'
import { sub } from './bass.js'
import { binaural } from './binaural.js'
import { dark } from './dark.js'
import { kick } from './drums.js'
import { forest } from './forest.js'
import { groove } from './groove.js'
import { lead } from './lead.js'
import { hiss } from './noise.js'
import { pad } from './pad.js'

export { BARS, BPM } from './song.js'

export const parts = {
  kick,
  sub,
  //groove,
  dark,
  pad,
  hiss,
  binaural,
  forest,
  lead,
  air,
}

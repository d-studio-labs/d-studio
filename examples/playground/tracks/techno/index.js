// ── techno: the rumble kick, a dry chain and a wet chain, with a three-layer pad over tape hiss ──
import { kick, rumble } from './drums.js'
import { hiss } from './noise.js'
import { pad } from './pad.js'

export const BPM = 128
export const BARS = 4

export const parts = {
  kick,
  rumble,
  pad,
  hiss,
}

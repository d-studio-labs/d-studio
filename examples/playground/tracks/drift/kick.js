// ── Kick: the heartbeat (@d-studio-labs/core/drums), tuned to the chord's root ──
import { heartbeat } from '@d-studio-labs/core/drums'

export const kick = heartbeat('c1').orbit(0)

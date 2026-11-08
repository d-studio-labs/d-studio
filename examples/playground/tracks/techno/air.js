// ── Air: the discreet pad ──
// A thin, high layer that supports without competing, above the pad and the dark drone:
//   · F5 and C6, with dpadtex's band-pass (centre twice the note: about 1.4 and 2.1 kHz), so it
//     reads as air, not harmony
//   · high-passed at 500 Hz and quiet (gain 0.12)
//   · sparse: one swell every eight bars (dark.js's drone: the same swell and rest), not a bed
//   · very wet, and wide: round the head (.sphere) turning slowly
//   · ducked by the kick, the lightest of the lot (drums.js)
// Its own orbit (14). It comes in at bar 88, with the rumble opening, and rings out after bar 124
import '@d-studio-labs/core/space'
import { drone } from './dark.js'
import { during, AIR } from './song.js'

export const air = drone('f5,c6', 'dpadtex')
  .lfohz(0.03)
  .lfodepth(0.5)
  .hpf(500)
  .gain(0.12)
  .room(0.9)
  .size(0.95)
  .sphere(1)
  .width(0.3)
  .spin(1 / 12)
  .orbit(14)
  .apply(during(AIR))

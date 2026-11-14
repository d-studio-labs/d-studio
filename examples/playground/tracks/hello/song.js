// ── The shape of the song: 128 bars at 120 BPM, about 4:16 ──
//   bars   1–24   intro       tape hiss fades in as the bed (bars 1–12); the low F pad enters at bar 5, the
//                             minor third at 13, the dub chord's first ghost echoes at 17
//   bars  25–40   build       the full pad, then the kick fades in (bars 25–32), the sub bass at 33
//   bars  41–64   groove      hats, clicks, pings; a 360° circle and a swing round the head from bar 53
//   bars  65–80   breakdown   no kick or bass: pad, chord, the pad rolled over the head, the echo flying
//   bars  81–104  groove 2    everything back, all the 3D at once
//   bars 105–128  outro       the kick leaves (105–112), then the bass, the 3D toys, the chord and the pads
//                             one by one; only the hiss is left at the end, and it fades out
// Nothing sits still: the pads' filters, the chord's filter and echo, the bass's weight all drift
// slowly on their own periods (23–53 bars), so no two passes sound the same.
// `during` cuts a part to its bars, `env` is a level moving linearly between [bar, level] points; both loop.
import { arrangement } from '@d-studio-labs/core/arrange'

export const BPM = 120
export const BARS = 128

export const { during, env } = arrangement(BARS)

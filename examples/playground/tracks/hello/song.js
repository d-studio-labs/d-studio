// ── The shape of the song: 88 bars at 120 BPM, about 2:56 ──
//   bars  1–16   intro       tape hiss fades in as the bed (bars 1–8); the low F pad enters at bar 5, the
//                            minor third at 9, a music box at 9 and the dub chord's first ghost echoes at 13
//   bars 17–32   build       the full pad, then the kick fades in (bars 17–24), the sub bass at 25, the chord opens
//   bars 33–48   groove      hats, clicks, pings; a 360° circle and a swing round the head from bar 41
//   bars 49–56   breakdown   no kick or bass: pad, chord, music box, the pad rolled over the head, the echo flying
//   bars 57–72   groove 2    everything back, all the 3D at once
//   bars 73–88   outro       the kick leaves (73–76), then the bass, the 3D toys, the chord and the pads one by one;
//                            only the hiss is left at the end, and it fades out
// `during` cuts a part to its bars, `env` is a level moving linearly between [bar, level] points; both loop.
import { arrangement } from '@d-studio-labs/core/arrange'

export const BPM = 120
export const BARS = 88

export const { during, env } = arrangement(BARS)

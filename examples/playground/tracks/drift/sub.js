// ── Sub: the line under the chord, dsub, one note every 2 bars ──
// C, E♭, B♭, C — i, ♭III, ♭VII, i: no leading tone and no cadence, so it turns
// slowly instead of pulling anywhere. The chord (pad.js) holds its one voicing
// throughout the tour: the bass carries the rhythm here, never both at once
//
// dynamics over the 40-bar tour (space.js): full through the front and wide
// scenes (0–16), dissolving out (gain and low-pass together) as the pad
// swings behind (16–24), silent while it's overhead (24–32), then back with
// more power as it rolls forward again (32–36), settling into the groove for
// the next lap (36–40)
import { note, gain } from '@strudel/core'
import { arrangement } from '@d-studio-labs/core/arrange'

const BARS = 40
const { env } = arrangement(BARS)

const level = env([0, 1], [16, 1], [24, 0.05], [32, 0.05], [36, 1.3], [40, 1])
const dark = env([0, 180], [16, 180], [24, 80], [32, 80], [36, 260], [40, 180])

export const sub = note('<c1 eb1 bb0 c1>')
  .slow(2)
  .sound('dsub')
  .voice(0.3)
  .lpf(dark)
  .attack(0.05)
  .release(0.4)
  .legato(1.05)
  .gain(0.22)
  .mul(gain(level))
  .pan(0.5)
  .orbit(2)

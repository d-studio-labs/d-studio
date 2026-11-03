// ── Lead: a dark, filtered stab sequence — hypnotic, not melodic ──
// C minor-ish motion (c, eb, bb) around the kick's root. Movement comes from
// a wider filter sweep and a 2-bar pattern (the 2nd bar is busier) — timbre
// and rhythm move, nothing pans (fast lateral motion is the one thing to
// never do here).
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

// every 16 bars, the filter opens up brighter for that one bar — a timbral
// lift, not a density change: same notes, same hits, no new transients to
// clash with everything else converging at bar 16
export const lead = note('<[c2 ~ eb2 ~ c2 ~ bb1 ~] [c2 ~ eb2 ~ bb1 ~ c2 eb2]>')
  .sound('juno')
  .lpf(drift(150, 900, 43))
  .gain(0.25)
  .every(16, (p) => p.lpf(drift(800, 1600, 43)))

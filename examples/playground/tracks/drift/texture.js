// ── Texture: tape hiss, no notes, just grain ──
// Set by ear well under where soloing it would suggest: a texture that
// sounds right alone sits ~10 dB too loud once the rest of the mix is there
import { sound } from '@strudel/core'
import { sweep } from '@d-studio-labs/core/mod'
import { evolvingFilter } from '@d-studio-labs/core/fx'

// the band drifts open and closed on its own (evolvingFilter, fx.js) instead
// of sitting still in one place, and the hiss wanders slowly left to right
export const hiss = evolvingFilter(
  sound('dhiss')
    .gain(0.025)
    .pan(sweep(0.4, 0.6, 41)),
).orbit(4)

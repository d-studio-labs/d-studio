// ── Noise: tape hiss, the first thing you hear: it fades in over the first sixteen bars ──
import { sound } from '@strudel/core'
import { fadeIn } from '@d-studio-labs/core/arrange'
import { HISS_FADE } from './song.js'

// dhiss (synths/d-studio.scd): a flat noise bed. legato 2.5, as in harbor and lantern-ambient
// (~/Work/music): three notes overlap at any time, so the crossfades between them are only a
// small part of the level and the bed is steady. At legato 1.25 only two overlap and every bar's
// crossfade dipped the hiss by 3 dB, a swell like small waves. That's twice the power of 1.25, so
// the gain is lower by √2 (0.025 → 0.018) to keep the same level. Its own orbit: the kick's
// delay, drive and ducking stay off it
export const hiss = sound('dhiss')
  .legato(2.5)
  .gain(0.018)
  .orbit(2)
  .apply(fadeIn(...HISS_FADE))

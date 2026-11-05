// ── Song: harmony, groove and form, shared by every part ──
import { arrangement } from '@d-studio-labs/core/arrange'

// 160 bars = 5:15 at 122 BPM, then it loops into its own intro
//   0 intro · 16 bass, clap · 32 groove · 64 break · 80 drop · 128 wind down · 144 outro
export const BARS = 160
export const { during, env } = arrangement(BARS)

// the swing: every second 16th lands 58% of the way through its 8th
// (swingBy delays it by x/16 of a cycle: 0.16 → 0.01)
export const groove = (p) => p.swingBy(0.16, 8)

// 8 bars, two per chord, rootless voicings that move by step:
// Dm9 · Gm9 · Bbmaj9 · A7b9
export const chords = `<
  [f3,a3,c4,e4]!2
  [f3,a3,bb3,d4]!2
  [f3,a3,c4,d4]!2
  [e3,g3,bb3,c#4]!2
>`
// the bass skips the kicks (steps 0 4 8 12) and walks into the next chord
export const bassline = `<
  [~ ~ d2 ~ ~ d2 ~ ~ ~ ~ d2 ~ ~ d3 ~ ~]
  [~ ~ d2 ~ ~ d2 ~ ~ ~ ~ d2 ~ f2 ~ e2 ~]
  [~ ~ g1 ~ ~ g1 ~ ~ ~ ~ g1 ~ ~ g2 ~ ~]
  [~ ~ g1 ~ ~ g1 ~ ~ ~ ~ g1 ~ bb1 ~ c2 ~]
  [~ ~ bb1 ~ ~ bb1 ~ ~ ~ ~ bb1 ~ ~ bb2 ~ ~]
  [~ ~ bb1 ~ ~ bb1 ~ ~ ~ ~ bb1 ~ a1 ~ bb1 ~]
  [~ ~ a1 ~ ~ a1 ~ ~ ~ ~ a1 ~ ~ a2 ~ ~]
  [~ ~ a1 ~ ~ a1 ~ ~ ~ ~ a1 ~ c#2 ~ e2 ~]
>`

// the hook, written per chord: A is in all four, the A7b9 bars lean on C# and Bb
export const hook = `<
  [a4 ~ ~ c5 ~ ~ d5 ~ ~ ~ e5 ~ d5 ~ ~ ~]
  [c5 ~ ~ a4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]
  [a4 ~ ~ bb4 ~ ~ d5 ~ ~ ~ f5 ~ d5 ~ ~ ~]
  [a4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]
  [a4 ~ ~ c5 ~ ~ d5 ~ ~ ~ f5 ~ e5 ~ ~ ~]
  [d5 ~ ~ c5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]
  [e5 ~ ~ c#5 ~ ~ bb4 ~ ~ ~ a4 ~ g4 ~ ~ ~]
  [e4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~]
>`

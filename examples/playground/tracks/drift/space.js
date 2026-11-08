// ── Space: a tour of placements for the pad ──
// Binaural (ATK) over headphones — @d-studio-labs/core/space registers .sphere
// .width .azim .spin .elev .roll. The chord's pitches never change, only the
// place it sounds from does. No place is ever reached by travelling sideways:
// left-to-right motion reads as sickness to some listeners, so each scene is a
// fixed placement and a change of scene is a crossfade, never a slide
import { stack } from '@strudel/core'
import { gate } from '@d-studio-labs/core/mod'
import '@d-studio-labs/core/space'
import { padSweep } from './pad.js'

// five scenes, 8 bars each (40 bars, ~86s at 112 BPM), then round again
const SCENES = [
  // bars 1–8: in front, narrow
  [8, (p) => p.width(0.08)],
  // 9–16: opened out round you, left and right at 90°
  [8, (p) => p.width(0.25)],
  // 17–24: swung round behind, narrow again
  [8, (p) => p.width(0.1).azim(0.5)],
  // 25–32: from behind, lifted overhead — a halo
  [8, (p) => p.width(0.2).azim(0.5).elev(0.15)],
  // 33–40: from overhead, rolling slowly forward to the front, where the tour
  // began — motion as its own scene, not just a placement
  [
    8,
    (p) =>
      p
        .width(0.1)
        .azim(0.5)
        .elev(0.15)
        .roll(1 / 8),
  ],
]
const TOUR = SCENES.reduce((bars, [n]) => bars + n, 0)

// every scene sets every control: an orbit keeps the last value it was sent,
// so a scene that left one out would inherit the one before's
const neutral = (p) => p.sphere(1).width(0.25).azim(0).spin(0).roll(0).elev(0)

const tour = (p) => {
  let from = 0
  return stack(
    ...SCENES.map(([bars, scene]) => {
      const start = from
      from += bars
      const inScene = (c) => {
        const bar = ((c % TOUR) + TOUR) % TOUR
        return bar >= start && bar < start + bars
      }
      return p.apply(neutral).apply(scene).apply(gate(inScene))
    }),
  )
}

export const padSweepTour = tour(padSweep)

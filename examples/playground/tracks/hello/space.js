// ── Space: three sounds to see (and hear) where things sit round the head ──
// Open the display's halo tab (key 2) while this plays. Use headphones: DIRT_SPACE=binaural.
//   tour   a ping on each beat at a point: front, left, behind, right, then the same
//          four ways at the height of bar 3 (above) and bar 4 (below)
//   sweep  plain .pan: a stereo image, never leaves the front (±45° in the halo)
//   circle a click train that goes all the way round: 360° (one turn every 2 bars, .spin)
//   swing  the same clicks swept 180° back and forth, hard left ↔ hard right across the front
//   roll   a held note rolled over the head, one turn every four bars: behind → overhead → front → under
//   echo   a ping whose echoes are thrown into the sphere (.space): they fly round the head
// Each is on its own orbit, so each has its own colour in the halo.
import { note, sine, sound } from '@strudel/core'
import '@d-studio-labs/core/space'
import { DOTTED_EIGHTH } from '@d-studio-labs/core/fx'
import { drift } from '@d-studio-labs/core/mod'

// .width(0.02): left and right laid almost on top of each other, so the ping is a point
export const tour = sound('dclick*4')
  .freq(1800)
  .gain(0.5)
  .legato(0.1)
  .sphere(1)
  .width(0.02)
  .azim('0 0.25 0.5 0.75')
  .elev('<0 0 0.2 -0.2>')
  .glide(0.02)
  .orbit(2)

export const sweep = sound('dclick*8').freq(3200).gain(0.25).legato(0.05).pan(sine.slow(2)).orbit(3)

export const roll = note('c5')
  .sound('dstudiopad')
  .clip(1)
  .gain(0.15)
  .sphere(1)
  .width(0.08)
  .roll(1 / 4)
  .orbit(4)

// 360°: .spin is turns per cycle, so 1/2 is one full turn every two bars
export const circle = sound('dclick*16')
  .freq(2400)
  .gain(0.3)
  .legato(0.1)
  .sphere(1)
  .width(0.02)
  .spin(1 / 2)
  .glide(0.02)
  .orbit(5)

// 180° back and forth: azim follows a sine, -0.25 (90° right) to 0.25 (90° left), one trip every 2 bars
export const swing = sound('dclick*16')
  .freq(1200)
  .gain(0.3)
  .legato(0.1)
  .sphere(1)
  .width(0.02)
  .azim(sine.slow(2).range(-0.25, 0.25))
  .glide(0.02)
  .orbit(6)

// .space(1): the echoes (not the ping) go into the sphere, and .spin carries them round: each repeat
// lands further round the head. delaytime is in cycles (.lock), 3/16 of a bar
export const echo = sound('dclick*2')
  .freq('<880 1320 1100 1650>')
  .gain(0.4)
  .legato(0.05)
  .delay(0.9)
  .delaytime(3 / 16)
  .delayfeedback(0.7)
  .lock(1)
  .space(1)
  .azim(0)
  .spin(1 / 3)
  .elev(0.08)
  .orbit(10)

// the dub chord: Fm7 and Dbmaj7 stabs, four bars each, low and dark, on dchord (the Basic Channel voice) that give the track its identity. The stab
// stays dry in front; its dotted-8th echoes (a band-pass in the loop, so each repeat is thinner than the
// last) are thrown into the sphere and spin the other way round the head, and bloom into the room
export const chord = note('<[f2,c3,eb3,ab3] [db2,ab2,c3,f3]>')
  .slow(4)
  .struct('~ x ~ ~ ~ x ~ ~')
  .sound('dchord')
  .legato(0.4)
  .lpf(drift(380, 900, 29))
  .lpq(6)
  .lpenv(2)
  .lpdecay(0.2)
  .voice(0.7)
  .hpf(90)
  .gain(0.4)
  .delay(0.8)
  .lock(1)
  .delaytime(DOTTED_EIGHTH)
  .delayfeedback(drift(0.55, 0.72, 53))
  .delayfreq(drift(450, 1000, 37))
  .delaywidth(2)
  .delaydiffuse(0.4)
  .delayroom(1)
  .space(1)
  .azim(0.25)
  .spin(-1 / 6)
  .room(0.6)
  .size(0.95)
  .orbit(11)

// ── Arturia MiniLab mkII, factory preset ──
// What each control sends. Touch one with `npm run play` running and it prints
// what arrived: a knob or pad that prints a bare cc(n) / note n isn't in this map
// yet, so put its number here. Another controller: copy this file, and point
// lib/midi.js at the copy.
export default {
  name: 'Arturia MiniLab mkII',
  // 16 endless encoders, by place: top row 1–8, bottom row 9–16 → CC numbers.
  // Endless, but in the factory preset each one still keeps a 0–127 value of its
  // own and sends that (absolute); relative mode (values around 64) won't work.
  // As this MiniLab sends them (checked by hand, 2026-10-22): knob 1 sends 112,
  // and every other knob was one place off against the list as first written
  // (74 is knob 2, not 1)
  knobs: [112, 74, 71, 76, 77, 93, 73, 75, 114, 18, 19, 16, 17, 91, 79, 72],
  // knobs 1 and 9 click: they're for navigation, not for a track's controls.js
  navigation: [1, 9],
  // pages: the MIDI channel each user memory (Shift + pad 1–8) sends its knobs on,
  // set in MIDI Control Center. Each memory keeps its own knob values, so going
  // back to a page carries on where it was (checked by hand, 2026-10-23)
  pages: [1, 2, 3, 4, 5, 6, 7, 8],
  // 8 performance pads, bank 1, left to right → notes on their own channel, so
  // they don't play the keys' instrument
  pads: { channel: 10, notes: [36, 37, 38, 39, 40, 41, 42, 43] },
}

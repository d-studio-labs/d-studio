// ── Space model: where every sounding thing sits around the listener ──
// A JS port of the placement in superdirt/space.scd (azim, spin, roll, elev, width,
// sphere, space, glide), driven by the score instead of the audio. Pure functions,
// no DOM: the Halo view (halo.js) feeds them the parts and the clock.
//
// Axes (as ATK's B-format): x front, y left, z up. Angles in radians.

const TAU = Math.PI * 2
const frac = (x) => x - Math.floor(x)

/** An orbit's settings keep their last value, like every SuperDirt orbit setting. */
export const DEFAULTS = { space: 0, sphere: 0, width: 0.25, azim: 0, spin: 0, roll: 0, elev: 0, glide: 0.3 }
/** the keys the sphere moves live (and glides to) */
export const GLIDED = ['space', 'sphere', 'width', 'azim', 'elev']
const ORBIT_KEYS = [...Object.keys(DEFAULTS), 'delaytime', 'delayfeedback', 'lock']

/** seconds an event keeps ringing after its note ends */
const RELEASE = 0.35
/** an echo under this level is gone */
const FLOOR = 0.03
const MAX_ECHOES = 8

/**
 * Every onset of every part in [from, to), sorted by time.
 *
 * @param {[string, import('@strudel/core').Pattern][]} lanes
 * @param {number} from cycles
 * @param {number} to cycles
 * @returns {{ begin: number, end: number, lane: number, value: Record<string, any> }[]}
 */
export function collect(lanes, from, to) {
  const out = []
  lanes.forEach(([, pat], lane) => {
    let haps = []
    try {
      haps = pat.queryArc(from, to)
    } catch {
      return
    }
    for (const h of haps) {
      if (!h.hasOnset() || h.value == null || typeof h.value !== 'object') continue
      out.push({ begin: Number(h.whole.begin), end: Number(h.whole.end), lane, value: h.value })
    }
  })
  return out.sort((a, b) => a.begin - b.begin)
}

/**
 * Each orbit's settings as the latest event sent them (an orbit keeps the last value of
 * every key an event carried).
 *
 * @param {ReturnType<typeof collect>} events sorted
 * @param {number} t cycles
 * @returns {Map<number, Record<string, number>>}
 */
export function orbitSettings(events, t) {
  const orbits = new Map()
  for (const e of events) {
    if (e.begin > t) break
    const id = e.value.orbit ?? 0
    let o = orbits.get(id)
    if (!o) orbits.set(id, (o = { ...DEFAULTS }))
    for (const k of ORBIT_KEYS) if (typeof e.value[k] === 'number') o[k] = e.value[k]
  }
  return orbits
}

/**
 * One frame of space.scd's `.lag(glide)`: the smoothed copy of an orbit's settings moves
 * toward the target so that it has covered 60 dB of the way in `glide` seconds.
 *
 * @param {Record<string, number> | undefined} live
 * @param {Record<string, number>} target
 * @param {number} dt seconds
 * @returns {Record<string, number>}
 */
export function glide(live, target, dt) {
  if (!live) return { ...target }
  const keep = Math.exp((Math.log(0.001) * dt) / Math.max(target.glide, 1e-3))
  const next = { ...target }
  for (const k of GLIDED) next[k] = target[k] + (live[k] - target[k]) * keep
  return next
}

/** @returns {[number, number, number]} unit vector for an angle round the head and one above it */
export const direction = (azim, elev) => [
  Math.cos(elev) * Math.cos(azim),
  Math.cos(elev) * Math.sin(azim),
  Math.sin(elev),
]

const rotateZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]
// ATK's tumble tips the front up for + angles
const tumble = ([x, y, z], a) => [x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)]

/** where a note sits in a stereo image: 0 left (90°), 0.5 front, 1 right (−90°) */
const panAzim = (pan) => (0.5 - pan) * 0.5 * TAU

const level = (age, hold) => (age < 0 ? 0 : age <= hold ? 1 : Math.exp(-(age - hold) / RELEASE))

/**
 * Everything audible at `t`: each event's dry sound and its echoes, placed where the
 * sphere stage and the delay would put them.
 *
 * @param {ReturnType<typeof collect>} events sorted
 * @param {Map<number, Record<string, number>>} raw orbitSettings (delay time, feedback, spin, roll)
 * @param {Map<number, Record<string, number>>} live the glided copies
 * @param {number} t cycles
 * @param {number} cps cycles per second
 * @returns {{ dir: [number, number, number], energy: number, orbit: number, lane: number, echo: number }[]}
 */
export function sources(events, raw, live, t, cps) {
  const out = []
  const push = (dir, energy, orbit, lane, echo) => energy > FLOOR && out.push({ dir, energy, orbit, lane, echo })

  for (const e of events) {
    if (e.begin > t) break
    const v = e.value
    const orbit = v.orbit ?? 0
    const o = raw.get(orbit)
    const l = live.get(orbit)
    if (!o || !l) continue
    const age = (t - e.begin) / cps
    const hold = Math.max(0.05, (e.end - e.begin) / cps)
    const gain = Math.min(1.5, typeof v.gain === 'number' ? v.gain : 1)
    const pan = Math.min(1, Math.max(0, typeof v.pan === 'number' ? v.pan : 0.5))

    // the orbit's turns follow the music: spin × cycle turns, whatever the start
    const turn = l.azim * TAU + frac(o.spin * t) * TAU
    const over = l.elev * TAU - frac(o.roll * t) * TAU
    const half = l.width * TAU

    // the dry sound: the stereo part where .pan puts it, the sphere part as the
    // orbit's left and right laid round the head
    const dry = gain * level(age, hold)
    if (dry > FLOOR) {
      push(direction(panAzim(pan), 0), dry * (1 - l.sphere), orbit, e.lane, 0)
      if (l.sphere > 0) {
        const left = tumble(rotateZ(direction(half, 0), turn), over)
        const right = tumble(rotateZ(direction(-half, 0), turn), over)
        push(left, dry * l.sphere * Math.sqrt(1 - pan), orbit, e.lane, 0)
        push(right, dry * l.sphere * Math.sqrt(pan), orbit, e.lane, 0)
      }
    }

    // the echoes: each repeat comes back later and softer
    const send = typeof v.delay === 'number' ? v.delay : 0
    const fb = Math.min(0.99, o.delayfeedback ?? 0)
    const time = (o.delaytime ?? 0) * (o.lock ? 1 / cps : 1)
    if (send > 0 && time > 0.01) {
      const echoAt = (t - e.begin) / cps
      for (let k = 1; k <= MAX_ECHOES; k++) {
        const amp = gain * Math.min(1, send) * fb ** (k - 1)
        if (amp < FLOOR) break
        const energy = amp * level(echoAt - k * time, Math.min(hold, 0.2))
        const pos = direction(turn, l.elev * TAU)
        push(pos, energy * l.space, orbit, e.lane, k)
        // the echoes left in the stereo delay: wide, one each side, alternating
        push(direction((k % 2 ? 1 : -1) * 0.25 * TAU, 0), energy * (1 - l.space), orbit, e.lane, k)
      }
    }
  }
  return out
}

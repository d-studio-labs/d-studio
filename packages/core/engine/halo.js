// ── Halo: the sound field round the listener, as a cloud of points ──
// Shells of dots around a head (front is away from you, left is on your left).
// Each sounding thing (a note, an echo) lights the dots in a first-order lobe
// round its direction, and pushes them outward. Where things sit comes from
// space-model.js, i.e. from the score, not the audio.
import { Renderer, Camera, Transform, Geometry, Program, Mesh, Orbit, Vec3 } from 'ogl'
import { collect, orbitSettings, glide, sources } from './space-model.js'

const POINTS = 90000
const MAX_SOURCES = 64
const MAX_ORBITS = 16 // an orbit's field is the ten products of W X Y Z (space.scd's \dstudio_field)
const RELEASE = 0.45 // seconds a hit stays lit after its sound is gone
const GREY = [0.5, 0.5, 0.5]
const WHITE = [1, 1, 1]
const BEHIND = 16 // cycles of history an orbit's last settings are looked up in

const cloudVertex = /* glsl */ `#version 300 es
  in vec4 seed;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uPx;
  uniform vec4 uSrc[${MAX_SOURCES}];
  uniform vec3 uCol[${MAX_SOURCES}];
  uniform int uCount;
  uniform float uLive;
  uniform int uOrbits;
  uniform float uField[${MAX_ORBITS * 10}];
  uniform vec3 uOrbCol[${MAX_ORBITS}];
  out vec3 vColor;
  out float vAlpha;

  const float TAU = 6.2831853;
  float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

  void main() {
    // a lattice of directions (x front, y left, z up), six shells deep
    float cz = (floor(seed.x * 28.0) + 0.5) / 28.0 * 2.0 - 1.0;
    float az = (floor(seed.y * 112.0) + 0.5) / 112.0 * TAU;
    float shell = floor(seed.z * 6.0);
    float s = sqrt(1.0 - cz * cz);
    vec3 d = vec3(s * cos(az), s * sin(az), cz);
    float r = 0.55 + 0.9 * shell / 5.0;

    float field = 0.0;
    float weight = 0.0;
    vec3 tint = vec3(0.0);
    if (uLive > 0.5) {
      // a first-order field per orbit: the energy a cardioid mic aimed along d would hear
      // from it, in the orbit's colour
      for (int o = 0; o < ${MAX_ORBITS}; o++) {
        if (o >= uOrbits) break;
        int k = o * 10;
        float e = 0.25 * (2.0 * uField[k] + 2.828427 * (uField[k + 1] * d.x + uField[k + 2] * d.y + uField[k + 3] * d.z)
          + uField[k + 4] * d.x * d.x + uField[k + 7] * d.y * d.y + uField[k + 9] * d.z * d.z
          + 2.0 * (uField[k + 5] * d.x * d.y + uField[k + 6] * d.x * d.z + uField[k + 8] * d.y * d.z));
        // quiet orbits keep a voice next to a kick
        e = pow(max(e, 0.0), 0.75);
        field += e;
        // the strongest orbit decides the colour, so parts stay told apart where they overlap
        tint += uOrbCol[o] * e * e;
        weight += e * e;
      }
    } else {
      for (int i = 0; i < ${MAX_SOURCES}; i++) {
        if (i >= uCount) break;
        float lobe = pow(0.5 + 0.5 * dot(d, uSrc[i].xyz), 14.0) * uSrc[i].w;
        field += lobe;
        tint += uCol[i] * lobe;
      }
    }
    float f = 1.0 - exp(-field * (uLive > 0.5 ? 0.5 : 0.9));

    // each dot jitters off its site a little, a lot where the sound is
    vec3 j = vec3(hash(seed.w), hash(seed.w + 1.7), hash(seed.w + 3.1)) * 2.0 - 1.0;
    float wob = 0.5 + 0.5 * sin(uTime * 2.0 + seed.w * 40.0);
    vec3 p = d * (r + 0.55 * f * (0.4 + shell / 5.0)) + j * (0.006 + 0.05 * f * wob);

    vColor = mix(vec3(0.42, 0.4, 0.33), tint / max(uLive > 0.5 ? weight : field, 1e-6), smoothstep(0.0, 0.2, field));
    // the horizon (ear level) is drawn a little brighter, to read the height of a sound by
    vAlpha = 0.3 + 0.7 * f + 0.25 * step(abs(cz), 0.036);
    gl_PointSize = (1.2 + 1.8 * f) * uPx;
    // model axes → scene: left is −x, up is +y, front is −z
    gl_Position = projectionMatrix * modelViewMatrix * vec4(-p.y, p.z, -p.x, 1.0);
  }
`

const cloudFragment = /* glsl */ `#version 300 es
  precision highp float;
  in vec3 vColor;
  in float vAlpha;
  out vec4 outColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    outColor = vec4(vColor, vAlpha * (1.0 - d * 2.0));
  }
`

const headVertex = /* glsl */ `#version 300 es
  in vec3 position;
  in float mark;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uPx;
  out float vMark;
  void main() {
    vMark = mark;
    gl_PointSize = (1.5 + mark * 2.0) * uPx;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const headFragment = /* glsl */ `#version 300 es
  precision highp float;
  in float vMark;
  uniform vec3 uAccent;
  out vec4 outColor;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    outColor = vec4(mix(vec3(0.6, 0.58, 0.5), uAccent, vMark), 0.9);
  }
`

const hex = (c) => {
  const n = parseInt(c.replace('#', '').slice(0, 6), 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/**
 * Draw the sound field round the listener on a WebGL canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {() => {
 *   lanes: [string, import('@strudel/core').Pattern][],
 *   now: number,
 *   cps: number,
 *   playing: boolean,
 *   field: number[] | null,
 * }} getState read once per frame; `field` is SuperCollider's measured sound field (ten products per orbit)
 * while it's sending, else null and Halo places things from the score
 * @returns {{ start: () => void, stop: () => void }} only a started Halo draws
 */
export function createHalo(canvas, getState) {
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    alpha: false,
    antialias: false,
  })
  const { gl } = renderer
  gl.clearColor(0.055, 0.055, 0.05, 1)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
  gl.disable(gl.DEPTH_TEST)

  const camera = new Camera(gl, { fov: 42, near: 0.1, far: 50 })
  // from above and behind: front is up the screen, behind is down it, so a sound at the
  // back doesn't sit on top of one at the front
  camera.position.set(0, 3.4, 2.6)
  const controls = new Orbit(camera, { element: canvas, target: new Vec3(0, 0, 0), minDistance: 1.5, maxDistance: 8 })
  const scene = new Transform()

  const seed = new Float32Array(POINTS * 4)
  for (let i = 0; i < seed.length; i++) seed[i] = Math.random()
  const uniforms = {
    uTime: { value: 0 },
    uPx: { value: renderer.dpr },
    // plain arrays: ogl reads a typed array's "[0]" as a sub-uniform and drops the uniform
    uSrc: { value: new Array(MAX_SOURCES * 4).fill(0) },
    uCol: { value: new Array(MAX_SOURCES * 3).fill(0) },
    uCount: { value: 0 },
    uLive: { value: 0 },
    uOrbits: { value: 0 },
    uField: { value: new Array(MAX_ORBITS * 10).fill(0) },
    uOrbCol: { value: new Array(MAX_ORBITS * 3).fill(0.5) },
  }
  const cloud = new Mesh(gl, {
    mode: gl.POINTS,
    geometry: new Geometry(gl, { seed: { size: 4, data: seed } }),
    program: new Program(gl, {
      vertex: cloudVertex,
      fragment: cloudFragment,
      uniforms,
      transparent: true,
      depthTest: false,
    }),
  })
  cloud.frustumCulled = false
  cloud.setParent(scene)

  // the listener: a small ball of dots with a nose pointing the way the sound's "front" is
  const head = []
  for (let i = 0; i < 260; i++) {
    const z = Math.random() * 2 - 1
    const a = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - z * z)
    head.push(0.09 * s * Math.cos(a), 0.09 * z, 0.09 * s * Math.sin(a), 0)
  }
  for (let i = 0; i < 14; i++) head.push(0, 0, -0.1 - i * 0.012, 1)
  // the ears: left is −x, right is +x. Front (the nose) and the ears tell you which way you face
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) head.push(side * (0.09 + i * 0.012), 0, 0, 0.5)
  const headPoints = new Mesh(gl, {
    mode: gl.POINTS,
    geometry: new Geometry(gl, {
      position: { size: 3, data: new Float32Array(head.filter((_, i) => i % 4 !== 3)) },
      mark: { size: 1, data: new Float32Array(head.filter((_, i) => i % 4 === 3)) },
    }),
    program: new Program(gl, {
      vertex: headVertex,
      fragment: headFragment,
      uniforms: { uPx: uniforms.uPx, uAccent: { value: hex('#f0a14a') } },
      transparent: true,
      depthTest: false,
    }),
  })
  headPoints.frustumCulled = false
  headPoints.setParent(scene)

  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height)
    // ogl pins the canvas to pixels; the grid sizes it
    canvas.style.width = canvas.style.height = '100%'
    camera.perspective({ aspect: width / height })
  }
  new ResizeObserver(resize).observe(canvas)

  // the score's placement (the fallback when SuperCollider isn't sending): per-orbit smoothed
  // settings (the sphere's .lag(glide)) and the last window of events
  let live = new Map()
  let events = []
  let key = null
  let last = 0
  let raf = 0
  let laneColors = []
  let peak = 1e-5
  let orbitLane = new Map()
  let orbitLaneAt = -Infinity
  let lanesRef = null
  // per orbit, from the measured field: its level with a release of its own (a kick
  // hits and dies away over a fraction of a second, a pad stays), the direction it
  // last had while it was loud, and the loudest it's been lately
  const env = new Float32Array(MAX_ORBITS)
  const shape = new Float32Array(MAX_ORBITS * 10)
  const loud = new Float32Array(MAX_ORBITS).fill(1e-6)
  const slow = new Float32Array(MAX_ORBITS) // its level a second or two ago
  const hit = new Float32Array(MAX_ORBITS) // 1 on a hit, fading over a third of a second
  const gainOf = new Float32Array(MAX_ORBITS).fill(0.4) // how bright it's drawn

  // ── The legend: every part in its colour, with a level and where it sits ──
  // Point at one to put it alone (the rest drop to ghosts); click to pin it
  const legend = document.createElement('div')
  legend.id = 'legend'
  legend.hidden = true
  document.body.append(legend)
  let hover = null
  let pinned = null
  let legendAt = 0
  let rowsKey = ''
  let rows = []
  legend.addEventListener('mouseleave', () => (hover = null))
  const toRgb = (c) => `rgb(${c.map((x) => Math.round(x * 255)).join(',')})`

  // 0° front, + to the left, 180° behind; "diffuse" when the sound points nowhere (a wide pad, noise)
  function where(o) {
    const at = o * 10
    const ww = shape[at]
    const mag = Math.hypot(shape[at + 1], shape[at + 2], shape[at + 3])
    if (env[o] < loud[o] * 0.03 || ww < 1e-9) return '–'
    if (mag / (Math.SQRT2 * ww) < 0.4) return 'diffuse'
    const az = (Math.atan2(shape[at + 2], shape[at + 1]) * 180) / Math.PI
    const el = (Math.asin(Math.min(1, shape[at + 3] / mag)) * 180) / Math.PI
    const side =
      Math.abs(az) < 8 ? 'front' : Math.abs(az) > 172 ? 'back' : `${Math.round(Math.abs(az))}° ${az > 0 ? 'L' : 'R'}`
    return Math.abs(el) >= 5 ? `${side} ${el > 0 ? '↑' : '↓'}${Math.round(Math.abs(el))}°` : side
  }

  function renderLegend(orbits, lanes) {
    const ids = []
    for (let o = 0; o < orbits; o++) if (orbitLane.has(o)) ids.push(o)
    const k = ids.map((o) => `${o}:${orbitLane.get(o)}:${lanes[orbitLane.get(o)]?.[0]}`).join()
    if (k !== rowsKey) {
      rowsKey = k
      rows = ids.map((o) => {
        const row = document.createElement('div')
        row.className = 'row'
        const sw = document.createElement('span')
        sw.className = 'sw'
        sw.style.background = toRgb(laneColors[orbitLane.get(o) % laneColors.length])
        const name = document.createElement('span')
        name.textContent = lanes[orbitLane.get(o)]?.[0] ?? `orbit ${o}`
        const bar = document.createElement('span')
        bar.className = 'bar'
        bar.append(document.createElement('i'))
        const at = document.createElement('span')
        at.className = 'at'
        row.append(sw, name, bar, at)
        row.addEventListener('mouseenter', () => (hover = o))
        row.addEventListener('click', () => (pinned = pinned === o ? null : o))
        return { o, row, bar: bar.firstChild, at }
      })
      legend.replaceChildren(...rows.map((r) => r.row))
    }
    for (const r of rows) {
      r.bar.style.transform = `scaleX(${Math.min(1, Math.sqrt(env[r.o] / loud[r.o])).toFixed(2)})`
      const text = where(r.o)
      if (r.at.textContent !== text) r.at.textContent = text
      r.row.classList.toggle('on', hit[r.o] > 0.35)
      r.row.classList.toggle('pin', pinned === r.o)
    }
  }

  function frame(ms) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.1, (ms - last) / 1000)
    last = ms
    const { lanes, now, cps, playing, field } = getState()
    const cycle = Math.floor(now)

    if (lanes !== lanesRef) {
      lanesRef = lanes
      laneColors = css('--lanes')
        .split(',')
        .map((c) => hex(c.trim()))
      key = null
      orbitLane = new Map()
      orbitLaneAt = -Infinity
    }

    uniforms.uLive.value = field ? 1 : 0
    if (field) {
      // which part plays on which orbit, for the colours: two cycles, now and then
      if (cycle < orbitLaneAt || cycle - orbitLaneAt >= 8) {
        orbitLaneAt = cycle
        for (const e of collect(lanes, cycle, cycle + 2)) orbitLane.set(e.value.orbit ?? 0, e.lane)
      }

      const f = uniforms.uField.value
      const orbits = Math.min(MAX_ORBITS, Math.floor(field.length / 10))
      const release = Math.exp(-dt / RELEASE)
      const forget = Math.exp(-dt / 10)
      const decay = new Array(orbits)
      let total = 0
      for (let o = 0; o < orbits; o++) {
        const at = o * 10
        // W, X, Y, Z powers: indices 0, 4, 7, 9 of an orbit's ten products
        const power = field[at] + field[at + 4] + field[at + 7] + field[at + 9]
        env[o] = Math.max(power, env[o] * release)
        // while it's sounding the shape follows it; as it dies away the shape stays
        if (power > env[o] * 0.5 && power > 1e-12) for (let i = 0; i < 10; i++) shape[at + i] = field[at + i] / power
        loud[o] = Math.max(loud[o] * forget, env[o], 1e-6)
        // a hit is a jump above where the part has been lately; a steady sound never is one
        hit[o] = Math.max(hit[o] * Math.exp(-dt / 0.35), Math.min(1, ((power - slow[o]) / loud[o]) * 3))
        slow[o] += (power - slow[o]) * (1 - Math.exp(-dt / 1.5))
        decay[o] = env[o]
        total += env[o]
      }
      peak = Math.max(peak * forget, total, 1e-5)
      const oc = uniforms.uOrbCol.value
      const pick = pinned ?? hover
      const toward = 1 - Math.exp(-dt / 0.12)
      for (let o = 0; o < orbits; o++) {
        // an orbit counts against its own best as much as against the loudest: a clap
        // shows next to a kick, a kick still looks bigger
        let scale = (1.5 * decay[o]) / Math.sqrt(loud[o] * peak)
        // what's active now is bright: a hit lights its part up and it settles to a dim bed, so
        // a steady pad stays behind the kick. Pointing at a part in the legend puts it alone
        const want = pick === null ? 0.4 + 0.6 * hit[o] : o === pick ? 1.3 : 0.04
        gainOf[o] = want > gainOf[o] ? want : gainOf[o] + (want - gainOf[o]) * toward
        scale *= gainOf[o]
        for (let i = 0; i < 10; i++) f[o * 10 + i] = shape[o * 10 + i] * scale
        const lane = orbitLane.get(o)
        const c = lane === undefined ? GREY : laneColors[lane % laneColors.length]
        oc[o * 3] = c[0]
        oc[o * 3 + 1] = c[1]
        oc[o * 3 + 2] = c[2]
      }
      uniforms.uOrbits.value = orbits
      legend.hidden = false
      if (ms - legendAt > 66) {
        legendAt = ms
        renderLegend(orbits, lanes)
      }
    } else {
      legend.hidden = true
      if (String(cycle) !== key) {
        key = String(cycle)
        events = collect(lanes, cycle - BEHIND, cycle + 2)
        orbitLane = new Map(events.map((e) => [e.value.orbit ?? 0, e.lane]))
      }
      let list = []
      if (playing && cps) {
        const raw = orbitSettings(events, now)
        for (const [orbit, target] of raw) live.set(orbit, glide(live.get(orbit), target, dt))
        list = sources(events, raw, live, now, cps)
          .sort((a, b) => b.energy - a.energy)
          .slice(0, MAX_SOURCES)
      } else {
        live = new Map()
      }
      const src = uniforms.uSrc.value
      const col = uniforms.uCol.value
      list.forEach((s, i) => {
        const c = laneColors[s.lane % laneColors.length] ?? WHITE
        src[i * 4] = s.dir[0]
        src[i * 4 + 1] = s.dir[1]
        src[i * 4 + 2] = s.dir[2]
        src[i * 4 + 3] = s.energy
        col[i * 3] = c[0]
        col[i * 3 + 1] = c[1]
        col[i * 3 + 2] = c[2]
      })
      uniforms.uCount.value = list.length
    }
    uniforms.uTime.value = ms / 1000

    controls.update()
    renderer.render({ scene, camera })
  }

  return {
    start() {
      if (raf) return
      resize()
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      legend.hidden = true
    },
  }
}

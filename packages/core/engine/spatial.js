// ── Spatial: the sound field round the listener, as a cloud of points ──
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
    // behind the listener: dimmer and cooler, so front and back read without a label
    float rear = 1.0 - smoothstep(-0.3, 0.3, d.x);
    vColor *= mix(vec3(1.0), vec3(0.78, 0.92, 1.12), rear);
    // the horizon (ear level) is drawn a little brighter, to read the height of a sound by
    vAlpha = (0.3 + 0.7 * f + 0.25 * step(abs(cz), 0.036)) * (1.0 - 0.45 * rear);
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

// ── Overlays: reference lines, per-part markers, drop-lines, the balance needle, hit rings ──
const lineVertex = /* glsl */ `#version 300 es
  in vec3 position;
  in vec4 color;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  out vec4 vC;
  void main() {
    vC = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const lineFragment = /* glsl */ `#version 300 es
  precision highp float;
  in vec4 vC;
  out vec4 outColor;
  void main() { outColor = vC; }
`
const dotVertex = /* glsl */ `#version 300 es
  in vec3 position;
  in vec4 color;
  in float size;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uPx;
  out vec4 vC;
  void main() {
    vC = color;
    gl_PointSize = size * uPx;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const dotFragment = /* glsl */ `#version 300 es
  precision highp float;
  in vec4 vC;
  out vec4 outColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    outColor = vec4(vC.rgb, vC.a * (1.0 - d * d * 3.0));
  }
`

const RING_R = 1 // radius the markers and rings sit on
const RINGS = 24 // hit rings alive at once
const RING_SEG = 40
const RING_LIFE = 0.7 // seconds, it grows from the part's direction to RING_SPAN radians
const RING_SPAN = 1.0
const DOWN = (Math.PI / 180) * 3 // under this much elevation a part has no drop-line
const MASK_ARCS = 10 // crowding arcs shown at once
const ARC_SEG = 16

// model axes (x front, y left, z up) → scene (left is −x, up is +y, front is −z)
const scene3 = (x, y, z) => [-y, z, -x]
const polar = (az, el, r = 1) => [r * Math.cos(el) * Math.cos(az), r * Math.cos(el) * Math.sin(az), r * Math.sin(el)]
// a part behind the listener is dimmer and cooler, as the cloud is
const cool = (c, x) => (x < 0 ? [c[0] * 0.78, c[1] * 0.92, c[2] * 1.12] : c)

/** The listener's frame: horizon, sagittal and coronal rings, a ring overhead, the cardinals, a ±30° forward wedge. */
function stage() {
  const v = []
  const seg = (a, b, c) => v.push(...scene3(...a), ...c, ...scene3(...b), ...c)
  const ring = (at, c, n = 96) => {
    for (let i = 0; i < n; i++) seg(at((i / n) * Math.PI * 2), at(((i + 1) / n) * Math.PI * 2), c)
  }
  const ink = [0.62, 0.6, 0.52]
  ring((t) => polar(t, 0, RING_R), [...ink, 0.34]) // horizon
  ring((t) => [Math.cos(t) * RING_R, 0, Math.sin(t) * RING_R], [...ink, 0.13]) // sagittal: front, up, back, down
  ring((t) => [0, Math.cos(t) * RING_R, Math.sin(t) * RING_R], [...ink, 0.13]) // coronal: left, up, right, down
  ring((t) => polar(t, Math.PI / 3, RING_R), [...ink, 0.1]) // the dome overhead
  // front, left, back, right
  for (const az of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    seg(polar(az, 0, RING_R - 0.07), polar(az, 0, RING_R + 0.1), az === 0 ? [0.94, 0.63, 0.29, 0.8] : [...ink, 0.6])
  }
  // the sweet spot ahead
  const wedge = [0.94, 0.63, 0.29, 0.22]
  const edge = (30 * Math.PI) / 180
  seg(polar(edge, 0, 0.14), polar(edge, 0, 1.45), wedge)
  seg(polar(-edge, 0, 0.14), polar(-edge, 0, 1.45), wedge)
  for (let i = 0; i < 24; i++)
    seg(polar(-edge + (i / 24) * 2 * edge, 0, 1.45), polar(-edge + ((i + 1) / 24) * 2 * edge, 0, 1.45), wedge)
  const position = []
  const color = []
  for (let i = 0; i < v.length; i += 7) {
    position.push(v[i], v[i + 1], v[i + 2])
    color.push(v[i + 3], v[i + 4], v[i + 5], v[i + 6])
  }
  return { position: new Float32Array(position), color: new Float32Array(color) }
}

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
 * }} getState read once per frame; `field` is SuperCollider's measured sound field (ten products per orbit, then three band powers per orbit)
 * while it's sending, else null and the spatial view places things from the score
 * @returns {{ start: () => void, stop: () => void }} only a started spatial view draws
 */
export function createSpatial(canvas, getState) {
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

  // the frame of reference, then what's drawn per part from the measured field: a marker
  // where it sits, a drop-line to the horizon plane, hit rings; and the balance needle
  const lines = (cap, data) =>
    new Mesh(gl, {
      mode: gl.LINES,
      geometry: new Geometry(gl, {
        position: {
          size: 3,
          data: data?.position ?? new Float32Array(cap * 3),
          usage: data ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW,
        },
        color: {
          size: 4,
          data: data?.color ?? new Float32Array(cap * 4),
          usage: data ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW,
        },
      }),
      program: new Program(gl, { vertex: lineVertex, fragment: lineFragment, transparent: true, depthTest: false }),
    })
  const stageLines = lines(0, stage())
  stageLines.frustumCulled = false
  stageLines.setParent(scene)

  const LINE_CAP = (MAX_ORBITS + 1 + RINGS * RING_SEG + MASK_ARCS * ARC_SEG) * 2
  const overlayLines = lines(LINE_CAP)
  overlayLines.frustumCulled = false
  overlayLines.visible = false
  overlayLines.setParent(scene)
  const linePos = overlayLines.geometry.attributes.position.data
  const lineCol = overlayLines.geometry.attributes.color.data

  const DOT_CAP = MAX_ORBITS + 1 + MASK_ARCS * 3
  const dotGeometry = new Geometry(gl, {
    position: { size: 3, data: new Float32Array(DOT_CAP * 3), usage: gl.DYNAMIC_DRAW },
    color: { size: 4, data: new Float32Array(DOT_CAP * 4), usage: gl.DYNAMIC_DRAW },
    size: { size: 1, data: new Float32Array(DOT_CAP), usage: gl.DYNAMIC_DRAW },
  })
  const dots = new Mesh(gl, {
    mode: gl.POINTS,
    geometry: dotGeometry,
    program: new Program(gl, {
      vertex: dotVertex,
      fragment: dotFragment,
      uniforms: { uPx: uniforms.uPx },
      transparent: true,
      depthTest: false,
    }),
  })
  dots.frustumCulled = false
  dots.visible = false
  dots.setParent(scene)
  const dotPos = dotGeometry.attributes.position.data
  const dotCol = dotGeometry.attributes.color.data
  const dotSize = dotGeometry.attributes.size.data

  // ── Camera: orbit presets, and cinematic shots that fly the camera itself ──
  const presets = {
    p: ['3/4', [0, 3.4, 2.6]], // from above and behind
    t: ['top', [0, 5.2, 0.35]], // straight down: left/right symmetry and spread, front up the screen
    s: ['side', [4.6, 0.5, 0]], // from the right: height, and front (right) against back (left)
    l: ['low', [-3.4, 0.4, 3.4]], // from behind on the left, near ear level
    f: ['front', [0, 0.8, -4.6]], // from ahead, looking back at the listener: the front parts come toward you
  }
  // cinematic: v inside the head, looking where the action is · z pushes in · b pulls back ·
  // c cranes up and round · o over the shoulder, behind the head, looking at the loudest part
  const cines = { v: 'pov', z: 'push', b: 'pull', c: 'crane', o: 'follow' }
  const FOV = 42
  let flyTo = null
  const views = document.createElement('div')
  views.id = 'views'
  views.hidden = true
  const viewButtons = Object.entries(presets).map(([k, [label, at]]) => {
    const b = document.createElement('button')
    b.textContent = `${label} · ${k}`
    b.addEventListener('click', () => look(k))
    views.append(b)
    return [k, b, at]
  })
  for (const [hot, key] of Object.entries(cines)) {
    const b = document.createElement('button')
    b.textContent = `${key} · ${hot}`
    b.addEventListener('click', () => cinema(key))
    views.append(b)
    viewButtons.push([key, b])
  }
  // masking arcs: on or off
  const maskButton = document.createElement('button')
  maskButton.textContent = 'mask · m'
  maskButton.classList.add('on')
  maskButton.addEventListener('click', () => toggleMask())
  views.append(maskButton)
  let maskOn = true
  const toggleMask = () => {
    maskOn = !maskOn
    maskButton.classList.toggle('on', maskOn)
  }
  document.body.append(views)
  const lit = (k) => {
    for (const [key, b] of viewButtons) b.classList.toggle('on', key === k)
  }
  function look(k) {
    manual = null
    flyTo = new Vec3(...presets[k][1])
    flyTau = 0.15
    if (autoOn) autoHold = performance.now() + AUTO_HOLD
    lit(k)
  }
  // a cinematic shot you chose: it repeats over eight bars, going in and coming back out
  function cinema(key) {
    manual = { key, start: lastNow, i: manualCount++ }
    flyTo = null
    if (autoOn) autoHold = performance.now() + AUTO_HOLD
    lit(key)
  }

  // ── Auto: the camera cuts on bar lines, at different lengths, and sways in between ──
  // The shots are a function of the bar, not of when you turned it on: the same bar always gets
  // the same shot (a loop repeats; a scrub lands in the right place). Each shot lasts 4, 8, 12 or
  // 16 bars, and a cut flies there in about half a second, rather than jumping
  const AUTO_HOLD = 8000 // ms it keeps off after you drag, wheel or choose a view
  const SHOTS = ['p', 'push', 's', 'pov', 't', 'crane', 'l', 'follow', 'f', 'pull']
  const LENGTHS = [4, 4, 8, 8, 12, 16]
  const hash = (i) => {
    let x = Math.imul(i + 0x9e3779b9, 0x85ebca6b)
    x ^= x >>> 13
    x = Math.imul(x, 0xc2b2ae35)
    return (x ^ (x >>> 16)) >>> 0
  }
  const shotAt = (bar) => {
    let i = 0
    let start = 0
    let len = 0
    for (; ; i++) {
      len = LENGTHS[hash(i) % LENGTHS.length]
      if (bar < start + len) break
      start += len
    }
    // no two shots in a row look the same
    let k = hash(i * 7 + 3) % SHOTS.length
    if (i > 0 && k === hash((i - 1) * 7 + 3) % SHOTS.length) k = (k + 1) % SHOTS.length
    return { key: SHOTS[k], start, len, i }
  }
  let autoOn = false
  let autoHold = 0
  let flyTau = 0.15
  let shotKey = null
  let manual = null
  let manualCount = 0
  let lastNow = 0
  const autoTarget = new Vec3()
  const autoButton = document.createElement('button')
  autoButton.textContent = 'auto · a'
  autoButton.addEventListener('click', () => toggleAuto())
  views.append(autoButton)
  const toggleAuto = () => {
    autoOn = !autoOn
    shotKey = null
    autoButton.classList.toggle('on', autoOn)
    if (!autoOn) flyTo = null
  }
  // an orbit shot: the preset's position, swaying slowly round the sphere (±29°, 32 bars a swing)
  function steer(key, now) {
    const [x, y, z] = presets[key][1]
    const a = 0.5 * Math.sin((2 * Math.PI * now) / 32)
    if (key === 't') autoTarget.set(x, y * (1 + 0.08 * Math.sin((2 * Math.PI * now) / 16)), z)
    else autoTarget.set(x * Math.cos(a) + z * Math.sin(a), y, z * Math.cos(a) - x * Math.sin(a))
    flyTo = autoTarget
    flyTau = 0.2
  }

  // the cinematic shots: where the camera is, what it looks at and its lens, at progress k (0 to 1)
  // through the shot; i varies the direction a push or pull comes from
  const ease = (k) => k * k * (3 - 2 * k)
  const mix = (a, b, k) => a + (b - a) * k
  const PUSH_FROM = [
    [-0.45, 0.4, -0.8],
    [0.7, 0.3, 0.65],
    [0.0, 0.85, 0.55],
    [-0.8, 0.25, 0.5],
  ]
  const pos = new Vec3()
  const aim = new Vec3()
  let fovNow = FOV
  let fovWant = FOV
  function pose(shot) {
    const k = Math.min(1, Math.max(0, shot.k))
    const e = ease(k)
    const [fx, fy, fz] = scene3(...focusU)
    fovWant = FOV
    aim.set(0, 0, 0)
    if (shot.key === 'pov') {
      // inside the head, turning to the part that's loudest or just hit, a wide lens
      pos.set(0, 0.03, 0)
      aim.set(fx * 3, fy * 3, fz * 3)
      fovWant = 78
    } else if (shot.key === 'follow') {
      // over the shoulder: behind the head on the far side from the sound, looking past it at it
      pos.set(-fx * 1.5, -fy * 1.5 + 0.45, -fz * 1.5)
      aim.set(fx, fy, fz)
      fovWant = 58
    } else if (shot.key === 'push' || shot.key === 'pull') {
      // a dolly with the lens closing as it goes in, opening as it comes out
      const [dx, dy, dz] = PUSH_FROM[(shot.i + (shot.key === 'pull' ? 1 : 0)) % PUSH_FROM.length]
      const n = Math.hypot(dx, dy, dz)
      const r = shot.key === 'push' ? mix(6.4, 2.1, e) : mix(1.9, 6.4, e)
      pos.set((dx / n) * r, (dy / n) * r, (dz / n) * r)
      fovWant = shot.key === 'push' ? mix(44, 32, e) : mix(32, 46, e)
    } else {
      // crane: up and round, the radius closing a little
      const th = (hash(shot.i) % 628) / 100 + 2.2 * k
      const r = 4.6 - 1.2 * k
      pos.set(r * Math.sin(th), 0.3 + 4.2 * e, r * Math.cos(th))
    }
  }

  const drop = () => {
    if (autoOn) autoHold = performance.now() + AUTO_HOLD
    flyTo = null
    manual = null
    for (const [, b] of viewButtons) b.classList.remove('on')
  }
  canvas.addEventListener('pointerdown', drop)
  canvas.addEventListener('wheel', drop, { passive: true })
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k in presets) look(k)
    if (k in cines) cinema(cines[k])
    if (k === 'm') toggleMask()
    if (k === 'a') toggleAuto()
  }

  const rings = []
  const wasHit = new Float32Array(MAX_ORBITS)
  const needle = [0, 0, 0]
  // where the cinematic shots look: the loudest or latest-hit directed part, the view turning to it
  // over about 0.7 s; it stays on a part until another clearly outdoes it
  const focusU = [1, 0, 0]
  let focusO = -1
  let inCine = false
  const camAim = new Vec3()
  function overlay(orbits, dt, pick, ms) {
    const items = []
    let nl = 0
    let nd = 0
    const put = (a, b, c) => {
      linePos.set(scene3(...a), nl * 3)
      lineCol.set(c, nl * 4)
      nl++
      linePos.set(scene3(...b), nl * 3)
      lineCol.set(c, nl * 4)
      nl++
    }
    const dot = (p, c, size) => {
      dotPos.set(scene3(...p), nd * 3)
      dotCol.set(c, nd * 4)
      dotSize[nd++] = size
    }
    let sx = 0
    let sy = 0
    let sz = 0
    let sw = 0
    for (let o = 0; o < orbits; o++) {
      const at = o * 10
      const ww = shape[at]
      const mag = Math.hypot(shape[at + 1], shape[at + 2], shape[at + 3])
      const was = wasHit[o]
      wasHit[o] = hit[o]
      if (ww < 1e-9 || env[o] < loud[o] * 0.03) continue
      // 1 for a point source, towards 0 for a wide or enveloping sound
      const directed = Math.min(1, mag / (Math.SQRT2 * ww))
      const amp = Math.sqrt(env[o])
      sx += (amp * shape[at + 1]) / (Math.SQRT2 * ww)
      sy += (amp * shape[at + 2]) / (Math.SQRT2 * ww)
      sz += (amp * shape[at + 3]) / (Math.SQRT2 * ww)
      sw += amp
      if (directed < 0.25) continue
      const u = [shape[at + 1] / mag, shape[at + 2] / mag, shape[at + 3] / mag]
      const lane = orbitLane.get(o)
      const base = lane === undefined ? GREY : laneColors[lane % laneColors.length]
      const level = Math.sqrt(Math.min(1, env[o] / loud[o]))
      const iso = pick === null || pick === o ? 1 : 0.15
      const a = (0.3 + 0.7 * level) * Math.min(1, directed * 1.5) * iso * (0.6 + 0.4 * hit[o])
      const c = cool(base, u[0])
      const p = [u[0] * RING_R, u[1] * RING_R, u[2] * RING_R]
      items.push({ o, u, directed, level })
      dot(p, [...c, a], (4 + 6 * level) * (0.8 + 0.5 * hit[o]))
      if (Math.abs(Math.asin(u[2])) > DOWN) put(p, [p[0], p[1], 0], [...c, a * 0.45])
      if (hit[o] >= 0.5 && was < 0.5) {
        rings.push({ o, u, base, age: 0, power: Math.min(1, hit[o]) })
        if (rings.length > RINGS) rings.shift()
      }
    }
    const score = (it) => hit[it.o] + 0.4 * it.level
    let best = null
    for (const it of items) if (!best || score(it) > score(best)) best = it
    const held = items.find((it) => it.o === focusO)
    if (best && (!held || score(best) > score(held) * 1.3 + 0.05)) focusO = best.o
    const f = items.find((it) => it.o === focusO)
    if (f) {
      const k = 1 - Math.exp(-dt / 0.7)
      for (let j = 0; j < 3; j++) focusU[j] += (f.u[j] - focusU[j]) * k
      const n = Math.hypot(...focusU) || 1
      for (let j = 0; j < 3; j++) focusU[j] /= n
    }
    // masking: two parts that sit in nearly the same place and share a register crowd each other.
    // Wider (less directed) sounds count as nearer
    const crowd = []
    if (maskOn) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const A = items[i]
          const B = items[j]
          const sigma = Math.acos(Math.max(-1, Math.min(1, A.u[0] * B.u[0] + A.u[1] * B.u[1] + A.u[2] * B.u[2])))
          const reach = (0.9 + (1 - A.directed) + (1 - B.directed)) / 2
          if (sigma >= reach) continue
          let overlap = 0
          let shared = 0
          for (let b = 0; b < 3; b++) {
            const m = Math.min(register[A.o * 3 + b], register[B.o * 3 + b])
            overlap += m
            if (m > Math.min(register[A.o * 3 + shared], register[B.o * 3 + shared])) shared = b
          }
          if (overlap <= 0.5) continue
          crowd.push({
            A,
            B,
            sigma,
            band: ['low', 'mid', 'high'][shared],
            strength: (1 - sigma / reach) * (overlap - 0.5) * 2 * Math.sqrt(A.level * B.level),
          })
        }
      }
      crowd.sort((a, b) => b.strength - a.strength)
    }
    const pulse = 0.65 + 0.35 * Math.sin((ms / 1000) * 8)
    const shown = crowd.slice(0, MASK_ARCS)
    const nameOf = (o) => lanesRef?.[orbitLane.get(o)]?.[0] ?? `orbit ${o}`
    crowdText = shown
      .slice(0, 3)
      .map((x) => `${nameOf(x.A.o)} ⟷ ${nameOf(x.B.o)} · ${x.band}`)
      .join('\n')
    for (const { A, B, sigma, strength } of shown) {
      const iso = pick === null || pick === A.o || pick === B.o ? 1 : 0.15
      const c = [0.94 - 0.04 * strength, 0.63 - 0.43 * strength, 0.29 - 0.04 * strength] // amber → crimson
      const a = (0.5 + 0.5 * Math.min(1, strength * 2)) * pulse * iso
      const s = Math.max(sigma, 1e-3)
      // however close the two are, the arc stands clear of the dots: at least 0.2 high
      const lift = 0.2 + 0.2 * Math.min(1, strength * 2)
      const at = (t) => {
        const k0 = Math.sin((1 - t) * s) / Math.sin(s)
        const k1 = Math.sin(t * s) / Math.sin(s)
        const r = RING_R + lift * Math.sin(Math.PI * t)
        return [0, 1, 2].map((j) => (k0 * A.u[j] + k1 * B.u[j]) * r)
      }
      let from = at(0)
      for (let n = 1; n <= ARC_SEG; n++) {
        const to = at(n / ARC_SEG)
        put(from, to, [...c, a])
        from = to
      }
      // a bright dot on the crowded pair, and one at the top of the arc
      dot(at(0), [...c, a], 9)
      dot(at(1), [...c, a], 9)
      dot(at(0.5), [...c, a], 6)
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]
      r.age += dt
      if (r.age >= RING_LIFE) {
        rings.splice(i, 1)
        continue
      }
      const k = r.age / RING_LIFE
      const ang = RING_SPAN * (1 - (1 - k) * (1 - k))
      const [ux, uy, uz] = r.u
      // two axes across the circle: u × a helper that isn't along u
      const h = Math.abs(uz) < 0.9 ? [0, 0, 1] : [1, 0, 0]
      let e1 = [uy * h[2] - uz * h[1], uz * h[0] - ux * h[2], ux * h[1] - uy * h[0]]
      const n = Math.hypot(...e1)
      e1 = e1.map((x) => x / n)
      const e2 = [uy * e1[2] - uz * e1[1], uz * e1[0] - ux * e1[2], ux * e1[1] - uy * e1[0]]
      const iso = pick === null || pick === r.o ? 1 : 0.15
      const a = r.power * Math.pow(1 - k, 1.5) * 0.9 * iso
      const ca = Math.cos(ang)
      const sa = Math.sin(ang)
      const at = (t) => {
        const ct = Math.cos(t) * sa
        const st = Math.sin(t) * sa
        return [0, 1, 2].map((j) => (ca * r.u[j] + ct * e1[j] + st * e2[j]) * RING_R)
      }
      let from = at(0)
      for (let s = 1; s <= RING_SEG; s++) {
        const to = at((s / RING_SEG) * Math.PI * 2)
        put(from, to, [...cool(r.base, to[0]), a])
        from = to
      }
    }
    // the balance needle: where the amplitude-weighted sum of every part's direction leans
    const toward = 1 - Math.exp(-dt / 0.4)
    needle[0] += ((sw ? sx / sw : 0) - needle[0]) * toward
    needle[1] += ((sw ? sy / sw : 0) - needle[1]) * toward
    needle[2] += ((sw ? sz / sw : 0) - needle[2]) * toward
    if (Math.hypot(...needle) > 0.03) {
      const tip = needle.map((x) => x * 1.25)
      put(
        needle.map((x) => x * 0.1),
        tip,
        [1, 1, 1, 0.55],
      )
      dot(tip, [1, 1, 1, 0.8], 5)
    }
    overlayLines.geometry.attributes.position.needsUpdate = true
    overlayLines.geometry.attributes.color.needsUpdate = true
    overlayLines.geometry.setDrawRange(0, nl)
    overlayLines.visible = nl > 0
    dotGeometry.attributes.position.needsUpdate = true
    dotGeometry.attributes.color.needsUpdate = true
    dotGeometry.attributes.size.needsUpdate = true
    dotGeometry.setDrawRange(0, nd)
    dots.visible = nd > 0
  }

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
  const register = new Float32Array(MAX_ORBITS * 3).fill(1 / 3) // its share of power in the low, mid, high bands
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
  let crowdText = ''
  const crowdEl = document.createElement('div')
  crowdEl.className = 'crowd'
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
      legend.replaceChildren(...rows.map((r) => r.row), crowdEl)
    }
    for (const r of rows) {
      r.bar.style.transform = `scaleX(${Math.min(1, Math.sqrt(env[r.o] / loud[r.o])).toFixed(2)})`
      const text = where(r.o)
      if (r.at.textContent !== text) r.at.textContent = text
      r.row.classList.toggle('on', hit[r.o] > 0.35)
      r.row.classList.toggle('pin', pinned === r.o)
    }
    if (crowdEl.textContent !== crowdText) crowdEl.textContent = crowdText
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
      // per orbit ten field products, then (after all orbits) three band powers: low, mid, high
      const total13 = Math.floor(field.length / 13)
      const orbits = Math.min(MAX_ORBITS, total13)
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
        // its register: the share of its power below 200 Hz, 200–2000 and above, kept like the shape
        if (power > env[o] * 0.5) {
          const bands = total13 * 10 + o * 3
          const sum = field[bands] + field[bands + 1] + field[bands + 2]
          if (sum > 1e-12) for (let b = 0; b < 3; b++) register[o * 3 + b] = field[bands + b] / sum
        }
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
      overlay(orbits, dt, pick, ms)
    } else {
      legend.hidden = true
      overlayLines.visible = dots.visible = false
      rings.length = 0
      // no field: the cinematic shots just look slowly across the front
      const yaw = 0.7 * Math.sin((2 * Math.PI * now) / 24)
      focusU[0] = Math.cos(yaw)
      focusU[1] = Math.sin(yaw)
      focusU[2] = 0.1
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

    lastNow = now
    // which shot is on: a cinematic one (it flies the camera itself) or an orbit view
    let shot = null
    if (autoOn && playing && ms > autoHold) {
      const s = shotAt(Math.floor(now))
      if (s.key !== shotKey) {
        shotKey = s.key
        lit(s.key)
      }
      if (s.key in presets) steer(s.key, now)
      else shot = { key: s.key, k: (now - s.start) / s.len, i: s.i }
    } else if (manual) {
      const f = ((((now - manual.start) / 8) % 1) + 1) % 1
      shot = { key: manual.key, k: 1 - Math.abs(2 * f - 1), i: manual.i }
    }
    headPoints.visible = shot?.key !== 'pov'
    if (shot) {
      if (!inCine) {
        inCine = true
        camAim.copy(controls.target)
      }
      pose(shot)
      const a = 1 - Math.exp(-dt / 0.25)
      camera.position.lerp(pos, a)
      camAim.lerp(aim, a)
      camera.lookAt(camAim)
      flyTo = null
    } else {
      if (inCine) {
        // back to the orbit controls: out of the head first, so their distance is never zero
        inCine = false
        if (camera.position.distance(controls.target) < 1.2) camera.position.set(0, 1.2, 2.4)
        controls.forcePosition()
      }
      fovWant = FOV
      if (flyTo) {
        camera.position.lerp(flyTo, 1 - Math.exp(-dt / flyTau))
        controls.forcePosition()
        if (flyTo !== autoTarget && camera.position.distance(flyTo) < 0.01) flyTo = null
      }
      controls.update()
    }
    fovNow += (fovWant - fovNow) * (1 - Math.exp(-dt / 0.25))
    if (Math.abs(fovNow - camera.fov) > 0.05) camera.perspective({ fov: fovNow, aspect: camera.aspect })
    renderer.render({ scene, camera })
  }

  return {
    start() {
      if (raf) return
      resize()
      views.hidden = false
      addEventListener('keydown', onKey)
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      legend.hidden = true
      views.hidden = true
      removeEventListener('keydown', onKey)
    },
  }
}

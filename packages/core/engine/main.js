// ── Display: lanes and playhead for whatever `npm run play` is playing ──
// No audio and no controls here: SuperDirt plays, this page follows its clock.
import './boot.js'
import { createViz } from './viz.js'
import { songTime } from './time.js'
// the project's tracks/ (engine/vite-plugin.js's virtual module — this page
// lives in the package, not next to the project's tracks/, so a plain
// import.meta.glob can't see them)
import { TRACKS } from 'virtual:d-studio-tracks'

const $ = (sel) => document.querySelector(sel)
const status = {
  track: $('#track'),
  state: $('#state'),
  bpm: $('#bpm'),
  bar: $('#bar'),
  time: $('#time'),
  msg: $('#msg'),
}

// ── The engine's clock (POSTed to engine/vite-plugin.js once a second) ──
// gone after 3 s of silence: the engine was killed rather than stopped
let engine = null
let heardAt = 0
const unixNow = () => (performance.timeOrigin + performance.now()) / 1000
const alive = () => engine && unixNow() - heardAt < 3

function now() {
  const a = engine?.anchor
  if (!alive() || !engine.playing || !a) return 0
  return a.cycle + (unixNow() - a.at) * a.cps
}

let trackName = null
let lanes = []

async function hear(next) {
  engine = next
  heardAt = next?.sent ?? unixNow()
  if (!next) return
  status.bpm.textContent = next.bpm ? `${next.bpm} BPM` : ''
  if (next.track !== trackName) await loadTrack(next.track)
}

async function loadTrack(name) {
  trackName = name
  status.track.textContent = name
  if (!Object.hasOwn(TRACKS, name)) return say(`${name}: no tracks/${name}/index.js`, 'error')
  try {
    apply(await TRACKS[name](), 'switch')
  } catch (err) {
    say(`${name}: ${err.message}`, 'error')
    console.error(err)
  }
}

// each index.js calls this when it hot-reloads (wired by engine/vite-plugin.js)
globalThis.__studio = {
  hot: (name, mod) => name === trackName && apply(mod, 'hmr'),
}

function apply(mod, source) {
  try {
    const next = Object.entries(mod.parts ?? {}).filter(([, p]) => p)
    next.forEach(([, p]) => p.queryArc(0, 1))
    lanes = next
    say(source === 'hmr' ? `updated ${clock()}` : `${trackName} loaded`, 'ok')
  } catch (err) {
    say(`${err.message} — showing the last good version`, 'error')
    console.error(err)
  }
}

let shown = ''
let shownTime = ''
function renderTime(cycle) {
  const cps = engine?.anchor?.cps ?? (engine?.bpm ? engine.bpm / 240 : null)
  const text = cps ? songTime(cycle, cps, engine.bars) : ''
  if (text === shownTime) return
  shownTime = text
  status.time.textContent = text
}

function renderState() {
  const playing = alive() && engine.playing
  const text = playing ? '● playing' : alive() ? '■ stopped' : '○ waiting for npm run play'
  if (text === shown) return
  shown = text
  status.state.textContent = text
  status.state.dataset.on = playing ? '1' : '0'
}

// ── Status helpers ──
const clock = () => new Date().toLocaleTimeString([], { hour12: false })
function say(text, kind = 'ok') {
  status.msg.textContent = text
  status.msg.dataset.kind = kind
}

// ── Boot ──
fetch('/__engine')
  .then((r) => r.json())
  .then(hear)
  .catch(() => {})

createViz($('#lanes'), () => {
  const cycle = now()
  renderState()
  renderTime(cycle)
  return {
    lanes,
    now: cycle,
    playing: alive() && !!engine.playing,
    onBar: (bar) => (status.bar.textContent = bar),
  }
})

if (import.meta.hot) {
  import.meta.hot.on('studio:engine', hear)
  // syntax errors: keep the lanes, show the error instead of an overlay
  import.meta.hot.on('vite:error', ({ err }) =>
    say(`${err.message.split('\n')[0]} — showing the last good version`, 'error'),
  )
}

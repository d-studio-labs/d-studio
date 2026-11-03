// ── Lanes: a multi-track punchcard, one row per part ──
import { noteToMidi } from '@strudel/core'

const LOOKBEHIND = 1
const LOOKAHEAD = 2

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// a vertical position key for each event: pitch for notes, name for samples
function keyOf(value) {
  if (value == null || typeof value !== 'object') return String(value)
  const n = value.note ?? value.n
  if (typeof n === 'number') return n
  if (typeof n === 'string') {
    try {
      return noteToMidi(n)
    } catch {
      return n
    }
  }
  return `${value.s ?? '?'}`
}

/**
 * Draw every part as a punchcard lane around the playhead, every animation frame.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {() => {
 *   lanes: [string, import('@strudel/core').Pattern][],
 *   now: number,
 *   playing: boolean,
 *   onBar: (bar: string) => void,
 * }} getState read once per frame
 * @returns {void}
 */
export function createViz(canvas, getState) {
  const ctx = canvas.getContext('2d')
  let lastBar = ''

  function resize() {
    const dpr = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  new ResizeObserver(resize).observe(canvas)

  function frame() {
    const { lanes, now, playing, onBar } = getState()
    const { width: W, height: H } = canvas.getBoundingClientRect()
    const from = now - LOOKBEHIND
    const to = now + LOOKAHEAD
    const x = (t) => ((t - from) / (to - from)) * W
    const accent = css('--accent')
    const grid = css('--grid')
    const ink = css('--ink-dim')
    const laneColors = css('--lanes')
      .split(',')
      .map((c) => c.trim())

    ctx.clearRect(0, 0, W, H)

    // bar grid
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
    for (let b = Math.floor(from); b <= to; b++) {
      for (let q = 0; q < 4; q++) {
        const bx = x(b + q / 4)
        ctx.fillStyle = q === 0 ? grid : `${grid}66`
        ctx.fillRect(bx, 0, 1, H)
      }
      ctx.fillStyle = ink
      ctx.fillText(String(b + 1), x(b) + 5, 13)
    }

    const laneH = lanes.length ? (H - 20) / lanes.length : 0
    lanes.forEach(([name, pat], i) => {
      const top = 20 + i * laneH
      const color = laneColors[i % laneColors.length]

      ctx.fillStyle = grid
      ctx.fillRect(0, top, W, 1)

      let haps = []
      try {
        haps = pat.queryArc(from, to).filter((h) => h.hasOnset())
      } catch (err) {
        ctx.fillStyle = css('--error')
        ctx.fillText(`${name}: ${err.message}`, 8, top + 16)
        return
      }

      // rows: distinct pitches (or sample names) inside this window
      const keys = [...new Set(haps.map((h) => keyOf(h.value)))].sort((a, b) =>
        typeof a === 'number' && typeof b === 'number' ? b - a : String(a).localeCompare(String(b)),
      )
      const pad = 22
      const rowH = Math.max(2, Math.min(14, (laneH - pad - 6) / Math.max(keys.length, 1)))

      for (const h of haps) {
        const begin = Number(h.whole.begin)
        const end = Number(h.whole.end)
        const row = keys.indexOf(keyOf(h.value))
        const active = playing && begin <= now && now < end
        const bx = x(begin) + 1
        const bw = Math.max(2, x(end) - x(begin) - 2)
        const by = top + pad + row * rowH
        ctx.globalAlpha = active ? 1 : begin > now ? 0.55 : 0.22
        ctx.fillStyle = active ? accent : color
        ctx.fillRect(bx, by, bw, rowH - 1)
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = ink
      ctx.fillText(name, 8, top + 15)
    })

    // playhead
    ctx.fillStyle = accent
    ctx.fillRect(x(now), 0, 1.5, H)

    const bar = `bar ${Math.floor(now) + 1} · ${Math.floor((now % 1) * 4) + 1}/4`
    if (bar !== lastBar) {
      lastBar = bar
      onBar(bar)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

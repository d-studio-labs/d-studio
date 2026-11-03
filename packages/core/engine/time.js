// ── Song time for the engine log and the display: "3:36 / 10:00" ──
// Runs in Node and the browser alike, so no imports.

/**
 * Seconds as m:ss (minutes keep counting past an hour).
 *
 * @param {number} s
 * @returns {string}
 */
export const mmss = (s) => {
  const whole = Math.max(0, Math.floor(s))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/**
 * Where a cycle sits in the song: "3:36 / 10:00", with the pass once it loops
 * ("0:12 / 10:00 ×2"). Without a song length, just the time since cycle 0.
 *
 * @param {number} cycle
 * @param {number} cps
 * @param {number} [bars] the track's BARS
 * @returns {string}
 */
export const songTime = (cycle, cps, bars) => {
  if (!bars) return mmss(cycle / cps)
  const pass = Math.floor(cycle / bars)
  const at = `${mmss((cycle - pass * bars) / cps)} / ${mmss(bars / cps)}`
  return pass > 0 ? `${at} ×${pass + 1}` : at
}

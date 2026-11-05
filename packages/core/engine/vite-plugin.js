// ── Dev-server side of the display: relays `npm run play`'s clock to the page
// (POST /__engine from headless.mjs, GET for a page that opens mid-song) and hot-swaps every index.js

import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TRACK_ENTRY = /\/tracks\/([^/]+)\/index\.js$/
const VIRTUAL_TRACKS = 'virtual:d-studio-tracks'
const RESOLVED_VIRTUAL_TRACKS = '\0' + VIRTUAL_TRACKS

/**
 * The d-studio Vite plugin: the engine's clock for the display, hot-swap for every index.js,
 * and a virtual module listing the project's tracks (the display's own HTML lives in the
 * package, not next to the project's tracks/, so a plain `import.meta.glob` can't find them).
 *
 * @param {{ projectDir?: string }} [options] where tracks/ lives; defaults to `process.cwd()`
 * @returns {import('vite').Plugin}
 */
export function studio({ projectDir = process.cwd() } = {}) {
  let last = null

  return {
    name: 'dub-studio',

    resolveId(id) {
      if (id === VIRTUAL_TRACKS) return RESOLVED_VIRTUAL_TRACKS
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_TRACKS) return
      const dir = join(projectDir, 'tracks')
      const names = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()) : []
      const entries = names.map(
        (d) => `${JSON.stringify(d.name)}: () => import(${JSON.stringify(`/@fs/${join(dir, d.name, 'index.js')}`)})`,
      )
      return `export const TRACKS = {${entries.join(',')}}\n`
    },

    configureServer(server) {
      server.middlewares.use('/__engine', (req, res) => {
        if (req.method !== 'POST') {
          res.setHeader('content-type', 'application/json')
          return res.end(JSON.stringify(last))
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            last = JSON.parse(body)
          } catch {
            res.statusCode = 400
            return res.end('expected JSON\n')
          }
          server.ws.send({ type: 'custom', event: 'studio:engine', data: last })
          res.end()
        })
      })
    },

    transform(code, id) {
      const m = id.match(TRACK_ENTRY)
      if (!m) return
      return (
        code +
        `\nif (import.meta.hot) import.meta.hot.accept((mod) => mod && globalThis.__studio?.hot(${JSON.stringify(m[1])}, mod))\n`
      )
    },
  }
}

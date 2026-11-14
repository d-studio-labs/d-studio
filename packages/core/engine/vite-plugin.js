// ── Dev-server side of the display: relays `npm run play`'s clock to the page
// (POST /__engine from headless.mjs, GET for a page that opens mid-song) and hot-swaps every index.js

import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import dgram from 'node:dgram'
import { decode } from './osc.mjs'

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
      // the spatial view's field: superdirt/space.scd sends /field (13 floats per orbit: ten field products, then three band powers; 60 Hz) here as UDP;
      // it goes on to the page as it comes. Not listening is fine: it then follows the score
      const port = Number(process.env.DSTUDIO_FIELD_PORT ?? 57130)
      const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      sock.on('error', (err) => server.config.logger.warn(`spatial field: port ${port}: ${err.message}`))
      sock.on('message', (buf) => {
        const { address, args } = decode(buf)
        if (address === '/field') server.ws.send({ type: 'custom', event: 'studio:field', data: args })
      })
      sock.bind(port, '127.0.0.1')
      server.httpServer?.on('close', () => sock.close())

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

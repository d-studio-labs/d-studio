// ── Dev-server side of the display: relays `npm run play`'s clock to the page
// (POST /__engine from headless.mjs, GET for a page that opens mid-song) and hot-swaps every index.js

const TRACK_ENTRY = /\/tracks\/([^/]+)\/index\.js$/

/**
 * The d-studio Vite plugin: the engine's clock for the display, and hot-swap for every index.js.
 *
 * @returns {import('vite').Plugin}
 */
export function studio() {
  let last = null

  return {
    name: 'dub-studio',

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

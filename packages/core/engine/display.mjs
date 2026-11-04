// `d-studio display`: lanes + playhead for whatever `d-studio play` is
// playing. No index.html, no vite.config.js needed in the project; both
// live in the package (display/, engine/vite-plugin.js).
import { createServer } from 'vite'
import { studio } from './vite-plugin.js'
import { PROJECT } from './project.mjs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../display/', import.meta.url))
const projectDir = fileURLToPath(PROJECT)

const server = await createServer({
  root,
  plugins: [studio({ projectDir })],
  server: { open: true, hmr: { overlay: false } },
  optimizeDeps: {
    // pre-bundle together so the engine and your tracks share one @strudel/core
    include: ['@strudel/core', '@strudel/mini'],
  },
})
await server.listen()
server.printUrls()

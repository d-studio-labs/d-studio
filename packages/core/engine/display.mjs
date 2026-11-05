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
    // main.js imports virtual:d-studio-tracks (vite-plugin.js's `load` hook).
    // Inside this monorepo @d-studio-labs/core is workspace-symlinked, so
    // main.js resolves outside any node_modules and this never mattered —
    // but in a real install (a project's actual node_modules copy), Vite's
    // dependency-scan pass treats it as pre-bundle-able and runs it through
    // a bare esbuild scan that doesn't carry Vite plugin hooks, so it can't
    // resolve the virtual import and crashes. Harmless to exclude: main.js
    // is the entry itself, not something worth pre-bundling anyway.
    exclude: ['@d-studio-labs/core'],
  },
})
await server.listen()
server.printUrls()

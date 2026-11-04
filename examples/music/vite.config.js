import { defineConfig } from 'vite'
import { studio } from '@d-studio-labs/core/vite-plugin'

export default defineConfig({
  plugins: [studio()],
  server: { open: true, hmr: { overlay: false } },
  optimizeDeps: {
    // pre-bundle together so the engine and your tracks share one @strudel/core
    include: ['@strudel/core', '@strudel/mini'],
  },
})

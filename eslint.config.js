import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/exports/',
      '**/samples/',
      // shipped standalone to new projects, with its own config and __PROJECT_NAME__
      // placeholders — linted by the scaffold CI job through its own tooling instead
      'packages/create/templates/',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['packages/core/engine/**/*.{js,mjs}', '*.config.js'],
    ignores: ['packages/core/engine/main.js', 'packages/core/engine/viz.js'],
    languageOptions: { globals: globals.node },
  },
  // the display: served through vite-plugin.js and run in the browser, following play's clock
  {
    files: ['packages/core/engine/main.js', 'packages/core/engine/viz.js'],
    languageOptions: { globals: globals.browser },
  },
  // a part muted by commenting it out leaves its import unused: worth a note, not a failure
  {
    files: ['examples/playground/tracks/**/*.js'],
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
]

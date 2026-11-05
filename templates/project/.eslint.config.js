import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/', 'dist/', 'exports/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['.eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  // a part muted by commenting it out leaves its import unused: worth a note, not a failure
  {
    files: ['tracks/**/*.js'],
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
]

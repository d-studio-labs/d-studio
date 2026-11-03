#!/usr/bin/env node
// ── d-studio <command>: registers the resolve hook, then runs the command ──
// A project's own node doesn't need --import; this does it before importing.
import { register } from 'node:module'
register('./resolve-hook.mjs', import.meta.url)

const commands = {
  check: './check.mjs',
  play: './headless.mjs',
  export: './export.mjs',
  samples: './samples.mjs',
  ping: './ping.mjs',
}

const command = process.argv[2]
const target = commands[command]
if (!target) {
  console.error(`d-studio: unknown command "${command ?? ''}"\nusage: d-studio <${Object.keys(commands).join('|')}> [...args]`)
  process.exit(1)
}

// drop "<command>" so the target module's argv.slice(2) sees only its own args
process.argv.splice(2, 1)
await import(target)

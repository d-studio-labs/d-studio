#!/usr/bin/env node
// ── d-studio <command>: registers the resolve hook, then runs the command ──
// A project's own node doesn't need --import; this does it before importing.
import { register } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
register('./resolve-hook.mjs', import.meta.url)

const commands = {
  check: './check.mjs',
  play: './headless.mjs',
  export: './export.mjs',
  samples: './samples.mjs',
  ping: './ping.mjs',
}

const SCLANG = process.env.SCLANG || '/Applications/SuperCollider.app/Contents/MacOS/sclang'
const SUPERDIRT = new URL('../superdirt/', import.meta.url)

/** Runs an .scd file with sclang, inheriting stdio; exits with its code. */
function sclang(file) {
  const path = fileURLToPath(new URL(file, SUPERDIRT))
  const result = spawnSync(SCLANG, [path], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}

const command = process.argv[2]

if (command === 'dirt') {
  const path = fileURLToPath(new URL('startup.scd', SUPERDIRT))
  // stop a leftover sclang/scsynth from a previous run before booting a fresh one
  spawnSync('pkill', ['-f', `sclang ${path}`])
  spawnSync('killall', ['scsynth'])
  sclang('startup.scd')
} else if (command === 'dirt-install') {
  sclang('install.scd')
} else {
  const target = commands[command]
  if (!target) {
    console.error(
      `d-studio: unknown command "${command ?? ''}"\nusage: d-studio <${[...Object.keys(commands), 'dirt', 'dirt-install'].join('|')}> [...args]`,
    )
    process.exit(1)
  }
  // drop "<command>" so the target module's argv.slice(2) sees only its own args
  process.argv.splice(2, 1)
  await import(target)
}

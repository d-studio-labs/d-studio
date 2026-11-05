# D-Studio

Strudel without the browser. Your own editor is the source of truth,
SuperDirt makes the sound, Node schedules it in real time.

```
your editor ──:w──▶ d-studio play ──OSC──▶ SuperDirt   (hot-swaps the pattern, clock keeps running)
```

This repo is the **framework**: the engine, the composition helpers, and the
SuperDirt orchestration. Your music — tracks, your own synths, samples — lives
in your own project, which depends on this as a package, like any other npm
dependency.

## Status

Private, early. Not published to npm (or any registry) yet — right now the
only way to use `@d-studio-labs/core` is from inside this monorepo via npm
workspaces. `examples/playground` is a real consumer of it (not a copy of its code)
and is the best place to see the intended shape of a project that depends on
it. Publishing (likely GitHub Packages first, scoped to this org) is tracked
separately.

## Try it: `examples/playground`

The fastest way to hear the engine, from inside this monorepo:

```sh
npm install                      # from the repo root, once
d-studio dirt-install             # one-time: SuperDirt + Dirt-Samples quarks
cd examples/playground
npm run samples                  # download drum machine samples (909 + 808)
npm run dirt                     # boots SuperDirt; wait for "SUPERDIRT READY"
```

In a second terminal:

```sh
cd examples/playground
npm run play                     # starts the clock, plays tracks/techno
```

Open `tracks/techno/*.js` in your editor and save — the pattern hot-swaps
while `play` keeps running, the clock never stops. Try muting/unmuting a line
in `tracks/techno/index.js`'s `parts` object, or nudging a `.gain()`/`.lpf()`
value, and listen to it change live.

Other commands, run from inside `examples/playground/` (the same ones listed
under [The CLI](#the-cli) below, scoped to this one project):

```sh
npm run check                     # parses every part, prints events — no audio needed
npm run export -- techno          # renders to exports/techno.wav
npm run test -- techno --from 8   # flags any part that's effectively silent
npm run display                   # lanes + playhead in the browser
```

## Packages

```
packages/
  core/        @d-studio-labs/core — engine, lib, superdirt (see below)
  synths/      @d-studio-labs/synths — the shared filter-envelope SynthDef (d-modules.scd)
examples/
  playground/  a minimal project that depends on @d-studio-labs/core
```

`@d-studio-labs/synths` is a sibling package under the same npm scope, not a
subpath of `core` — `core`'s `startup.scd` loads it via a relative path
(`../../synths`) that resolves the same way whether you're in this monorepo
or a real install, since both put same-scope packages side by side under
`node_modules/@d-studio-labs/`.

## A project that depends on it

```
my-music/
  package.json       ← "@d-studio-labs/core" as a dependency
  tracks/<name>/      ← index.js (BPM, parts) + the parts' own files
  synths/*.scd        ← optional: your own SuperDirt synths, loaded after the engine's
  samples/            ← gitignored, from `d-studio samples`
  exports/            ← gitignored, from `d-studio export`
```

`examples/playground` is exactly this shape — read it before writing your own.

### Scaffold one

```sh
curl -fsSL https://raw.githubusercontent.com/d-studio-labs/d-studio/main/scripts/create.sh | sh -s my-track
```

Downloads `templates/project/` from this repo, fills in the name, and runs
`npm install` — `my-track/` comes out matching the shape above, with
ESLint/Prettier already wired up and a two-part starter track
(`tracks/hello/`) to replace. Refuses to overwrite an existing directory. No
local clone of this repo needed first.

## Dependencies

**npm** (installed automatically as dependencies of `@d-studio-labs/core`):

- `@strudel/core`, `@strudel/mini` — the pattern language
- `@julusian/midi` — MIDI controller I/O

**Not npm-installable — set up once on your machine:**

- [SuperCollider](https://supercollider.github.io/) (`brew install --cask supercollider`, then open it once for Gatekeeper)
- SuperDirt + Dirt-Samples quarks, one time: `d-studio dirt-install`
- Optional: **sc3-plugins** (extra SuperDirt UGens) and **ATK** (`Quarks.install("atk-sc3")`, for the ambisonic/binaural echoes — without it, `DIRT_SPACE` falls back to `off`)

Boot it before `d-studio play`/`ping`/`export`: `d-studio dirt` — wait for `SUPERDIRT READY`.

## The CLI

Once `@d-studio-labs/core` is a dependency, its `d-studio` binary is on your
project's `node_modules/.bin`:

```sh
npm install
d-studio check            # headless: parses every part, prints events per cycle (no audio)
d-studio check -- techno  # just one track
d-studio play             # the engine: Strudel's scheduler in Node → timed OSC to SuperDirt
d-studio play -- techno --from 0 --to 16   # loop a bar range
d-studio export -- techno  # render a track to exports/*.wav
d-studio samples          # download drum machine samples (909 + 808 by default)
d-studio ping             # one sound over OSC, no Strudel: is SuperDirt listening?
d-studio dirt             # boots SuperDirt headless; wait for "SUPERDIRT READY"
d-studio dirt-install     # one-time: SuperDirt + Dirt-Samples quarks
d-studio test -- techno --from 42   # solo-renders each part, flags any effectively silent one
                                     # (for an arranged track, point --from at a section where
                                     # every part should be active — not bar 0, which may be a
                                     # quiet intro by design)
d-studio display          # lanes + playhead in the browser, following d-studio play's clock
```

Each one needs SuperDirt running (see Dependencies, above) except `check`,
which needs nothing but Node.

## `@d-studio-labs/core`'s exports

| Subpath                        | What                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| `@d-studio-labs/core/mod`      | `drift` (perlin), `sweep` (sine), `ramp`, `gate`                 |
| `@d-studio-labs/core/arrange`  | `arrangement(bars)` → `during(…ranges)`, `env(…points)`, `fadeIn`/`fadeOut` |
| `@d-studio-labs/core/fx`       | echo times, `evolvingFilter`, `dubSpace`, `dubChord`, delay & spring params |
| `@d-studio-labs/core/drums`    | `heartbeat(root)` — a dark kick tuned to the track's root        |
| `@d-studio-labs/core/space`    | ambisonic params: `space`, `sphere`, `width`, `roll`, `azim`, `spin`, `elev`, `glide` |
| `@d-studio-labs/core/midi`     | `midi(part)`, `cc(n)`, `knob(i)`, `around(i, low, high)`, `controls(parts, map)` |

A track is a folder with an `index.js` exporting `BPM`, optional `BARS`, and
`parts` (each key one lane). Saving any file a track imports hot-swaps the
pattern while `d-studio play` runs. See `examples/playground/tracks/techno/index.js`.

## Layout

```
packages/core/
  engine/       the runtime: scheduling, MIDI in, OSC out, export, the CLI (cli.mjs)
  lib/          composition helpers tracks import (table above)
  superdirt/    startup, master (glue/tape/limiter), space (ATK), spring, midi, record
packages/synths/
  d-modules.scd the shared filter-envelope SynthDef, loaded by core's startup.scd
```

## Environment

| Variable         | Default                                                 | What                                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `DIRT_LATENCY`   | `0.4`                                                     | seconds events go out ahead                       |
| `DIRT_PORT`      | `57120`                                                   | where the engine sends OSC                        |
| `DIRT_SPACE`     | `binaural`                                                | `binaural`, `stereo` or `off`                      |
| `SCLANG`         | `/Applications/SuperCollider.app/Contents/MacOS/sclang`   | where sclang lives                                 |
| `STUDIO_URL`     | `http://localhost:5173`                                   | where `d-studio display`'s dev server runs; the engine posts its clock there |

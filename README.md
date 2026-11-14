# D-Studio

[![CI](https://github.com/d-studio-labs/d-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/d-studio-labs/d-studio/actions/workflows/ci.yml)

## Overview

D-Studio is a framework for writing music as code. A track is a JS file
that defines a BPM and a set of parts. The engine schedules the parts and
sends them to SuperCollider's SuperDirt, which makes the sound. The same track
can also be rendered to WAV, checked for silent parts, or displayed in the
browser. While a track is playing, saving a file it imports replaces the
running pattern without stopping the clock.

Basic use:

1. Install SuperCollider (`brew install --cask supercollider`).
2. Create a project (see [Make your own](#make-your-own)):
   `curl -fsSL https://raw.githubusercontent.com/d-studio-labs/d-studio/main/packages/create/create.sh | sh -s my-track`
3. Start SuperDirt in one terminal: `npm run dirt` (wait for `SUPERDIRT READY`).
4. Start the clock in a second terminal: `npm run play`.
5. Edit a file in `tracks/<name>/` and save.

Your project is a separate repo that depends on `@d-studio-labs/core`. This
repo contains only the framework: the engine, the composition helpers and the
SuperDirt setup. The scaffolded project includes two tracks, `hello` (minimal)
and `velvet` (a full arrangement).

Other commands: `npm run check` (parse patterns, no audio),
`npm run export -- <track>` (render to WAV), `npm run display` (lanes and
playhead in the browser, plus a **spatial** tab: where the sound sits round the listener).

The packages are on GitHub Packages, which requires a token with
`read:packages` in `NPM_TOKEN` (see [Status](#status)).

## Guide

### 0. Create a workspace

A workspace is a folder with a `package.json` that depends on
`@d-studio-labs/core`. The scaffolder creates it. SuperCollider must be
installed first (`brew install --cask supercollider`, then open it once for
Gatekeeper):

```sh
export NPM_TOKEN=<token with read:packages>   # once, see Status below
curl -fsSL https://raw.githubusercontent.com/d-studio-labs/d-studio/main/packages/create/create.sh | sh -s my-track
cd my-track
npm run dirt-install   # once per machine: SuperDirt quarks
npm run samples        # drum machine samples (909 + 808)
npm run dirt           # terminal 1: wait for "SUPERDIRT READY"
npm run play           # terminal 2: the clock. Edit tracks/velvet and save
```

Project layout: `tracks/` (songs), `synths/` (your own SynthDefs), `samples/`
(audio files, created by `npm run samples`), `exports/` (rendered WAVs). A new
track is a new folder under `tracks/` with an `index.js` that exports `BPM` and
`parts`; play it with `npm run play -- <folder>`.

### 1. Create your own synth

Synths are SuperCollider `SynthDef`s. Any `.scd` file in your project's
`synths/` folder is loaded when SuperDirt boots.

1. Create `synths/mysaw.scd`:

   ```supercollider
   (
   SynthDef(\mysaw, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.2|
     var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
     var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
     var sound = Mix(Saw.ar(f * ([-1, 0, 1] * detune).midiratio)) * 0.3;
     Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
   }).add;
   )
   ```

2. Restart `npm run dirt` (synths are read at boot; `play` can keep its
   terminal).
3. Use it from a track like any sound: `note("c2 eb2 g2").s("mysaw")`. Extra
   arguments of the SynthDef (here `detune`) become pattern controls:
   `.detune(0.4)`.

A SynthDef should take `sustain`, `freq`, `pan`, `speed` and `accelerate`, end
in `DirtPan.ar`, and use `doneAction: 2` so notes free themselves. Use core
UGens only if it has to work without sc3-plugins. `synths/d-studio.scd` in the
starter project has working examples.

### 2. Load custom samples

Put audio in `samples/<name>/` — one folder per sound, the folder name is the
sound's name. `.wav`, `.aiff` and `.flac` work.

```
samples/
  mykick/      kick1.wav  kick2.wav
  vox/         hello.wav
```

Restart `npm run dirt` (samples are loaded at boot), then:

```js
s('mykick') // first file
s('mykick:1') // second file (files are sorted by name)
s('vox').speed(0.5)
```

`npm run samples` downloads Roland TR-909 and TR-808 into the same layout
(`RolandTR909_bd`, …). For other drum machines pass bank names:
`npm run samples -- RolandTR707 LinnDrum`. `samples/` is gitignored — keep
your own recordings backed up elsewhere or remove it from `.gitignore`.

### 3. Connect your MIDI controller

1. Plug it in (USB). `npm run play` scans for devices every 2 seconds, so you
   can do it before or after starting. It prints `MIDI ✓ <device name>`
   when it's found.
2. Touch a knob or key: the engine prints what arrived (CC number or note).
3. Use knobs as live values and keys as a playable instrument:

   ```js
   import { cc, knob, around, midi } from '@d-studio-labs/core/midi'

   note('c2 eb2 g2').s('mysaw').lpf(cc(74).range(300, 3000)) // CC 74 → filter, 0–1 scaled
   // …or by place on the controller: knob(1) … knob(16)
   // …or as a multiplier around what the track wrote: .mul(gain(around(7, 0, 2)))

   export const parts = {
     bass: midi(bass), // keys also play this part's sound
     lead: midi(lead, { muted: true }), // part stays silent, only your keys play it
   }
   ```

Knobs must send absolute 0–127 values (not relative). The built-in mapping
(`knob(i)`, pages, pads) is for the **Arturia MiniLab mkII**
(`packages/core/lib/controllers/arturia-minilab-mk2.js`). For another
controller `cc(n)` works as is with whatever CC numbers it sends; for
`knob(i)` copy that file, fill in your device's CC numbers, and point
`lib/midi.js` at the copy. MIDI is read by the engine, so it works with
`npm run play`, not in the browser.

## Status

Early, but public and usable today. `@d-studio-labs/core` and
`@d-studio-labs/synths` are published to GitHub Packages (not the public npm
registry) — real, tagged, installable dependencies (see "Make your own"
below) — using them doesn't require this monorepo. `examples/playground` is
a real consumer of it too (not a copy of its code) and is the best place to
see the intended shape of a project that depends on it.

GitHub Packages requires auth even to install a public package: create a
token with the `read:packages` scope
(https://github.com/settings/tokens), `export NPM_TOKEN=<it>`, and the
scaffolded project's `.npmrc` picks it up automatically.

## Make your own

```sh
curl -fsSL https://raw.githubusercontent.com/d-studio-labs/d-studio/main/packages/create/create.sh | sh -s my-track
```

One command, nothing to clone first — just `curl`, `tar`, `sed` and `npm` on
your machine. Leave off `-s my-track` and it prompts for a name instead
(only when run from a terminal — a name is required in a non-interactive
context like CI).

What it does: downloads `packages/create/templates/project/` from this
repo's `main` branch, fills in the project name everywhere it appears, fills
in your git `user.name` and the current year into `LICENSE`, then runs `npm
install`. Refuses to run if a directory with that name already exists.

What you get: `my-track/` matching the shape in
["A project that depends on it"](#a-project-that-depends-on-it) below —
ESLint/Prettier already wired up, an all-rights-reserved `LICENSE` to swap
out if you want something more permissive, and two starter tracks:
`tracks/hello/` (minimal, delete once you've got the hang of it) and
`tracks/velvet/` (a fuller, fully-arranged example — see its own README).
`tracks/.default` is set to `velvet`, so a bare `npm run play` plays that
one.

It finishes by printing the same one-time setup as
[Try it](#try-it-examplesplayground) below:

```
cd my-track
npm run dirt-install   # one-time: SuperCollider quarks (needs SuperCollider installed)
npm run samples        # download drum machine samples
npm run dirt           # boot SuperDirt; wait for "SUPERDIRT READY"
npm run play           # (in another terminal) start the clock
```

**Maintaining the template:** `tracks/hello/`, `tracks/velvet/` and
`synths/d-studio.scd` in the template are hand-copies of the same files in
`examples/playground` (the source of truth for both). Edit a track in
`examples/playground`, then run `packages/create/sync.sh` from the repo
root to copy those changes into the template before publishing — it leaves
template-only files (`tracks/velvet/README.md`, the template's own
`package.json`/`LICENSE`) alone, and doesn't delete anything, so check `git
status` after if you removed a file on the playground side.

## Try it: `examples/playground`

Prefer to poke at a working example inside this repo first? The fastest way
to hear the engine, from inside this monorepo:

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
npm run play                     # starts the clock, plays tracks/velvet (its tracks/.default)
```

Open any file `tracks/velvet/index.js` imports and save — the pattern
hot-swaps while `play` keeps running, the clock never stops. Try
muting/unmuting a line in its `parts` object, or nudging a `.gain()`/`.lpf()`
value, and listen to it change live. There's also `tracks/hello/`, a
minimal two-part example — play it with `npm run play -- hello`.

Other commands, run from inside `examples/playground/` (the same ones listed
under [The CLI](#the-cli) below, scoped to this one project):

```sh
npm run check                     # parses every part, prints events — no audio needed
npm run export -- velvet          # renders to exports/velvet.wav
npm run test -- velvet --from 32  # flags any part that's effectively silent
npm run display                   # lanes + playhead in the browser; keys 1 lanes, 2 spatial (the sphere)
```

### The spatial view

`npm run display` has two tabs, **lanes** (the punchcard) and **spatial** (keys `1` and `2`): the sound field
round the listener, as a cloud of points. Front is up the screen from the head at the centre (the orange stem
is its nose, the dots either side its ears), left and right are the sides, behind is down the screen. Drag to
look from another side.

- Each part (each orbit) is drawn in its own colour, with a lobe pointing where it sounds: `.pan`, `.sphere`,
  `.azim`, `.spin`, `.roll`, `.elev` and the echoes thrown into the sphere by `.space`.
- The legend lists every part with a level meter and where it sits (`front`, `90° L`, `back ↑12°`, `diffuse`).
  Point at a part to see it alone, click to pin it. A hit lights its part up; a steady sound settles to a dim bed.
- It measures the real sound: `superdirt/space.scd` sends each orbit's first-order ambisonic field 60 times a second
  (UDP, `DSTUDIO_FIELD_PORT`), so it needs `npm run dirt` restarted after updating and `DIRT_SPACE` not `off`.
  With no field arriving (dirt not running, or `off`) it places things from the score instead, with no legend.
- It's drawn with [ogl](https://github.com/oframe/ogl) (WebGL2); only the tab you're on runs.

## Packages

```
packages/
  core/        @d-studio-labs/core — engine, lib, superdirt (see below)
  synths/      @d-studio-labs/synths — the shared filter-envelope SynthDef (d-modules.scd)
  create/      the project scaffolder (curl | sh) — not published, just a script + template
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
  tracks/.default      ← optional: one line, which track `play`/`check` default to
  tracks/<name>/      ← index.js (BPM, parts) + the parts' own files
  synths/*.scd        ← optional: your own SuperDirt synths, loaded after the engine's
  samples/            ← gitignored, from `d-studio samples`
  exports/            ← gitignored, from `d-studio export`
```

`examples/playground` is exactly this shape — read it before writing your
own, or see ["Make your own"](#make-your-own) above to generate it.

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
d-studio check -- velvet  # just one track
d-studio play             # the engine: Strudel's scheduler in Node → timed OSC to SuperDirt
d-studio play -- velvet --from 0 --to 16   # loop a bar range
d-studio export -- velvet  # render a track to exports/*.wav
d-studio samples          # download drum machine samples (909 + 808 by default)
d-studio ping             # one sound over OSC, no Strudel: is SuperDirt listening?
d-studio dirt             # boots SuperDirt headless; wait for "SUPERDIRT READY"
d-studio dirt-install     # one-time: SuperDirt + Dirt-Samples quarks
d-studio test -- velvet --from 32   # solo-renders each part, flags any effectively silent one
                                     # (for an arranged track, point --from at a section where
                                     # every part should be active — not bar 0, which may be a
                                     # quiet intro by design)
d-studio display          # lanes + spatial (the ambisonic sphere) in the browser, following d-studio play's clock
```

`d-studio play`/`check` with no track named use `tracks/.default` (one line,
a track's folder name) if the project has one, else whichever track folder
sorts first alphabetically.

Each one needs SuperDirt running (see Dependencies, above) except `check`,
which needs nothing but Node.

## `@d-studio-labs/core`'s exports

| Subpath                       | What                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `@d-studio-labs/core/mod`     | `drift` (perlin), `sweep` (sine), `ramp`, `gate`                                      |
| `@d-studio-labs/core/arrange` | `arrangement(bars)` → `during(…ranges)`, `env(…points)`, `fadeIn`/`fadeOut`           |
| `@d-studio-labs/core/fx`      | echo times, `evolvingFilter`, `dubSpace`, `dubChord`, delay & spring params           |
| `@d-studio-labs/core/drums`   | `heartbeat(root)` — a dark kick tuned to the track's root                             |
| `@d-studio-labs/core/space`   | ambisonic params: `space`, `sphere`, `width`, `roll`, `azim`, `spin`, `elev`, `glide` |
| `@d-studio-labs/core/midi`    | `midi(part)`, `cc(n)`, `knob(i)`, `around(i, low, high)`, `controls(parts, map)`      |

A track is a folder with an `index.js` exporting `BPM`, optional `BARS`, and
`parts` (each key one lane). Saving any file a track imports hot-swaps the
pattern while `d-studio play` runs. See `examples/playground/tracks/velvet/index.js`.

## Layout

```
packages/core/
  engine/       the runtime: scheduling, MIDI in, OSC out, export, the CLI (cli.mjs)
  lib/          composition helpers tracks import (table above)
  superdirt/    startup, master (glue/tape/limiter), space (ATK), spring, midi, record
packages/synths/
  d-modules.scd the shared filter-envelope SynthDef, loaded by core's startup.scd
packages/create/
  create.sh     the scaffolder (see "Make your own" above)
  sync.sh       copies tracks/{hello,velvet} + synths/d-studio.scd from
                examples/playground (source of truth) into templates/project/ —
                run after editing a track there, before testing/publishing
  templates/project/   what it copies — a full standalone project, own package.json
```

## Environment

| Variable             | Default                                                 | What                                                                                        |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DIRT_LATENCY`       | `0.4`                                                   | seconds events go out ahead                                                                 |
| `DIRT_PORT`          | `57120`                                                 | where the engine sends OSC                                                                  |
| `DIRT_SPACE`         | `binaural`                                              | `binaural`, `stereo` or `off`                                                               |
| `SCLANG`             | `/Applications/SuperCollider.app/Contents/MacOS/sclang` | where sclang lives                                                                          |
| `STUDIO_URL`         | `http://localhost:5173`                                 | where `d-studio display`'s dev server runs; the engine posts its clock there                |
| `DSTUDIO_FIELD_PORT` | `57130`                                                 | UDP port the dirt side sends the spatial view's field to, and `d-studio display` listens on |

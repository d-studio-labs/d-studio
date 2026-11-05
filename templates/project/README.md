# __PROJECT_NAME__

A [d-studio](https://github.com/d-studio-labs/d-studio) project.

```sh
npm run dirt-install   # one-time: SuperCollider quarks (needs SuperCollider installed)
npm run samples        # download drum machine samples (909 + 808 by default)
npm run dirt           # boot SuperDirt; wait for "SUPERDIRT READY"
```

In another terminal:

```sh
npm run play -- hello   # starts the clock, plays tracks/hello
```

Edit any file `tracks/hello/index.js` imports and save — the pattern
hot-swaps while `play` keeps running, the clock never stops.

```sh
npm run check -- hello            # parses every part, prints events — no audio needed
npm run export -- hello           # renders to exports/hello.wav
npm run test -- hello --from 0    # flags any part that's effectively silent
npm run display                   # lanes + playhead in the browser
```

## Two starter tracks

- **`tracks/hello/`** — the minimal shape: one drum part, one synth part,
  four bars. Start here, or delete it once you've got the hang of things.
- **`tracks/velvet/`** — a fuller example (deep house, arranged end to end).
  See `tracks/velvet/README.md` for a walkthrough of how it's put together.
  Play it with `npm run play -- velvet`.

See the [d-studio README](https://github.com/d-studio-labs/d-studio) for the
full CLI, composition helpers, and environment variables.

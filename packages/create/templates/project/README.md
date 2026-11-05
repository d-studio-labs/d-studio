# __PROJECT_NAME__

A [d-studio](https://github.com/d-studio-labs/d-studio) project.

```sh
npm run dirt-install   # one-time: SuperCollider quarks (needs SuperCollider installed)
npm run samples        # download drum machine samples (909 + 808 by default)
npm run dirt           # boot SuperDirt; wait for "SUPERDIRT READY"
```

In another terminal:

```sh
npm run play            # starts the clock, plays tracks/velvet (tracks/.default)
```

Edit any file `tracks/velvet/index.js` imports and save — the pattern
hot-swaps while `play` keeps running, the clock never stops.

```sh
npm run check -- velvet           # parses every part, prints events — no audio needed
npm run export -- velvet          # renders to exports/velvet.wav
npm run test -- velvet --from 32  # flags any part that's effectively silent
npm run display                   # lanes + playhead in the browser
```

## Two starter tracks

- **`tracks/velvet/`** — a fuller example (deep house, arranged end to end),
  and the default `play`/`check` track (set in `tracks/.default`). See
  `tracks/velvet/README.md` for a walkthrough of how it's put together.
- **`tracks/hello/`** — the minimal shape: one drum part, one synth part,
  four bars. Start here to learn the shape, or delete it once you've got the
  hang of things. Play it with `npm run play -- hello`.

See the [d-studio README](https://github.com/d-studio-labs/d-studio) for the
full CLI, composition helpers, and environment variables.

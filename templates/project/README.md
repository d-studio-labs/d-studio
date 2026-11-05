# __PROJECT_NAME__

A [d-studio](https://github.com/d-studio-labs/d-studio) project.

```sh
npm run dirt-install   # one-time: SuperCollider quarks (needs SuperCollider installed)
npm run samples        # download drum machine samples (909 + 808 by default)
npm run dirt           # boot SuperDirt; wait for "SUPERDIRT READY"
```

In another terminal:

```sh
npm run play           # starts the clock, plays tracks/hello
```

Edit any file `tracks/hello/index.js` imports and save — the pattern
hot-swaps while `play` keeps running, the clock never stops.

```sh
npm run check                     # parses every part, prints events — no audio needed
npm run export -- hello           # renders to exports/hello.wav
npm run test -- hello --from 0    # flags any part that's effectively silent
npm run display                   # lanes + playhead in the browser
```

See the [d-studio README](https://github.com/d-studio-labs/d-studio) for the
full CLI, composition helpers, and environment variables.

# velvet

Deep house, 122 BPM, D minor. A fuller example than `tracks/hello/` — one
track arranged in full (intro → groove → break → drop → wind-down → outro),
spread across the files a track usually ends up split into once it grows.

```sh
npm run play -- velvet
```

## Files

- **`song.js`** — the shared harmony, groove and form every other file
  imports from: `BARS` (160, looping into its own intro), `during`/`env`
  (from `arrangement(BARS)`, see the main d-studio README), `groove` (the
  swing curve), and the chord/bassline/hook progressions as mini-notation
  strings. Keeping these in one place means a key or chord change only has
  to happen once.
- **`drums.js`** — `kick`, `clap`, `hats`, `shaker`, `congas`, `crash`. The
  kick stacks a dry TR909 hit with `dkick` (a tuned sine, for the weight) and
  `.duckorbit`s the bass/keys/pad orbits — the sidechain pump a house kick
  needs.
- **`bass.js`** — `bass`, on `dbass`: a filter-plucked sine, the filter
  envelope doing the "dum" rather than the amplitude envelope.
- **`keys.js`** — `keys` (chord stabs), `held` (the same chords, sustained,
  for the break), `pad` (an octave-up string wash), `pluck` (the hook, with
  a dotted-eighth delay). All four lean on `song.js`'s `chords`/`hook`.
- **`fx.js`** — `riser`, a filtered noise swell into each new section.
- **`index.js`** — assembles all of the above into `parts`, plus a flat gain
  trim so the whole mix lands around the target loudness through the master
  bus's glue compressor.

## Synths

`bass.js`/`drums.js`/`keys.js`/`fx.js` use custom SuperDirt SynthDefs
(`dbass`, `dkick`, `dkeys`, `dstrings`, `dpluck`, `dwhite`) rather than
samples or `@d-studio-labs/synths`. They're defined in `synths/d-studio.scd`
at this project's root — loaded automatically after the engine's own synths
(see `d-studio dirt`'s startup log). That file ships with a few more SynthDefs
than this track uses; feel free to trim it down or build on it.

## Arrangement

Per `song.js`'s own comment: `0` intro · `16` bass + clap in · `32` full
groove · `64` break (kick drops, keys/pad hold) · `80` the drop (kick + hook
return) · `128` wind down · `144` outro, looping back into bar `0`. Each
part's `.apply(during(...))` calls are what carry this out — read `drums.js`'s
`kick` alongside this list to see the pattern.

Your own SuperDirt `.scd` SynthDefs go here. They're loaded after
`@d-studio-labs/core`'s own, so you can reference anything it defines.

`d-studio.scd` ships with this template — the SynthDefs `tracks/velvet/`
depends on (`dbass`, `dkick`, `dkeys`, `dstrings`, `dpluck`, `dwhite`, and a
few more). Trim it down, replace it, or add alongside it; nothing here is
required by `tracks/hello/`, which uses only stock SuperDirt samples and
`@d-studio-labs/synths`' `dstudiopad`.

// ── Pad → arpeggio: a driving, metallic ostinato, not a sustained wash ──
// Every version of a sustained pad here read as a horror drone, key or
// filter notwithstanding — the actual reference is Terminator's score (Brad
// Fiedel): a fast, repeating, slightly metallic synth arpeggio that drives
// WITH the rhythm section rather than sitting as atmosphere behind it. That
// also just fits a kick-driven track better — rhythmic, not textural.
// Root and fifth only, not a full triad — a real triad arpeggio reads as a
// generic synthwave lick. Terminator's ostinato is starker: root/fifth
// movement ("power chord" territory), strong and cold rather than sweet
// (major third) or scary (minor third). Fast and dry, no reverb wash to blur
// it; a moderate-high filter for the metallic edge.
import { note } from '@strudel/core'
import { drift } from '@d-studio-labs/core/mod'

export const pad = note('<c2 g2 c2 g2>*8').sound('padlong').lpf(drift(900, 1800, 51)).gain(0.16).late(0.5)

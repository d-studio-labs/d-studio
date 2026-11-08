// d-studio modules: per-event effects SuperDirt runs after the sound.
// Loaded by startup.scd before the project's synths/ (d-studio.scd).
//
// lpf with a filter envelope, like the browser: .lpf(300).lpenv(3).lpdecay(0.15)
// opens the filter lpenv octaves above the cutoff and lets it close over lpdecay.
// SuperDirt's own lpf ignores lpenv, so this replaces it (same name, same place
// in the chain). Without lpenv & co it's SuperDirt's plain lpf, unchanged.
(
var numChannels = ~dirt.numChannels;

SynthDef("dirt_lpf_env" ++ numChannels, { |out, cutoff = 440, resonance = 0, lpenv = 1, lpattack = 0.005, lpdecay = 0.14, lpsustain = 0|
	var signal = In.ar(out, numChannels);
	// the envelope in octaves above the cutoff, so the cutoff itself can move while
	// the note plays (live knobs on held keys) and the envelope rides on top
	var up = lpenv.abs, span = 2 ** up;
	// negative lpenv flips it, as in superdough: starts open, dips to the cutoff.
	// The sustain level is a fraction of the way in Hz, as before
	var flip = lpenv < 0;
	var held = Select.kr(flip, [(1 + ((span - 1) * lpsustain)).log2, (span + ((1 - span) * lpsustain)).log2]);
	var octaves = EnvGen.kr(Env([flip * up, (1 - flip) * up, held], [lpattack, lpdecay]));
	var freq = cutoff.lag(0.05).abs.clip(20, 20000) * (2 ** octaves);
	signal = RLPF.ar(signal, freq.clip(20, SampleRate.ir / 2), resonance.linexp(0, 1, 1, 0.001));
	ReplaceOut.ar(out, signal)
}, [\ir, \kr, \kr, \ir, \ir, \ir, \ir]).add;

~dirt.addModule('lpf', { |dirtEvent|
	if (~lpenv.isNil and: { ~lpattack.isNil } and: { ~lpdecay.isNil } and: { ~lpsustain.isNil }) {
		dirtEvent.sendSynth("dirt_lpf" ++ ~numChannels, [cutoff: ~cutoff, resonance: ~resonance, out: ~out])
	} {
		// superdough's defaults (getADSRValues): only lpenv → 5 ms up, 140 ms down to the cutoff;
		// only lpattack → stays open; otherwise closes fully unless lpsustain says so
		var attack = max(~lpattack ? 0.005, 0.001);
		var decay = max(~lpdecay ? 0.14, 0.001);
		var sustainLevel = ~lpsustain ?? { if (~lpattack.notNil and: { ~lpdecay.isNil }) { 1 } { 0 } };
		dirtEvent.sendSynth("dirt_lpf_env" ++ ~numChannels, [
			cutoff: ~cutoff, resonance: ~resonance, lpenv: ~lpenv ? 1,
			lpattack: attack, lpdecay: decay, lpsustain: sustainLevel.clip(0, 1),
			out: ~out
		])
	}
}, { ~cutoff.notNil });

// The shared drive curve: a gain-compensated tanh soft-clip, exactly dry at
// amount 0 (so turning it up never lurches in from silence or a level jump),
// with a low-pass after the clip to tame the harmonics it adds. One
// definition, so every sound that wants this color — superdirt/drive.scd's
// per-orbit send, or a synth with its own drive built in — reaches for the
// same curve instead of hand-rolling .tanh again.
// (loadSynthDefs runs this file inside a throwaway (dirt: ...).use Event, so a
// plain ~name would vanish with it: topEnvironment is what drive.scd can reach)
topEnvironment[\dstudioDrive] = { |sig, amount = 0, tone = 1, lpf = 0|
	var a = amount.clip(0, 1);
	var k = 1 + (a * 11);
	var shaped = (sig * k).tanh / k;
	var cutoff = tone.clip(0, 1).linexp(0, 1, 1500, 9000);
	var clipped = LPF.ar(shaped, cutoff);
	// lpf in Hz after the clip (0 = off), 24 dB/oct: keeps only the lows the clip
	// thickened, as a low-pass after an amp does (the rumble's Auto Filter)
	var filtered = Select.ar(lpf > 0, [clipped, BLowPass4.ar(clipped, lpf.clip(20, 2000), 0.6)]);
	sig + ((filtered - sig) * a)
};
)

// dstudiopad: a warm detuned-saw unison pad.
// Four saws spread around the root, their detune drifting slowly and
// smoothly (LFNoise2, not a periodic LFO) — organic motion with no regular
// pulse to it, unlike sc3-plugins' super* synths (their built-in LFOs are
// what read as "EBM"/stuttering when used for a sustained pad). Brightness
// scales with pitch (a low-passed sum of 4 saws gets harsh up high
// otherwise). sustain is in seconds, same as every SuperDirt synth: the
// whole envelope's length, not a 0-1 fraction.
(
SynthDef(\dstudiopad, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.15|
	var env = EnvGen.ar(Env.linen(0.05, 0.9, 0.05, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var wobble = LFNoise2.kr(0.3 ! 4).range(-0.08, 0.08);
	var sound = Mix(Saw.ar(f * ([-1, -0.33, 0.33, 1] * detune + wobble).midiratio)) * 0.25;
	sound = LPF.ar(sound, (f * 6).clip(200, 8000));
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;
)

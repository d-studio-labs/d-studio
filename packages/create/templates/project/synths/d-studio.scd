// d-studio synths — core UGens only, so they work without sc3-plugins
// (SuperDirt's own supersaw needs SawDPW from sc3-plugins). Loaded by startup.scd.
//
// SuperDirt conventions: `sustain` is the whole note length in seconds and frees
// the synth (set it from patterns with .legato), `freq` comes from note/midinote,
// output goes through DirtPan. Shape the amplitude from patterns with
// .attack/.release (SuperDirt's envelope module), filter with .lpf/.hpf.

(
// dsaw: five detuned saws — dub bass and chord stabs. detune in semitones (±)
SynthDef(\dsaw, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.2|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var sound = Mix(Saw.ar(f * ([-1, -0.5, 0, 0.5, 1] * detune).midiratio)) * 0.2;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dpad: string-ish pad — four saws with a slow ensemble wobble, low-passed by pitch
SynthDef(\dpad, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.15|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var wobble = LFNoise2.kr(0.3 ! 4).range(-0.08, 0.08);
	var sound = Mix(Saw.ar(f * ([-1, -0.33, 0.33, 1] * detune + wobble).midiratio)) * 0.25;
	sound = LPF.ar(sound, (f * 6).clip(200, 8000));
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dpadsweep: dpad through a resonant low-pass swept by a slow sine inside the
// note. The peak lifts each harmonic as it passes, so a held note sings a line up
// and down its own overtones (C: C G C E G B♭ …) without any notes written.
// Each note's sweep starts at the bottom, dark, and opens. Don't add .lpf: it
// would cut off the harmonics the sweep reaches.
//   voice      centre of the sweep, in harmonics of the note (4 = two octaves up)
//   lprate     sweeps per second (0.1 = one up and down in 10 s)
//   lpdepth    octaves above and below the centre
//   resonance  0 smooth … 1 singing (.lpq)
SynthDef(\dpadsweep, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.15, voice = 4, lprate = 0.1, lpdepth = 1.5, resonance = 0.6|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var wobble = LFNoise2.kr(0.3 ! 4).range(-0.08, 0.08);
	var sound = Mix(Saw.ar(f * ([-1, -0.33, 0.33, 1] * detune + wobble).midiratio)) * 0.25;
	var sweep = SinOsc.kr(lprate, -0.5pi) * lpdepth;
	var rq = resonance.clip(0, 1).linexp(0, 1, 1, 0.05);
	// dpad's own softness first: the saws low-passed at the 6th harmonic, so no buzz
	// reaches the sweep, which sings softer as it climbs past it
	sound = LPF.ar(sound, (f * 6).clip(200, 8000));
	// the peak's gain grows as rq shrinks: ×√rq keeps it in line. No drive: the
	// tanh only catches the loudest peaks, it stays clean below them
	sound = RLPF.ar(sound, (f * voice * (2 ** sweep)).clip(40, 12000), rq) * rq.sqrt;
	sound = (sound * 0.5).tanh;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dchord: Juno-style chord voice, the Basic Channel stab. A saw plus two copies
// drifting slowly around it (ensemble chorus) over a square an octave down.
// No filter of its own: shape it with .lpf().lpenv().lpdecay() (d-modules.scd),
// the "tock" is the filter closing fast.
//   detune  chorus depth in semitones   chorus  level of the drifting copies
//   voice   sub-octave square level
SynthDef(\dchord, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.12, chorus = 0.7, voice = 0.4|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var drift = SinOsc.kr([0.53, 0.71], [0, 0.5pi]) * detune;   // two slow, unrelated rates
	var saws = Saw.ar(f) + (Mix(Saw.ar(f * drift.midiratio)) * chorus);
	var sub = Pulse.ar(f / 2, 0.5) * voice;
	var sound = ((saws * 0.5 + sub) * 0.5).tanh * 0.7;   // soft clip: a little analog push
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dsuper: binaural poly voice, after the UDO Super 6. The voice is stereo from the
// oscillators on: each ear has its own saw and pulse, detuned the opposite way
// to the other ear's (left saw up, right saw down, the pulses the reverse) and
// drifting on its own, so the width comes from the voice itself, not a chorus
// added after. A square an octave down sits in the middle under both.
// No filter of its own: .lpf() filters each ear separately (d-modules.scd).
//   detune  semitones between the ears   spread  0 both ears the same (mono) … 1 fully apart
//   voice   sub-octave level             pw, pwrate  pulse width (0.5 square) and its wobble in Hz
SynthDef(\dsuper, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.12, spread = 1, voice = 0.3, pw = 0.5, pwrate = 0.4|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	// one ear: +1 left, −1 right. Each ear's oscillators drift at their own slow rates
	var ear = { |side|
		var drift = LFNoise2.kr([0.21, 0.17] * (1 + (side * 0.1))).range(-0.04, 0.04);
		var width = (pw + (SinOsc.kr(pwrate, side * 0.5pi) * 0.15)).clip(0.1, 0.9);
		Saw.ar(f * ((side * detune / 2) + drift[0]).midiratio)
		+ Pulse.ar(f * ((side.neg * detune / 3) + drift[1]).midiratio, width)
	};
	var l = ear.(1), r = ear.(-1);
	var sub = Pulse.ar(f / 2, 0.5) * voice;
	var both = spread.clip(0, 1) * 0.5 + 0.5;
	var sound = [(l * both) + (r * (1 - both)), (r * both) + (l * (1 - both))] + sub;
	sound = (sound * 0.35).tanh * 0.8;   // soft clip: a little analog push
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dsub: sustained sine sub, felt more than heard. voice adds the 2nd harmonic and
// a little saturation, so it still shows on small speakers (0 = pure sine).
// Glide into the note from penv semitones away over pdecay seconds (like dkick).
// 10 ms in, 40 ms out: no clicks; longer fades with .attack/.release
SynthDef(\dsub, { |out, sustain = 1, pan, freq = 65, speed = 1, accelerate = 0, voice = 0.15, penv = 0, pdecay = 0.08|
	var env = EnvGen.ar(Env([0, 1, 1, 0], [0.01, (sustain - 0.05).max(0), 0.04], \sin), doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain) * EnvGen.kr(Env([penv.midiratio, 1], [pdecay], \exp));
	var sound = SinOsc.ar(f) + (SinOsc.ar(f * 2) * voice * 0.5);
	sound = (sound * (1 + voice)).tanh / (1 + voice).tanh * 0.5;   // same peak, any voice
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dkick: sine kick with a pitch drop: the deep, round dub techno heartbeat.
// Pitch from note (g1 ≈ 49 Hz sits under a C-minor bass), tail from sustain
// (set with .legato), drop of penv semitones over pdecay seconds.
SynthDef(\dkick, { |out, sustain = 0.4, pan, freq = 49, penv = 24, pdecay = 0.05|
	var amp = EnvGen.ar(Env.perc(0.003, sustain, curve: -5), doneAction: 2);
	var pitch = freq * EnvGen.ar(Env([penv.midiratio, 1], [pdecay], \exp));
	var body = SinOsc.ar(pitch, 0.5pi);
	var thump = LPF.ar(WhiteNoise.ar, 1200) * EnvGen.ar(Env.perc(0.001, 0.012)) * 0.15;
	var sound = ((body + thump) * 1.4).tanh * 0.6;   // soft clip: rounder, a little warmth
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, amp));
}).add;

// dbd: one-piece analog kick, after the TR machines' bass drum circuit (the
// TR-1000's isn't in Dirt-Samples or the drum-machine map). Click, body and sub
// tail all come from one sine, and all of it goes through the same saturation,
// so it hits as one sound rather than layers.
// Pitch from note. The sine starts up to an octave (click) above the sweep and
// drops there in 4 ms with a low noise thump (the beater), then falls penv
// semitones over pdecay seconds onto the note, settling half a semitone over the tail.
// body: the tail's level after the hit (0 a short thud, 1 a held sub, as loud as
// the hit). The tail holds for the note (.legato) and cuts in its last 30 ms.
// drive squeezes hit and tail together (and adds harmonics small speakers can
// play); tone low-passes the result, steeply: low tone keeps it dark, not buzzy. Each hit varies a hair, as analog does.
// Not attack/release/hold: those switch on SuperDirt's envelope module.
SynthDef(\dbd, { |out, sustain = 0.5, pan, freq = 44, penv = 20, pdecay = 0.06, click = 0.3, body = 0.5, drive = 0.25, tone = 2500|
	var hit = 0.07, cut = 0.03;
	var amp = EnvGen.ar(Env([0, 1, body, body * 0.8, 0], [0.0005, hit, (sustain - hit - cut).max(0.001), cut], [0, -3, -1, -4]), doneAction: 2);
	var pitch = EnvGen.ar(Env([(penv + (click * 12)).midiratio, penv.midiratio, 1, -0.5.midiratio], [0.004, pdecay, sustain], \exp));
	var sine = SinOsc.ar(freq * Rand(-0.05, 0.05).midiratio * pitch, 0.5pi);
	var tick = LPF.ar(WhiteNoise.ar, 1200) * EnvGen.ar(Env.perc(0.001, 0.012)) * click * 0.4;
	var k = 1 + (drive * 3);
	var sound = ((sine + tick) * amp * k).tanh / k.tanh;
	sound = HPF.ar(BLowPass4.ar(sound, tone.clip(200, 18000), 0.8), 25);
	Out.ar(out, DirtPan.ar(sound * 0.5 * Rand(0.97, 1), ~dirt.numChannels, pan));
}).add;

// dhiss: tape hiss, a flat bed. Separate noise in every channel (wide, no pan),
// in the 1.5–12 kHz band. Fades in and out over a fifth of its length (sine,
// equal power), so notes at legato 1.25 crossfade with no change in level.
SynthDef(\dhiss, { |out, sustain = 1|
	var fade = sustain / 5;
	var env = EnvGen.ar(Env.linen(fade, sustain - (2 * fade), fade, 1, \sin), doneAction: 2);
	var sound = BLowPass.ar(BHiPass.ar(WhiteNoise.ar(0.1 ! ~dirt.numChannels), 1500), 12000);
	Out.ar(out, sound * env);
}).add;

// dclick: a tiny tick: a burst of noise through a band-pass at freq (note).
// Length from sustain (set it with a short .legato): 0.01 s ticks, 0.05 s knocks
SynthDef(\dclick, { |out, sustain = 0.03, pan, freq = 3000|
	var env = EnvGen.ar(Env.perc(0.0005, sustain.clip(0.003, 0.2), 1, -8), doneAction: 2);
	var sound = BPF.ar(WhiteNoise.ar, freq.clip(200, 12000), 0.3) * 2;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dbrown / dwhite: plain noise, for waves and foam
SynthDef(\dbrown, { |out, sustain = 1, pan|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	Out.ar(out, DirtPan.ar(BrownNoise.ar(0.25), ~dirt.numChannels, pan, env));
}).add;

SynthDef(\dwhite, { |out, sustain = 1, pan|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	Out.ar(out, DirtPan.ar(WhiteNoise.ar(0.1), ~dirt.numChannels, pan, env));
}).add;

// dstrings: string machine (Solina-ish). Three detuned saws plus an octave,
// through a three-voice ensemble chorus (slow + fast wobbling delay lines, spread
// wide), low-passed by pitch: voice 0–1 = darker–brighter. Long notes: fade
// with .attack/.release
SynthDef(\dstrings, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, detune = 0.07, voice = 0.4|
	var bright = 2 + (voice.clip(0, 1) * 8);
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var dry = (Mix(Saw.ar(f * ([-1, 0, 1] * detune).midiratio)) * 0.3) + (Saw.ar(f * 2) * 0.12);
	var phases = [0, 2pi / 3, 4pi / 3];
	var lfo = (SinOsc.kr(0.6, phases) * 0.0022) + (SinOsc.kr(6.1, phases) * 0.0003) + 0.008;
	var sound = LPF.ar(DelayC.ar(dry, 0.02, lfo), (f * bright).clip(300, 9000));
	Out.ar(out, DirtPan.ar(sound * 0.6, ~dirt.numChannels, pan, env));
}).add;

// dkeys: FM electric piano. A 1:1 body whose brightness falls fast after the hit,
// a short bark two octaves up, decaying over ~3.5 s like a tine, a soft tremolo.
// voice 0–2 = how hard the key is hit (0.5 mellow, 1 Rhodes, 1.6 Wurli-ish bark)
SynthDef(\dkeys, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, voice = 1|
	var gate = EnvGen.ar(Env([0, 1, 1, 0], [0.002, sustain, 0.12]), doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var decay = EnvGen.ar(Env.perc(0.001, 3.5, 1, -6));
	var index = (EnvGen.ar(Env.perc(0.001, 0.6, 1, -4)) * 2.2 * voice) + 0.35;
	var body = SinOsc.ar(f, SinOsc.ar(f) * index);
	var bark = SinOsc.ar(f * 4.01, SinOsc.ar(f * 14) * voice) * EnvGen.ar(Env.perc(0.0005, 0.12)) * 0.12 * voice;
	var sound = (body + bark) * decay * SinOsc.kr(4.3).range(0.85, 1);
	sound = (sound * 1.4).tanh * 0.5;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, gate));
}).add;

// dbass: deep house bass. A sine sub plus voice × a saw/pulse blend for the
// growl (0 = pure sub). No filter of its own: pluck it with .lpf().lpenv().lpdecay()
// like dchord, the sine stays under any cutoff. 5 ms in, 25 ms out
SynthDef(\dbass, { |out, sustain = 0.3, pan, freq = 55, speed = 1, accelerate = 0, voice = 0.5|
	var env = EnvGen.ar(Env([0, 1, 1, 0], [0.005, (sustain - 0.03).max(0.01), 0.025]), doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var top = (Saw.ar(f) * 0.5) + (Pulse.ar(f, 0.4) * 0.3);
	var sound = (((SinOsc.ar(f) * 0.8) + (top * voice)) * 1.3).tanh * 0.6;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dpluck: plucked string (Karplus-Strong): a burst of noise ringing in a delay
// line tuned to the note. Rings for the note's length (.legato), voice 0–1 = brighter
SynthDef(\dpluck, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, voice = 0.6|
	var gate = EnvGen.ar(Env([1, 1, 0], [sustain, 0.08]), doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var sound = Pluck.ar(PinkNoise.ar, Impulse.kr(0), 0.05, f.reciprocal, sustain.max(0.2), 1 - voice.clip(0, 0.95));
	sound = LPF.ar(LeakDC.ar(sound), 7000) * 0.8;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, gate));
}).add;

// dtape: a chord voice off a worn cassette. Two slightly detuned saws, softly
// low-passed, over a sine; wow (slow pitch sway, in step for notes struck
// together) and flutter, then gentle saturation. voice 0–1 = how worn
// (0.5 ≈ ±12 cents of wow, and darker)
SynthDef(\dtape, { |out, sustain = 1, pan, freq = 440, speed = 1, accelerate = 0, voice = 0.5|
	var env = EnvGen.ar(Env.linen(0.002, 0.996, 0.002, 1, -3), timeScale: sustain, doneAction: 2);
	var wow = SinOsc.kr(0.37) * voice * 0.25;
	var flutter = SinOsc.kr(6.1) * voice * 0.03;
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain) * (wow + flutter).midiratio;
	var saws = LPF.ar(Saw.ar(f * [0.998, 1.002]), (f * (4 - (voice * 2))).clip(100, 6000));
	var sound = (((saws * 0.5) + (SinOsc.ar(f) * 0.4)) * 1.6).tanh * 0.5;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, env));
}).add;

// dbox: music box tine. A sine with two inharmonic partials (2.76× and 5.4×,
// like a plucked metal comb tooth) that die faster than the fundamental, which
// rings ~2.5 s: give it a long .legato. voice 0–1 = how metallic
SynthDef(\dbox, { |out, sustain = 1, pan, freq = 880, speed = 1, accelerate = 0, voice = 0.5|
	var gate = EnvGen.ar(Env([1, 1, 0], [sustain, 0.05]), doneAction: 2);
	var f = freq * DirtFreqScale.kr(speed, accelerate, sustain);
	var ring = EnvGen.ar(Env.perc(0.001, 2.5, 1, -5));
	var partials = (SinOsc.ar(f * 2.76) * EnvGen.ar(Env.perc(0.001, 0.6, 1, -6)) * 0.5)
		+ (SinOsc.ar(f * 5.4) * EnvGen.ar(Env.perc(0.0005, 0.2, 1, -6)) * 0.3);
	var sound = (SinOsc.ar(f) + (partials * voice)) * ring * 0.4;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, gate));
}).add;

// dcrackle: vinyl surface. Crackle (sparse dust, high-passed, wandering in
// level) and a few soft pops, separate in every channel. Fades like dhiss, so
// notes at legato 1.25 crossfade into one steady bed. density = crackles per second
SynthDef(\dcrackle, { |out, sustain = 1, density = 8|
	var n = ~dirt.numChannels, fade = sustain / 5;
	var env = EnvGen.ar(Env.linen(fade, sustain - (2 * fade), fade, 1, \sin), doneAction: 2);
	var crackle = HPF.ar(Dust2.ar(density ! n), 2000) * LFNoise1.kr(0.7 ! n).range(0.2, 1);
	var pops = LPF.ar(Decay2.ar(Dust.ar(0.3 ! n), 0.0005, 0.006) * WhiteNoise.ar(1 ! n), 3000) * 0.6;
	Out.ar(out, (crackle * 0.5 + pops) * env);
}).add;
)

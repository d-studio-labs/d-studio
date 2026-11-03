// Ambisonics (ATK). Loaded by startup.scd after master.scd.
//
// SuperDirt's delay, with the echoes optionally placed in 3D around the listener
// instead of left/right. Per event, on the orbit's delay like delaytime:
//   .space(1)     the echoes go into the sphere (0 = SuperDirt's stereo delay, unchanged)
//   .azim(0.25)   where, in turns: 0 front · 0.25 left · 0.5 behind · −0.25 right
//   .spin(1/8)    turns per cycle the echoes circle (+ = front → left → behind → right)
//   .elev(0.05)   up, in turns: 0 ear level · 0.25 overhead
//   .glide(2)     seconds a change of space/sphere/width/azim/elev takes (default 0.3)
//   .delayfreq(420) .delaywidth(4)   a band-pass on the echoes, in the feedback loop
//                 (centre Hz, 0 = off; band in octaves), each repeat thinner than the last
//   .delayroom(1)  the echoes into the reverb too, each repeat blooming into the room
//                 (0 = side by side, SuperDirt's way)
//   .delaydiffuse(0.6) .delayspread(0.5) .delaywander(0.3)   each repeat smeared more
//                 than the last, the ears apart, the time drifting: echoes that wander
//                 the room with no direction (0 = off)
//   .drylevel(0.5)  the dry sound's level, live, the echoes and room still fed at
//                 full (1 = as played, 0 = only its echoes and room)
// Only the echoes move: the dry sound stays where .pan put it.
//
// And a whole orbit, dry sound and reverb together, for a sound with no echoes
// to move (a pad): its stereo image laid round the listener and turned with the
// same azim/spin/elev, plus:
//   .sphere(1)    how much of the orbit goes into the sphere (0 = stereo, unchanged)
//   .width(0.25)  half the image's width, in turns: 0.25 = left at 90° left, right
//                 at 90° right; 0.08 ≈ ±30°, narrow enough to move as one
//   .roll(1/32)   turns per cycle over the head: behind → overhead → front → under
//                 the chin → behind, one way only (spin turns it round the sides)
// One decoder for the whole sphere feeds the master bus, so the glue, limiter,
// meter and `npm run export` hear it like everything else.
// Like every SuperDirt delay setting, an orbit keeps the last value it was sent.
//
//   DIRT_SPACE=binaural npm run dirt   headphones (default): HRTF, front/behind/above
//   DIRT_SPACE=stereo npm run dirt     speakers: a plain stereo decode, no HRTF
//   DIRT_SPACE=off npm run dirt        SuperDirt's own delay, ATK not touched
(
var dirt = ~dirt, server = ~dirt.server, n = ~dirt.numChannels;
var mode = "DIRT_SPACE".getenv ?? "binaural";

if (mode == "off" or: { \FoaPanB.asClass.isNil }) {
	if (mode != "off") { "SPACE: off — ATK not installed (Quarks.install(\"atk-sc3\"))".postln } { "SPACE: off".postln };
} {
	var ambiBus = Bus.audio(server, 4);   // first-order B-format: W X Y Z
	var decoder = if (mode == "stereo") {
		FoaDecoderMatrix.newStereo
	} {
		// CIPIC subject 21: the KEMAR dummy head, the neutral choice
		FoaDecoderKernel.newCIPIC(21, server)
	};
	var switchDelay = \SwitchDelay.asClass;

	// SuperDirt's dirt_delay (core-synths-global.scd) as it is, plus the way out
	// into the sphere. space 0 sends everything to the orbit, as before
	SynthDef("dirt_delay" ++ n, { |dryBus, effectBus, gate = 1, delaytime, delayfeedback, delaySend = 1, delayAmp = 1, lock = 0, cps = 1,
		cycle = 0, space = 0, azim = 0, spin = 0, elev = 0, glide = 0.3, delayfreq = 0, delaywidth = 4, delayroom = 0,
		delaydiffuse = 0, delayspread = 0, delaywander = 0, drylevel = 1|
		var echoes, copy, env, angle, spun, inSphere, inRoom, stereo, own, banded, dryFix, maxDelayTime = 4;
		var input = In.ar(dryBus, n);
		// the dry sound as the notes left it, before the delay's send scales `input`
		var dry = input;
		delaytime = (delaytime * if(lock, reciprocal(cps), 1)).clip(0, maxDelayTime);
		// our own echo loop, for what SuperDirt's delay can't do. Each control 0 = off;
		// with all of them off, SuperDirt's delay plays as it was.
		// delayfreq, delaywidth: the dub echo (Ableton Delay's filter), a band-pass
		// inside the loop, so every repeat comes back thinner than the last; the
		// centre in Hz and the band in octaves.
		// delaydiffuse (0–1): four short allpasses in each ear inside the loop, so
		// every repeat is smeared a little more than the last: an echo at first, a
		// wash with no edges and no direction a few repeats on.
		// delayspread (0–1): the ears' echoes come back up to 25 ms apart, one
		// early, one late: wide without pointing anywhere.
		// delaywander (0–1): each ear's time drifts slowly, up to 6 ms, as tape
		// does, so the repeats never sit still.
		// The loop's own block of latency (LocalIn) is taken off the delay, and so is
		// roughly what the allpasses add, so the repeats stay in time
		banded = { |in|
			var loop = LocalIn.ar(n);
			var diffuse = delaydiffuse.clip(0, 1);
			var offsets = ([-0.5, 0.5].wrapExtend(n)) * delayspread.clip(0, 1) * 0.025;
			var wobble = { LFNoise2.kr(0.2) }.dup(n) * delaywander.clip(0, 1) * 0.006;
			var times = (delaytime + offsets + wobble - ControlDur.ir - (diffuse * 0.008)).clip(0.001, maxDelayTime);
			var wet = DelayC.ar(in + loop, maxDelayTime, times);
			var smeared;
			wet = (BBandPass.ar(wet, delayfreq.clip(20, 18000), delaywidth.clip(0.1, 10)) * (delayfreq > 0)) + (wet * (delayfreq <= 0));
			// different allpass lengths in each ear, so the two smear apart
			smeared = wet.collect { |x, i|
				[[0.0031, 0.0047, 0.0073, 0.0113], [0.0037, 0.0053, 0.0067, 0.0127]].wrapAt(i).do { |d|
					x = AllpassC.ar(x, 0.02, d, d * log(0.001) / log(0.6))
				};
				x
			};
			wet = (wet * (1 - diffuse)) + (smeared * diffuse);
			LocalOut.ar(wet * delayfeedback.clip(0, 0.99));
			wet
		};
		own = ((delayfreq > 0) + (delaydiffuse > 0) + (delayspread > 0) + (delaywander > 0)) > 0;
		// the echoes alone, and the copy of the dry sound SuperDirt's SwitchDelay
		// puts out with them (its own dry level of 1), kept apart so only the echoes can go
		// into the reverb. Together they're what the delay always sent
		# echoes, copy = if (switchDelay.notNil) {
			input = input * delaySend.lag(LFNoise1.kr(1).range(0.01, 0.02));
			[(switchDelay.ar(input, 0, 1, delaytime, delayfeedback.max(0), maxDelayTime) * (1 - own)) + (banded.(input) * own), input]
		} {
			var fb = delayfeedback.clip(0, 0.99);
			[(LeakDC.ar(CombL.ar(input, maxDelayTime, delaytime.lag(1), (log2(-60.dbamp) / log2(fb) * delaytime).clip(0, 20))) * (1 - own)) + (banded.(input) * own), 0]
		};
		env = EnvGen.kr(Env.asr, gate, doneAction: 2) * delayAmp.lag(0.01);
		echoes = echoes * env;
		copy = copy * env;
		// drylevel: the dry sound's own level on the orbit, live (×1 = as played; 0
		// = only its echoes, spring and room). A channel fader with the sends before
		// it: the delay, spring and room still hear the notes at full level, only
		// what reaches the speakers directly changes. Done by adding the difference
		// on the effect bus, which the monitor sums with the dry bus
		dryFix = dry * (drylevel.clip(0, 20).lag(0.05) - 1);
		DirtPause.ar(echoes + copy + dryFix, graceTime: 4);
		// where the echoes are: azim plus spin turns per cycle, in radians. Like the
		// sphere's, the spin follows the music: each event resets it to spin × cycle
		// turns. A new azim glides over `glide` seconds instead of jumping
		spun = Phasor.kr(Changed.kr(cycle), spin * cps * 2pi * ControlDur.ir, 0, 2pi, (spin * cycle).frac * 2pi);
		angle = (azim.lag(glide) * 2pi) + spun;
		// into and out of the sphere over `glide` too: a ringing echo never jumps
		inSphere = space.lag(glide);
		// echoes into the reverb (dub's echo into the room: each repeat blooms and
		// sinks further off as it fades). delayroom 0 = side by side, as SuperDirt
		// has them; 1 = all the stereo echoes go round through the room. They go out
		// on the dry bus, which the reverb (next in the chain) reads and the monitor
		// plays, so they're heard once either way. Echoes in the sphere stay out of it
		inRoom = delayroom.clip(0, 1).lag(glide);
		stereo = echoes * (1 - inSphere);
		Out.ar(effectBus, (copy * (1 - inSphere)) + (stereo * (1 - inRoom)) + dryFix);
		Out.ar(dryBus, stereo * inRoom);
		Out.ar(ambiBus, FoaPanB.ar(Mix(echoes + copy) * inSphere * 0.7071, angle, elev.lag(glide) * 2pi));
	}, [\ir, \ir]).add;

	// the whole orbit into the sphere: just before dirt_monitor, after the duck,
	// so the kick's dips reach it. sphere 0 leaves both buses as they were
	SynthDef("dirt_sphere" ++ n, { |dryBus, effectBus, gate = 1, cps = 1, cycle = 0, sphere = 0, width = 0.25, azim = 0, spin = 0, roll = 0, elev = 0, glide = 0.3|
		var amount = sphere.lag(glide);
		var dry = In.ar(dryBus, n), wet = In.ar(effectBus, n);
		var sig = (dry + wet) * amount, half = width.lag(glide) * 2pi;
		// spin and roll follow the music, not the clock: every event resets them to
		// where the cycle it plays at says (spin × cycle turns), and they run on at
		// spin/roll turns per cycle until the next. So cycle 0 is always azim/elev,
		// and a roll of 1/32 is back there every 32 cycles, however the play started
		var onEvent = Changed.kr(cycle);
		var spun = Phasor.kr(onEvent, spin * cps * 2pi * ControlDur.ir, 0, 2pi, (spin * cycle).frac * 2pi);
		var rolled = Phasor.kr(onEvent, roll * cps * 2pi * ControlDur.ir, 0, 2pi, (roll * cycle).frac * 2pi);
		// round the vertical axis: azim plus spin
		var turn = (azim.lag(glide) * 2pi) + spun;
		// round the ear-to-ear axis. ATK's tumble tips the front up for + angles, so
		// roll counts down: the back rises first (behind → overhead → front)
		var over = (elev.lag(glide) * 2pi) - rolled;
		// left and right at ±width, facing front, then turned, then rolled
		var b = FoaPanB.ar(sig[0], half, 0) + FoaPanB.ar(sig[1], half.neg, 0);
		EnvGen.kr(Env.asr(0, 1, 0.01), gate, doneAction: 2);
		b = FoaTumble.ar(FoaRotate.ar(b, turn), over);
		Out.ar(ambiBus, b);
		ReplaceOut.ar(dryBus, dry * (1 - amount));
		ReplaceOut.ar(effectBus, wet * (1 - amount));
	}).add;

	// the decoder: the whole sphere to stereo, into the master bus
	server.sync;   // the HRTF kernels load into buffers first
	SynthDef(\dstudio_space, { |in, out|
		Out.ar(out, FoaDecode.ar(In.ar(in, 4), decoder));
	}).add;
	server.sync;
	~dstudioSpace = Synth.before(~dstudioMaster, \dstudio_space, [in: ambiBus.index, out: ~dstudioMasterBus.index]);

	// the orbits' delay learns the new controls, the sphere stage goes in just
	// before the monitor, and the chain is rebuilt (setting outBus rebuilds it)
	dirt.orbits.do { |orbit|
		var fx = orbit.globalEffects.reject { |x| x.name == \dirt_sphere }.collect { |x|
			if (x.name == \dirt_delay) {
				GlobalDirtEffect(\dirt_delay, [\delaytime, \delayfeedback, \delaySend, \delayAmp, \lock, \cps, \cycle, \space, \azim, \spin, \elev, \glide, \delayfreq, \delaywidth, \delayroom, \delaydiffuse, \delayspread, \delaywander, \drylevel])
			} { x }
		};
		orbit.globalEffects = fx.insert(fx.size - 1, GlobalDirtEffect(\dirt_sphere, [\cps, \cycle, \sphere, \width, \azim, \spin, \roll, \elev, \glide]).alwaysRun_(true));
		orbit.outBus = orbit.outBus;
	};

	"SPACE: % · .space (delay) .sphere .width .roll (orbit) .azim .spin .elev".format(if (mode == "stereo") { "stereo decode" } { "binaural (CIPIC 21)" }).postln;
};
)

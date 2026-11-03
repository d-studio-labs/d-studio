// Spring reverb. Loaded by startup.scd after space.scd; works with any
// DIRT_SPACE (no ATK needed).
//
// The dub spring (a Space Echo's, King Tubby's): the drippy, metallic splash
// after a hit. Per event, on the orbit like room:
//   .spring(0.4)       how much of the orbit goes into the springs (0 = off: the
//                      effect sleeps and nothing changes)
//   .springdecay(2)    seconds the tail takes to die away (to −60 dB)
//   .springtone(0.5)   0 dark … 1 bright (the low-pass in the springs, 1.5–6 kHz)
// Like room, an orbit keeps the last value it was sent.
//
// Where it sits: after the delay, before the room. It reads the dry bus, so it
// hears the dry sound (after the note's own lpf/hpf/gain) and, with
// .delayroom > 0, the echoes too. Its tail goes out beside the room's, not into
// it, then through the duck (the kick dips it) and the sphere (.sphere(1) places it).
//
// How it's made: three springs of different lengths (left, right, and one in
// both), each a feedback loop. In each loop the sound goes through a chain of 40
// stretched allpass filters: they hold the highs back longer than the lows, so
// every pass comes out smeared into a rising chirp, the spring's "drip" (as in
// Välimäki, Parker & Abel's spring models). A band-pass in the loop makes each
// pass darker and thinner, as a real spring's tail is.
(
var dirt = ~dirt, n = ~dirt.numChannels;

SynthDef("dirt_spring" ++ n, { |dryBus, effectBus, gate = 1, spring = 0, springdecay = 2, springtone = 0.5|
	// each spring: the seconds one trip along it takes, and the allpasses' stretch
	// in samples (more = a longer, lower drip). Unrelated lengths, so the three
	// never flutter in step
	var springs = [[0.037, 7], [0.043, 9], [0.051, 8]];
	var input = In.ar(dryBus, n).asArray.sum * spring.clip(0, 1).lag(0.02);
	var bright = springtone.clip(0, 1).linexp(0, 1, 1500, 6000);
	var loops = LocalIn.ar(springs.size);
	var outs, left, right;
	// a spring tank's narrow band: no deep lows to boom, no air
	input = LPF.ar(HPF.ar(input, 150), 5000);
	outs = springs.collect { |s, i|
		var trip = s[0], stretch = s[1] * SampleDur.ir;
		// the feedback that dies to −60 dB after springdecay seconds
		var fb = 0.001 ** (trip / springdecay.clip(0.1, 10));
		var x = input + (loops[i] * fb);
		// the dispersion: a negative decay time gives the allpass a negative
		// coefficient (0.6), so the highs come out later than the lows: rising chirps
		40.do { x = AllpassN.ar(x, 0.001, stretch, (stretch * log(0.001) / log(0.6)).neg) };
		x = LPF.ar(HPF.ar(x, 100), bright);
		// the trip along the spring, less the loop's own block of latency
		DelayC.ar(x, 0.1, trip - ControlDur.ir)
	};
	LocalOut.ar(outs);
	left = outs[0] + (outs[2] * 0.5);
	right = outs[1] + (outs[2] * 0.5);
	outs = [left, right] * 0.5 * EnvGen.kr(Env.asr, gate, doneAction: 2);
	// sleep when nothing's coming through, like SuperDirt's room
	DirtPause.ar(outs, graceTime: 4);
	Out.ar(effectBus, if (n == 2) { outs } { (left + right * 0.25) ! n });
}, [\ir, \ir]).add;

// into every orbit's chain just after the delay (so the echoes can reach it)
// and before the room, then rebuild the chain (setting outBus rebuilds it)
dirt.server.sync;
dirt.orbits.do { |orbit|
	var fx = orbit.globalEffects.reject { |x| x.name == \dirt_spring };
	var at = fx.detectIndex { |x| x.name == \dirt_delay } ?? { -1 };
	orbit.globalEffects = fx.insert(at + 1, GlobalDirtEffect(\dirt_spring, [\spring, \springdecay, \springtone]));
	orbit.outBus = orbit.outBus;
};

"SPRING: .spring .springdecay .springtone".postln;
)

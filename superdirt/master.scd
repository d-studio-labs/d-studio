// Master bus + kick ducking. Loaded by startup.scd once SuperDirt is up.
//
// Every orbit → glue compressor → tape warmth → limiter (−1 dB) → speakers,
// and a meter in this pane every 3 s while something plays:
//   master  peak −7.2 dB · ≈ −15.8 LUFS            (· limiting 1.3 dB when it works)
// LUFS here is an estimate (K-weighted, ~3 s average, no gating): close enough
// to compare against a reference, not for mastering.
//
// Ducking, like the browser's: a sound with .duckorbit("3:5") dips orbits 3 and 5
// as it plays (their delay and reverb tails too), then lets them back in.
//   .duckdepth(0.15)   how deep (0–1, as in superdough: gain → 1 − √depth)
//   .duckattack(0.2)   seconds to come back      .duckonset(0)   seconds to go down
//
//   DIRT_METER=0 npm run dirt     no meter lines
(
var dirt = ~dirt, server = ~dirt.server;
var n = dirt.numChannels, numOrbits = dirt.orbits.size;
var masterBus = Bus.audio(server, n);
var duckBus = Bus.audio(server, numOrbits);   // one duck amount per orbit, summed per block
var ceiling = -1.dbamp;
var parse = { |v| v.asString.split($ ).reject(_.isEmpty).collect(_.asFloat) };   // "3 5" or 3.0
var peakPre = 0, peakPost = 0, loudness = -inf;

SynthDef(\dstudio_master, { |in, out = 0|
	var sig = In.ar(in, n);
	var pre, k, send = Impulse.kr(4), reset = Delay1.kr(send);   // reset after sending
	// glue: 2:1 above −18 dB, 10 ms attack so the kick's hit gets through, 150 ms release
	sig = Compander.ar(sig, Mix(sig) / n, -18.dbamp, 1, 0.5, 0.01, 0.15);
	// tape warmth: unity for quiet signals, rounds off only the peaks
	sig = (sig * 1.25).tanh / 1.25;
	pre = sig;
	sig = Limiter.ar(sig, ceiling, 0.005);
	// meter: peaks before and after the limiter, K-weighted mean square (≈ LUFS)
	k = BHiShelf.ar(BHiPass.ar(pre, 38, 2), 1500, 1, 4);
	SendReply.kr(send, '/dstudio/meter', [
		Peak.ar(pre.abs.reduce(\max), reset),
		Peak.ar(sig.abs.reduce(\max), reset),
		Mix(Lag.ar(k.squared, 1.5)),
	]);
	Out.ar(out, sig);
}).add;

// one per orbit, just before its output: scales the dry sound and the effect
// returns by whatever the ducks wrote into this orbit's duck bus
SynthDef(("dirt_duck" ++ n).asSymbol, { |dryBus, effectBus, orbitIndex, gate = 1|
	var gain = 1 - In.ar(duckBus.index + orbitIndex).clip(0, 0.99);
	EnvGen.kr(Env.asr(0, 1, 0.01), gate, doneAction: 2);
	ReplaceOut.ar(dryBus, In.ar(dryBus, n) * gain);
	ReplaceOut.ar(effectBus, In.ar(effectBus, n) * gain);
}).add;

// one per duck: down to 1 − √depth over onset, back up over attack (superdough's curve)
SynthDef(\dstudio_duckenv, { |bus, depth = 1, onset = 0, attack = 0.1|
	var floor = (1 - depth.clip(0, 1).sqrt).clip(0.01, 1);
	var gain = EnvGen.ar(Env([1, floor, 1], [onset.max(0.002), attack.max(0.002)], \exp), doneAction: 2);
	Out.ar(bus, 1 - gain);
}).add;

server.sync;

// route every orbit into the master bus, with a duck stage before its output
dirt.orbits.do { |orbit|
	var fx = orbit.globalEffects.reject { |x| x.name == \dirt_duck };
	orbit.globalEffects = fx.insert(fx.size - 1, GlobalDirtEffect(\dirt_duck, []).alwaysRun_(true));
	orbit.outBus = masterBus.index;   // rebuilds the orbit's effect chain
};
// after SuperDirt's group, so it hears every orbit
~dstudioMaster = Synth.tail(server.defaultGroup, \dstudio_master, [in: masterBus.index, out: 0]);
// space.scd decodes the ambisonic echoes into it
~dstudioMasterBus = masterBus;

// the duck module runs inside the event's bundle: the dip lands with the sound
dirt.addModule('duck', { |dirtEvent|
	var onsets = parse.(~duckonset ? 0), attacks = parse.(~duckattack ? 0.1), depths = parse.(~duckdepth ? 1);
	parse.(~duckorbit).do { |target, i|
		target = target.asInteger;
		if (target >= 0 and: { target < numOrbits }) {
			server.sendMsg(\s_new, \dstudio_duckenv, -1, 0, dirt.group,
				\bus, duckBus.index + target,
				\onset, onsets[i] ?? { onsets[0] }, \attack, attacks[i] ?? { attacks[0] },
				\depth, depths[i] ?? { depths[0] })
		}
	}
}, { ~duckorbit.notNil });

OSCdef(\dstudioMeter, { |msg|
	peakPre = max(peakPre, msg[3]);
	peakPost = max(peakPost, msg[4]);
	loudness = -0.691 + (10 * msg[5].max(1e-12).log10);
}, '/dstudio/meter');

if ("DIRT_METER".getenv != "0") {
	{
		loop {
			3.wait;
			if (peakPost > 0.0003) {   // quiet below −70 dB: don't print over silence
				"master  peak % dB · ≈ % LUFS%".format(
					peakPost.ampdb.round(0.1), loudness.round(0.1),
					if (peakPre > ceiling) { " · limiting % dB".format((peakPre.ampdb + 1).round(0.1)) } { "" }
				).postln;
			};
			peakPre = 0; peakPost = 0;
		}
	}.fork(SystemClock);
};

"MASTER: glue · tape · limiter −1 dB · ducking (.duckorbit)".postln;
)

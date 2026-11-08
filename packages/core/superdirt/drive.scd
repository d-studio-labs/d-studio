// Drive. Loaded by startup.scd after spring.scd.
//
// A gain-compensated soft-clip send (lib/fx.js's `~dstudioDrive`, packages/synths/d-modules.scd),
// so any sound can reach for the same grit without its synth needing drive
// built in. Per event, on the orbit like spring:
//   .drive(0.4)       how hard the clip bites (0 = off: the effect sleeps and
//                      nothing changes)
//   .drivetone(0.5)   the low-pass after the clip: 0 dark … 1 bright (1.5–9 kHz)
// Like room, an orbit keeps the last value it was sent.
//
// Where it sits: right after the delay, before the spring and room — so the
// delay's repeats (and, with .delayroom, the room) come out already driven,
// a pedal before the reverb rather than after. Reads the dry bus, writes the
// driven difference onto the effect bus, so below .drive(0) the orbit is
// untouched exactly, not just quieter.
(
var dirt = ~dirt, n = ~dirt.numChannels;

SynthDef("dirt_drive" ++ n, { |dryBus, effectBus, gate = 1, drive = 0, drivetone = 1|
	var dry = In.ar(dryBus, n);
	var amount = drive.clip(0, 1).lag(0.05);
	var shaped = ~dstudioDrive.(dry, amount, drivetone);
	var wet = shaped - dry;
	EnvGen.kr(Env.asr, gate, doneAction: 2);
	// sleep when nothing's coming through, like SuperDirt's room
	DirtPause.ar(wet, graceTime: 4);
	Out.ar(effectBus, wet);
}).add;

// into every orbit's chain just after the delay (so the echoes can reach it),
// before the spring and room, then rebuild the chain (setting outBus rebuilds it)
dirt.server.sync;
dirt.orbits.do { |orbit|
	var fx = orbit.globalEffects.reject { |x| x.name == \dirt_drive };
	var at = fx.detectIndex { |x| x.name == \dirt_delay } ?? { -1 };
	orbit.globalEffects = fx.insert(at + 1, GlobalDirtEffect(\dirt_drive, [\drive, \drivetone]));
	orbit.outBus = orbit.outBus;
};

"DRIVE: .drive .drivetone".postln;
)

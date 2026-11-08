// Drive. Loaded by startup.scd after spring.scd.
//
// A gain-compensated soft-clip send (topEnvironment[\dstudioDrive], packages/synths/d-modules.scd),
// so any sound can reach for the same grit without its synth needing drive
// built in. Per event, on the orbit like spring:
//   .drive(0.4)       how hard the clip bites (0 = off: the effect sleeps and
//                      nothing changes)
//   .drivetone(0.5)   the low-pass after the clip: 0 dark … 1 bright (1.5–9 kHz)
//   .drivelpf(97)     a 24 dB/oct low-pass after the clip, in Hz (0 = off), like
//                      the filter after an amp: only the lows the clip thickened
//                      are left. Only while .drive is above 0
// Like room, an orbit keeps the last value it was sent.
//
// Where it sits: right after the delay, before the spring and room — so the
// delay's repeats (and, with .delayroom, the room) come out already driven,
// a pedal before the reverb rather than after. Reads the dry bus, writes the
// driven difference onto the effect bus, so below .drive(0) the orbit is
// untouched exactly, not just quieter.
(
var dirt = ~dirt, n = ~dirt.numChannels;

SynthDef("dirt_drive" ++ n, { |dryBus, effectBus, gate = 1, drive = 0, drivetone = 1, drivelpf = 0|
	var dry = In.ar(dryBus, n);
	var amount = drive.clip(0, 1).lag(0.05);
	var shaped = topEnvironment[\dstudioDrive].(dry, amount, drivetone, drivelpf);
	var wet = shaped - dry;
	EnvGen.kr(Env.asr, gate, doneAction: 2);
	// sleep when nothing's coming through, like SuperDirt's room
	DirtPause.ar(wet, graceTime: 4);
	Out.ar(effectBus, wet);
}).add;

// into every orbit's chain just after the delay (so the echoes can reach it),
// before the spring and room, then rebuild the chain (setting outBus rebuilds it).
// A rebuild plays a fresh paused copy of every effect and only *releases* the old
// ones (0.2 s), so across 16 orbits two generations of spring/room/delay coexist
// and the server runs out of RT memory (the "alloc failed" flood). Free the old
// synths first, so only one generation is ever alive.
dirt.server.sync;
dirt.orbits.do { |orbit| orbit.globalEffects.do { |x| x.synth !? { |s| s.free } } };
dirt.server.sync;
dirt.orbits.do { |orbit|
	var fx = orbit.globalEffects.reject { |x| x.name == \dirt_drive };
	var at = fx.detectIndex { |x| x.name == \dirt_delay } ?? { -1 };
	orbit.globalEffects = fx.insert(at + 1, GlobalDirtEffect(\dirt_drive, [\drive, \drivetone, \drivelpf]));
	orbit.outBus = orbit.outBus;
};

"DRIVE: .drive .drivetone .drivelpf".postln;
)

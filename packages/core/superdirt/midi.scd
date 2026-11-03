// Live keys from the engine → SuperDirt, with note-offs. Loaded by startup.scd.
// The engine reads the controller (engine/midi.mjs) and picks the sound from the
// part a track wraps in midi() (lib/midi.js); this side plays and releases:
//
//   /dstudio/key/on id k v k v …   like /dirt/play, and remembers the note by id
//   /dstudio/key/off id            fades that note out over its fadeTime
//   /dstudio/key/set id k v …      changes a held note (filters, pan, amp: knobs)
//
// A note is a SuperDirt synth group: its gate synth fades out and frees the group
// when cut_gate drops to 0 (the same switch SuperDirt's cut groups use). The delay
// and reverb tails keep ringing, as with any note.
(
var dirt = ~dirt;
var latency = 0.02;                       // just enough for scsynth to start on time
var playing = IdentityDictionary.new;     // id → synth group

OSCdef(\dstudioKeyOn, { |msg|
	var event = (latency: latency).putPairs(msg[2..]);
	DirtEvent(dirt.orbits @@ (event[\orbit] ? 0), dirt.modules, event).play;
	event[\synthGroup] !? { |group| playing[msg[1].asInteger] = group };
}, '/dstudio/key/on').permanent_(true);

OSCdef(\dstudioKeyOff, { |msg|
	playing.removeAt(msg[1].asInteger) !? { |group|
		// same latency as the note-on, so a very short tap still finds its group.
		// /error -1: no complaint if the note already ended on its own
		dirt.server.sendBundle(latency, ["/error", -1], ["/n_set", group, "cut_gate", 0]);
	};
}, '/dstudio/key/off').permanent_(true);

// n_set on the group reaches every synth in it: the sound, its filters, the gate (amp)
OSCdef(\dstudioKeySet, { |msg|
	playing[msg[1].asInteger] !? { |group|
		dirt.server.sendBundle(latency, ["/error", -1], ["/n_set", group] ++ msg[2..]);
	};
}, '/dstudio/key/set').permanent_(true);

"KEYS: ready (npm run play reads the controller)".postln;
)

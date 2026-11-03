// Headless SuperDirt: `npm run dirt` (sclang runs this file, no IDE).
// Listens for /dirt/play on UDP 57120. Ctrl-C to quit.
//
// DIRT_DEVICE="MacBook Air Speakers" npm run dirt   ← pin the output device
// (default: macOS system output; restart after connecting AirPods)
// DIRT_IN_DEVICE="…" overrides the input picked for Bluetooth outputs
(
// Audio devices from system_profiler (sclang can't ask CoreAudio which one is the default)
var audio = {
	var devices = List[], cur;
	"system_profiler SPAudioDataType".unixCmdGetStdOut.split($\n).do { |line|
		// device headers are indented 8 spaces and end with ":"
		if (line.beginsWith("        ") and: { line[8] != $  } and: { line.endsWith(":") }) {
			cur = (name: line.stripWhiteSpace.drop(-1));
			devices.add(cur);
		} {
			cur !? {
				if (line.contains("Default Output Device: Yes")) { cur[\defaultOut] = true };
				if (line.contains("Output Channels")) { cur[\output] = true };
				if (line.contains("Input Channels")) { cur[\input] = true };
				if (line.contains("Transport: Bluetooth")) { cur[\bluetooth] = true };
			}
		}
	};
	devices
}.value;
var outName = "DIRT_DEVICE".getenv ?? { audio.detect { |d| d[\defaultOut] == true } !? { |d| d[\name] } };
var bluetooth = audio.any { |d| d[\name] == outName and: { d[\output] == true } and: { d[\bluetooth] == true } };
// scsynth opens the default input even with 0 input channels. If that's a
// Bluetooth headset's mic, macOS switches it to headset mode (24 kHz, distorted,
// pitched down). So with Bluetooth output, name both devices and take the input
// from a built-in mic instead.
var device = "DIRT_DEVICE".getenv ?? { if (bluetooth) { outName } };
var inDevice = "DIRT_IN_DEVICE".getenv ?? {
	if (bluetooth) { audio.detect { |d| d[\input] == true and: { d[\bluetooth] != true } } !? { |d| d[\name] } }
};
// this file's folder (npm scripts run from the project root, hence the fallback)
var here = thisProcess.nowExecutingPath !? { |p| p.dirname } ?? { File.getcwd +/+ "superdirt" };
// the project: the folder the npm scripts run from, with your synths/ and samples/
var project = File.getcwd;

s.options.numBuffers = 1024 * 256;   // room for Dirt-Samples
s.options.memSize = 8192 * 32;       // delay/reverb buffers
s.options.numWireBufs = 2048;
s.options.maxNodes = 1024 * 32;
s.options.sampleRate = nil;          // follow the device: forcing a rate it can't do pitch-shifts everything
s.options.numOutputBusChannels = 2;  // raise for stems (BlackHole 16ch)
s.options.numInputBusChannels = 0;   // no mic → no macOS permission prompt
if (device.notNil) { s.options.outDevice = device };
if (inDevice.notNil and: { device.notNil }) { s.options.inDevice = inDevice };

s.waitForBoot {
	~dirt = SuperDirt(2, s);
	// @d-studio-labs/synths (the shared SynthDefs, a sibling package under the same
	// @d-studio-labs scope — ../../synths from here, in the monorepo or a real install
	// alike), then the project's own synths (synths/*.scd). SuperDirt's extras
	// (supersaw…) only load when sc3-plugins is installed.
	if (File.exists(here +/+ "../../synths")) { ~dirt.loadSynthDefs(here +/+ "../../synths") };
	if (File.exists(project +/+ "synths")) { ~dirt.loadSynthDefs(project +/+ "synths") };
	~dirt.loadSoundFiles;
	// drum machines from `npm run samples`: one folder per sound, e.g. RolandTR909_bd
	if (File.exists(project +/+ "samples")) { ~dirt.loadSoundFiles(project +/+ "samples/*") };
	s.sync;
	~dirt.start(57120, 0 ! 16);        // 16 orbits (lantern-ambient uses 14)
	(here +/+ "master.scd").load;    // master bus, meter, kick ducking
	(here +/+ "space.scd").load;     // ambisonics (ATK): .space .sphere .azim .spin .elev
	(here +/+ "spring.scd").load;    // spring reverb: .spring .springdecay .springtone
	(here +/+ "midi.scd").load;      // live keys from the engine, with note-offs
	(here +/+ "record.scd").load;    // npm run export: records the master

	// a second sclang (old pane, the IDE) steals 57120 and this one moves on:
	// messages would land nowhere, silently
	if (NetAddr.langPort != 57120) {
		"WARNING: listening on % instead of 57120 — another sclang is running (pgrep -l sclang)"
		.format(NetAddr.langPort).postln;
	};
	if (s.sampleRate < 44100) {
		"WARNING: % Hz — Bluetooth headset mode (something is using the AirPods mic). Reconnect them and restart."
		.format(s.sampleRate).postln;
	};
	"SUPERDIRT READY · port % · % Hz · out: % · in: %"
	.format(NetAddr.langPort, s.sampleRate, s.options.outDevice ? "system default", s.options.inDevice ? "same").postln;
};
)

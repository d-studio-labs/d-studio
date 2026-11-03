// Export: records the master (after the limiter) while a track plays.
// Loaded by startup.scd; driven by `npm run export -- <track>` (engine/export.mjs).
//
//   /dstudio/record/start <path> <unix time>   the file starts at that moment (a timed
//       bundle, the same clock as /dirt/play), replies /dstudio/record/started when armed
//   /dstudio/record/stop           replies /dstudio/record/stopped once it's written and closed
// 24-bit WAV at the server's sample rate, 2 channels.
(
var server = ~dirt.server;
var recorder = Recorder(server).recHeaderFormat_("wav").recSampleFormat_("int24");

OSCdef(\dstudioRecordStart, { |msg, time, addr|
	var path = msg[1].asString, at = msg[2].asString.asFloat;
	fork {
		if (recorder.isRecording) { recorder.stopRecording; server.sync };
		recorder.prepareForRecord(path, ~dirt.numChannels);
		server.sync;
		// at the tail of the root node: after SuperDirt's group and the master
		server.makeBundle(at - Date.getDate.rawSeconds, { recorder.record(path, 0, ~dirt.numChannels) });
		"RECORD  %".format(path).postln;
		addr.sendMsg('/dstudio/record/started', server.sampleRate);
	}
}, '/dstudio/record/start');

OSCdef(\dstudioRecordStop, { |msg, time, addr|
	fork {
		if (recorder.isRecording) { recorder.stopRecording };
		server.sync;
		addr.sendMsg('/dstudio/record/stopped');
	}
}, '/dstudio/record/stop');

"RECORD: npm run export -- <track>".postln;
)

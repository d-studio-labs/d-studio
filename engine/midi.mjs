// MIDI in for the engine: every connected controller, rescanned every 2 s so it
// can be plugged in after the start. Turns raw bytes into note on/off and CC.
import midi from '@julusian/midi'

/**
 * Listen to every MIDI input.
 *
 * @param {{
 *   onNoteOn: (key: number, velocity: number, channel: number) => void,
 *   onNoteOff: (key: number, channel: number) => void,
 *   onCC: (n: number, value: number, channel: number) => void,
 *   log: (line: string) => void,
 * }} handlers velocity and value are 0–127, channel 1–16
 * @returns {() => void} closes every port
 */
export const listen = ({ onNoteOn, onNoteOff, onCC, log }) => {
  const scanner = new midi.Input()
  const open = new Map()
  const handle = (_delta, [status, a, b]) => {
    const type = status & 0xf0
    const channel = (status & 0x0f) + 1
    // some keyboards send a note-off as a note-on with velocity 0
    if (type === 0x90 && b > 0) onNoteOn(a, b, channel)
    else if (type === 0x80 || type === 0x90) onNoteOff(a, channel)
    else if (type === 0xb0) onCC(a, b, channel)
  }
  const scan = () => {
    const names = Array.from({ length: scanner.getPortCount() }, (_, i) => scanner.getPortName(i))
    for (const [name, input] of open) {
      if (names.includes(name)) continue
      input.closePort()
      open.delete(name)
      log(`MIDI ✗ ${name}`)
    }
    names.forEach((name, i) => {
      if (open.has(name)) return
      const input = new midi.Input()
      input.on('message', handle)
      input.openPort(i)
      open.set(name, input)
      log(`MIDI ✓ ${name}`)
    })
  }
  scan()
  if (!open.size) log('MIDI: nothing plugged in yet')
  const timer = setInterval(scan, 2000)
  return () => {
    clearInterval(timer)
    for (const input of open.values()) input.closePort()
    scanner.closePort()
  }
}

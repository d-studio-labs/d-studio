// Minimal OSC 1.0 encoder over UDP — just what SuperDirt needs.
// Strings are NUL-terminated and padded to 4 bytes; numbers go as big-endian f32.
import dgram from 'node:dgram'

const str = (v) => {
  const b = Buffer.alloc(Math.ceil((Buffer.byteLength(v) + 1) / 4) * 4)
  b.write(v)
  return b
}
const f32 = (v) => {
  const b = Buffer.alloc(4)
  b.writeFloatBE(v)
  return b
}
const isNum = (a) => typeof a === 'number'

/**
 * Encode an OSC message: an object goes as key, value, key, value…; an array as positional args.
 *
 * @example
 * message('/dirt/play', { s: 'bd', n: 0 })
 * message('/dstudio/record/start', ['/tmp/a.wav'])
 * @param {string} address
 * @param {Record<string, number | string> | (number | string)[]} [params]
 * @returns {Buffer}
 */
export const message = (address, params = []) => {
  const args = Array.isArray(params) ? params : Object.entries(params).flat()
  const tags = ',' + args.map((a) => (isNum(a) ? 'f' : 's')).join('')
  return Buffer.concat([str(address), str(tags), ...args.map((a) => (isNum(a) ? f32(a) : str(String(a))))])
}

// NTP time tag: seconds since 1900 + 32-bit fraction
const NTP_EPOCH = 2208988800
const timetag = (unixSeconds) => {
  const b = Buffer.alloc(8)
  const s = Math.floor(unixSeconds)
  b.writeUInt32BE(s + NTP_EPOCH, 0)
  b.writeUInt32BE(Math.floor((unixSeconds - s) * 2 ** 32) >>> 0, 4)
  return b
}

/**
 * Wrap a message in a timestamped bundle: SuperDirt plays it at that time, not on arrival.
 *
 * @param {number} unixSeconds
 * @param {Buffer} msg from {@link message}
 * @returns {Buffer}
 */
export const bundle = (unixSeconds, msg) => {
  const size = Buffer.alloc(4)
  size.writeInt32BE(msg.length)
  return Buffer.concat([str('#bundle'), timetag(unixSeconds), size, msg])
}

const readStr = (buf, at) => {
  const end = buf.indexOf(0, at)
  return [buf.toString('utf8', at, end), Math.ceil((end + 1) / 4) * 4]
}
/**
 * Decode a plain OSC message with f/i/s args, enough for SuperDirt's replies.
 *
 * @param {Buffer} buf
 * @returns {{ address: string, args: (number | string)[] }}
 */
export const decode = (buf) => {
  const [address, afterAddress] = readStr(buf, 0)
  const [tags, afterTags] = readStr(buf, afterAddress)
  const args = []
  let at = afterTags
  for (const t of tags.slice(1)) {
    if (t === 'f' || t === 'i') {
      args.push(t === 'f' ? buf.readFloatBE(at) : buf.readInt32BE(at))
      at += 4
    } else if (t === 's') {
      const [s, next] = readStr(buf, at)
      args.push(s)
      at = next
    }
  }
  return { address, args }
}

/**
 * A UDP socket to SuperDirt; replies come back to this socket's port.
 *
 * @param {string} [host]
 * @param {number} [port]
 * @returns {{
 *   send: (buf: Buffer) => void,
 *   onMessage: (cb: (msg: { address: string, args: (number | string)[] }) => void) => void,
 *   close: () => void,
 * }}
 */
export const udp = (host = '127.0.0.1', port = 57120) => {
  const sock = dgram.createSocket('udp4')
  let open = true
  return {
    send: (buf) => sock.send(buf, port, host),
    onMessage: (cb) => sock.on('message', (buf) => cb(decode(buf))),
    // Ctrl-C under npm can arrive twice: only the first one closes
    close: () => open && ((open = false), sock.close()),
  }
}

// Smoke test for headless SuperDirt, no Strudel: `npm run ping [-- hh 3 | supersaw note=-12]`
// Timestamped 100 ms ahead like the engine, so SuperDirt doesn't print "late".
import { message, bundle, udp } from './osc.mjs'

const args = process.argv.slice(2)
const positional = args.filter((a) => !a.includes('='))
const [s = 'bd', n = '0'] = positional
const extra = Object.fromEntries(
  args
    .filter((a) => a.includes('='))
    .map((a) => {
      const [k, v] = a.split('=')
      return [k, Number.isNaN(Number(v)) ? v : Number(v)]
    }),
)
const params = { s, n: Number(n), orbit: 0, cps: 116 / 60 / 4, ...extra }

const dirt = udp()
dirt.send(bundle(Date.now() / 1000 + 0.1, message('/dirt/play', params)))
console.log(
  `sent /dirt/play ${Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')} → 127.0.0.1:57120`,
)
console.log('silent? check the `npm run dirt` pane for SUPERDIRT READY and the port it printed')
setTimeout(dirt.close, 50)

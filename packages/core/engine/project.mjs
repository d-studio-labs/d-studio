// ── The project: the folder the npm scripts run from (where its package.json is) ──
// Your music lives there, not in the engine: tracks/, synths/, samples/, exports/.
import { pathToFileURL } from 'node:url'

/** The project folder, as a file URL ending in a slash. */
export const PROJECT = pathToFileURL(process.cwd() + '/')

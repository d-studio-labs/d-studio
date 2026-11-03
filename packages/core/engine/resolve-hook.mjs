// Point Node at each package's ESM "module" build, like Vite, and pass the
// parent's ?v= down to project imports so a save re-evaluates the whole track.
/**
 * Node module resolve hook (see node:module register).
 *
 * @param {string} specifier
 * @param {{ parentURL?: string }} context
 * @param {(specifier: string, context: object) => Promise<{ url: string }>} next
 * @returns {Promise<{ url: string }>}
 */
export async function resolve(specifier, context, next) {
  if (specifier === '@kabelsalat/web') {
    return next('@kabelsalat/web/dist/index.mjs', context)
  }
  const result = await next(specifier, context)
  const v = context.parentURL && new URL(context.parentURL).searchParams.get('v')
  if (v && result.url.startsWith('file:') && !result.url.includes('/node_modules/')) {
    const url = new URL(result.url)
    url.searchParams.set('v', v)
    return { ...result, url: url.href }
  }
  return result
}

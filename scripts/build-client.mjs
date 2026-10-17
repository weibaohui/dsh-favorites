/**
 * Build `client/bundle.js` from `client/index.js`.
 *
 * Follows the client-modules bundle protocol:
 * `window.__ModuleLoader__.load({ id, factory })` registers a lazy CommonJS
 * factory that receives a `require` resolving platform modules (react,
 * `@deepseek-ai/dsh-client-ui-primitives`). The client source has zero npm
 * dependencies (the fork graph is hand-rolled SVG), so — like dsh-tasks —
 * this build wraps the source verbatim instead of running a bundler; the
 * factory's `var React` binding satisfies the source's `require("react")`.
 *
 * Run: `npm run build:client`
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const sourcePath = join(here, '..', 'client', 'index.js')
const bundlePath = join(here, '..', 'client', 'bundle.js')

const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'))

const source = readFileSync(sourcePath, 'utf8')

const banner = `/* Generated from client/index.js by scripts/build-client.mjs — do not edit by hand.
 * Regenerate with: npm run build:client
 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    var React = require("react")
`

const footer = `
    return module.exports
  }
})
`

// The source requires react through the factory's `require`; the `var React`
// above additionally seeds the loader's React binding. Indent the wrapped
// body uniformly so the artifact stays diffable.
const indented = source
  .split('\n')
  .map((line) => (line.length === 0 ? '' : '    ' + line))
  .join('\n')

const out = banner + indented + footer
writeFileSync(bundlePath, out)
const kb = Math.round(Buffer.byteLength(out) / 1024)
console.log(`client/bundle.js written (${kb} KB)`)

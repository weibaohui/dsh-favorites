/**
 * Boot-level contract test for the client bundle: load `client/bundle.js`
 * through a stub ModuleLoader, run `apply` against a mock client ctx, and
 * assert the slot registrations, locale registration, service attach, and
 * first data load — the wiring the real loader performs.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const bundlePath = join(here, '..', 'client', 'bundle.js')

/** Minimal React shim (same spirit as the client source's own fallback). */
const reactShim = {
  createElement(type, props, ...kids) {
    return { type, props: props || {}, kids: kids.flat(9).filter((k) => k !== null && k !== undefined && k !== false && k !== true) }
  },
  useState(init) { const v = [typeof init === 'function' ? init() : init]; return [v[0], () => {}] },
  useEffect() {},
  useMemo(fn) { return fn() },
  useRef(v = null) { return { current: v } },
}

function loadBundle({ pkgName }) {
  const registrations = [] // { slotName, spec }
  const injectCalls = [] // service names requested dynamically
  const localeRegistered = []
  const effects = [] // { name, cleanup }

  const requireFromLoader = (name) => {
    if (name === 'react') return reactShim
    // Platform primitives may be absent — the client must degrade, not die.
    throw new Error('module not available: ' + name)
  }

  let loaded = null
  globalThis.window = {
    __ModuleLoader__: {
      load({ id, factory }) {
        assert.equal(id, pkgName, 'bundle id must equal the package name (client half pairing)')
        loaded = factory(requireFromLoader)
      },
    },
  }
  const bundleSource = readFileSync(bundlePath, 'utf8')
  new Function('window', bundleSource)(globalThis.window)
  assert.ok(loaded, 'the bundle registered itself with the ModuleLoader')

  const slotsMock = {
    inject(slotName, declare) {
      injectCalls.push(slotName)
      const gen = declare()
      if (gen && typeof gen[Symbol.iterator] === 'function') {
        for (const spec of gen) registrations.push({ slotName, spec })
      }
      return () => {}
    },
    register(spec) {
      registrations.push({ slotName: spec.name, spec })
      return () => {}
    },
  }
  const ctx = {
    get(name) { return name === 'slots' ? slotsMock : undefined },
    inject(names, cb) { injectCalls.push(names.join(',')); void cb },
    effect(fn, name) { effects.push({ name, cleanup: fn }) },
    logger: { info() {}, warn() {}, error() {} },
    locale: {
      register(ns, lang, table) { localeRegistered.push([ns, lang, table]) },
      bind() { return (key, vars) => key },
    },
  }

  loaded.apply(ctx)

  return { loaded, registrations, injectCalls, localeRegistered, effects, slotsMock }
}

test('bundle protocol: id equals the package name and apply exposes the loader face', () => {
  const pkg = require('../package.json')
  const { loaded } = loadBundle({ pkgName: pkg.name })
  assert.equal(loaded.name, pkg.name)
  assert.deepEqual(loaded.inject, ['slots', 'locale'])
})

test('apply registers the row menu item, row star, panellist icon, and main panel', () => {
  const { registrations, injectCalls } = loadBundle({ pkgName: '@weibaohui/dsh-favorites' })
  const names = registrations.map((r) => r.slotName)
  assert.ok(names.includes('sidebar.workspaces.session.menu.item'), 'menu item registered')
  assert.ok(names.includes('sidebar.workspaces.session.row.action'), 'row action registered')
  assert.ok(names.includes('sidebar.panellist'), 'sidebar icon row registered')
  assert.ok(names.includes('main'), 'main keyed panel registered')
  assert.ok(injectCalls.includes('sidebar.workspaces.session.menu.item'))
  assert.ok(injectCalls.includes('sidebar.workspaces.session.row.action'))
  assert.ok(injectCalls.includes('sidebar.panellist'))
  assert.ok(injectCalls.includes('main'))

  const menu = registrations.find((r) => r.slotName === 'sidebar.workspaces.session.menu.item' && r.spec.id)
  assert.equal(menu.spec.id, 'dsh-favorites.favorite')
  assert.equal(menu.spec.order, 500)
  const rowAction = registrations.find((r) => r.slotName === 'sidebar.workspaces.session.row.action' && r.spec.id)
  assert.equal(rowAction.spec.id, 'dsh-favorites.favorite')
  assert.equal(rowAction.spec.order, 250)
  assert.equal(typeof rowAction.spec.inject, 'function', 'row action carries its inject face factory')
  const face = rowAction.spec.inject()
  assert.ok(face.hooks && face.hooks.favorite, 'inject face exposes the favorite set hook')
  assert.equal(typeof face.toggleFavorite, 'function')
  const main = registrations.find((r) => r.slotName === 'main')
  assert.equal(main.spec.key, 'dsh-favorites', 'main key matches the panellist id')
})

test('apply registers zh + en locale tables and wires the cleanup effect', () => {
  const { localeRegistered, effects } = loadBundle({ pkgName: '@weibaohui/dsh-favorites' })
  const table = new Map(localeRegistered.map(([ns, lang]) => [ns + '/' + lang, true]))
  assert.ok(table.has('dsh-favorites/zh'))
  assert.ok(table.has('dsh-favorites/en'))
  assert.ok(effects.some((e) => e.name === 'dsh-favorites: slots'), 'slot cleanup effect registered')
  // The cleanup must be a registered function (runs disposers on unload).
  const slotEffect = effects.find((e) => e.name === 'dsh-favorites: slots')
  assert.equal(typeof slotEffect.cleanup, 'function')
  slotEffect.cleanup() // must not throw
})

test('first load pulls /state into the shared store', async () => {
  const originalFetch = globalThis.fetch
  let fetchUrl = null
  globalThis.fetch = (url) => {
    fetchUrl = String(url)
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ folders: [{ id: 'f-1', name: '研究' }], entries: [{ sessionId: 's-1', folderId: 'f-1', name: '', note: '', addedAt: '2026-10-17T00:00:00Z' }] }) })
  }
  try {
    const { loaded } = loadBundle({ pkgName: '@weibaohui/dsh-favorites' })
    await new Promise((resolve) => setTimeout(resolve, 10))
    const state = loaded.__internals.favStore.get()
    assert.equal(state.loaded, true)
    assert.equal(state.folders.length, 1)
    assert.equal(state.entries.length, 1)
    assert.equal(state.favSet.has('s-1'), true)
    assert.equal(fetchUrl, '/dsh-favorites/api/state')
  } finally {
    globalThis.fetch = originalFetch
  }
})

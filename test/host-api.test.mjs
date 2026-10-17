/**
 * Offline test suite for the Host half: schemas, input normalization,
 * folder-tree semantics, and the full HTTP API journey (barrier → dispatch
 * → storage) against a mock domain. Requires no harness services.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Host = require('../src/index.js')

const {
  LIMITS,
  MAX_BODY_BYTES,
  domainSpec,
  folderSchema,
  entrySchema,
  normalizeEntryInput,
  normalizeFolderInput,
  subtreeIds,
  moveCreatesCycle,
  createApiHandler,
} = Host.__internals

/** A memory table pair standing in for the storageDomain tables. */
function mockTables() {
  const make = () => {
    const rows = new Map()
    return {
      keys: () => [...rows.keys()],
      get: (key) => rows.get(key),
      put: (key, value) => { rows.set(key, value) },
      delete: (key) => { rows.delete(key) },
    }
  }
  return { folders: make(), entries: make() }
}

/** Drive one request through the handler and capture the response. */
async function call(handler, method, path, body) {
  const chunks = []
  const res = {
    headersSent: false,
    statusCode: 0,
    writeHead(status, headers) { res.headersSent = true; res.statusCode = status; res.headers = headers },
    end(payload) { chunks.push(payload == null ? '' : String(payload)) },
  }
  const req = {
    method,
    url: path,
    on(event, fn) {
      if (event === 'end') fn()
      if (event === 'data' && body !== undefined) fn(Buffer.from(JSON.stringify(body)))
    },
  }
  await handler(req, res)
  const text = chunks.join('')
  return { status: res.statusCode, body: text ? JSON.parse(text) : null }
}

function makeHandler(tables, rejectRequest) {
  return createApiHandler({
    whenReady: Promise.resolve(tables || mockTables()),
    rejectRequest,
  })
}

// ── schemas & domain spec ─────────────────────────────────────────────────

test('domain spec declares both tables with value schemas under dsh_favorites', () => {
  assert.equal(domainSpec.name, 'dsh_favorites')
  assert.equal(domainSpec.version, 1)
  assert.equal(typeof domainSpec.tables.folders.valueSchema, 'object')
  assert.equal(typeof domainSpec.tables.entries.valueSchema, 'object')
  // The open-time poison: a table without valueSchema kills the whole domain
  // on first stored record (dsh-matrix/dsh-fireworks lesson).
  assert.notEqual(domainSpec.tables.folders.valueSchema, undefined)
})

test('schemas accept the canonical records and tolerate future fields', () => {
  assert.equal(folderSchema.safeParse({ id: 'f-1', name: '研究' }).success, true)
  assert.equal(folderSchema.safeParse({ id: 'f-1', name: '研究', parentId: '', someFutureField: 1 }).success, true)
  assert.equal(folderSchema.safeParse({ name: 'no id' }).success, false)
  assert.equal(entrySchema.safeParse({ sessionId: 's-1' }).success, true)
  assert.equal(entrySchema.safeParse({ sessionId: 's-1', folderId: 'f-1', name: '别名', note: '备注', future: true }).success, true)
  assert.equal(entrySchema.safeParse({ name: 'no sessionId' }).success, false)
})

// ── input normalization ───────────────────────────────────────────────────

test('entry input requires a sessionId and clamps nothing silently', () => {
  assert.throws(() => normalizeEntryInput({}), /sessionId/)
  assert.throws(() => normalizeEntryInput({ sessionId: '  ' }), /sessionId/)
  assert.throws(() => normalizeEntryInput({ sessionId: 'x'.repeat(LIMITS.sessionId + 1) }), /too long/)
})

test('entry input keeps absent fields undefined and null clears them', () => {
  const patch = normalizeEntryInput({ sessionId: 's-1', folderId: 'f-1', name: null, note: 'hello' })
  assert.equal(patch.sessionId, 's-1')
  assert.equal(patch.folderId, 'f-1')
  assert.equal(patch.name, '')
  assert.equal(patch.note, 'hello')
  const minimal = normalizeEntryInput({ sessionId: 's-2' })
  assert.equal(minimal.folderId, undefined)
  assert.equal(minimal.name, undefined)
  assert.equal(minimal.note, undefined)
})

test('folder input requires a name; ids are optional or explicit', () => {
  assert.throws(() => normalizeFolderInput({}), /name/)
  assert.throws(() => normalizeFolderInput({ name: '' }), /name/)
  const create = normalizeFolderInput({ name: '研究' })
  assert.equal(create.name, '研究')
  assert.equal(create.id, undefined)
  const rename = normalizeFolderInput({ id: 'f-9', name: '写作', parentId: null })
  assert.equal(rename.id, 'f-9')
  assert.equal(rename.parentId, '')
})

// ── folder tree semantics ─────────────────────────────────────────────────

const TREE = [
  { id: 'a', name: 'A', parentId: '' },
  { id: 'b', name: 'B', parentId: 'a' },
  { id: 'c', name: 'C', parentId: 'b' },
  { id: 'd', name: 'D', parentId: '' },
]

test('subtree collects the whole nested chain', () => {
  const set = subtreeIds(TREE, 'a')
  assert.deepEqual([...set].sort(), ['a', 'b', 'c'])
  assert.deepEqual([...subtreeIds(TREE, 'd')].sort(), ['d'])
})

test('moving a folder under its own descendant is refused, siblings are fine', () => {
  assert.equal(moveCreatesCycle(TREE, 'a', 'c'), true)
  assert.equal(moveCreatesCycle(TREE, 'a', 'd'), false)
  assert.equal(moveCreatesCycle(TREE, 'd', ''), false)
})

// ── HTTP API journey ──────────────────────────────────────────────────────

test('trust barrier rejects every route before any storage touch', async () => {
  const tables = mockTables()
  const handler = makeHandler(tables, () => 401)
  for (const [method, path] of [
    ['GET', '/dsh-favorites/api/state'],
    ['PUT', '/dsh-favorites/api/entry'],
    ['DELETE', '/dsh-favorites/api/entry?sessionId=s-1'],
    ['PUT', '/dsh-favorites/api/folder'],
    ['DELETE', '/dsh-favorites/api/folder?id=f-1'],
  ]) {
    const { status } = await call(handler, method, path, {})
    assert.equal(status, 401, `${method} ${path} must be rejected by the barrier`)
  }
  assert.equal(tables.entries.keys().length, 0, 'no write may land behind a rejected barrier')
  assert.equal(tables.folders.keys().length, 0, 'no write may land behind a rejected barrier')
})

test('absent connection service lets requests through (host semantics)', async () => {
  const handler = makeHandler(null, undefined)
  const { status, body } = await call(handler, 'GET', '/dsh-favorites/api/state')
  assert.equal(status, 200)
  assert.deepEqual(body, { folders: [], entries: [] })
})

test('favorite upsert → state read-back → delete round trip', async () => {
  const tables = mockTables()
  const handler = makeHandler(tables)

  const put = await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-1', folderId: 'f-1', name: '别名', note: '要点' })
  assert.equal(put.status, 200)
  assert.equal(put.body.entry.addedAt.length > 0, true)

  // Second PUT with only sessionId: after a DELETE the record is gone, so a
  // re-favorite starts fresh (documented semantics — remove means remove).
  await call(handler, 'DELETE', '/dsh-favorites/api/entry?sessionId=s-1')
  await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-1' })
  let state = await call(handler, 'GET', '/dsh-favorites/api/state')
  assert.equal(state.body.entries.length, 1)
  assert.equal(state.body.entries[0].folderId, '')

  // Merge semantics: existing record + partial patch keeps other fields.
  await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-1', folderId: 'f-2', note: '新备注' })
  state = await call(handler, 'GET', '/dsh-favorites/api/state')
  const row = state.body.entries[0]
  assert.equal(row.folderId, 'f-2')
  assert.equal(row.note, '新备注')
  assert.equal(row.name, '')

  await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-1', name: null, note: null })
  state = await call(handler, 'GET', '/dsh-favorites/api/state')
  assert.equal(state.body.entries[0].name, '')

  const del = await call(handler, 'DELETE', '/dsh-favorites/api/entry?sessionId=s-1')
  assert.equal(del.status, 200)
  state = await call(handler, 'GET', '/dsh-favorites/api/state')
  assert.equal(state.body.entries.length, 0)
})

test('folder create → rename → nested move → cycle and parent checks', async () => {
  const tables = mockTables()
  const handler = makeHandler(tables)

  const created = await call(handler, 'PUT', '/dsh-favorites/api/folder', { name: '研究' })
  assert.equal(created.status, 200)
  const id = created.body.folder.id
  assert.equal(id.length > 2, true)

  const child = await call(handler, 'PUT', '/dsh-favorites/api/folder', { name: '子目录', parentId: id })
  const childId = child.body.folder.id

  const renamed = await call(handler, 'PUT', '/dsh-favorites/api/folder', { id, name: '研究合集' })
  assert.equal(renamed.body.folder.name, '研究合集')
  assert.equal(renamed.body.folder.parentId, '')

  // Unknown parent / unknown id → 404, not a silent create.
  assert.equal((await call(handler, 'PUT', '/dsh-favorites/api/folder', { name: 'x', parentId: 'missing' })).status, 404)
  assert.equal((await call(handler, 'PUT', '/dsh-favorites/api/folder', { id: 'missing', name: 'x' })).status, 404)

  // A parent move under its own child is a cycle.
  assert.equal((await call(handler, 'PUT', '/dsh-favorites/api/folder', { id, name: '研究合集', parentId: childId })).status, 400)
})

test('deleting a folder keeps every entry: subtree folders go, entries fall back to unfiled', async () => {
  const tables = mockTables()
  const handler = makeHandler(tables)

  const a = (await call(handler, 'PUT', '/dsh-favorites/api/folder', { name: 'A' })).body.folder.id
  const b = (await call(handler, 'PUT', '/dsh-favorites/api/folder', { name: 'B', parentId: a })).body.folder.id

  await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-1', folderId: a })
  await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-2', folderId: b })
  await call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-3', folderId: '' })

  const del = await call(handler, 'DELETE', `/dsh-favorites/api/folder?id=${a}`)
  assert.equal(del.status, 200)

  const state = await call(handler, 'GET', '/dsh-favorites/api/state')
  assert.equal(state.body.folders.length, 0, 'the whole folder subtree is gone')
  assert.equal(state.body.entries.length, 3, 'every favorite survives the folder delete')
  for (const entry of state.body.entries) {
    assert.equal(entry.folderId, '', 'entries land back in unfiled')
  }
})

test('bad input and unknown routes fail loudly', async () => {
  const handler = makeHandler(null)
  assert.equal((await call(handler, 'PUT', '/dsh-favorites/api/entry', {})).status, 400)
  assert.equal((await call(handler, 'DELETE', '/dsh-favorites/api/entry')).status, 400)
  assert.equal((await call(handler, 'DELETE', '/dsh-favorites/api/entry?sessionId=x')).status, 200)
  assert.equal((await call(handler, 'DELETE', '/dsh-favorites/api/folder')).status, 400)
  assert.equal((await call(handler, 'GET', '/dsh-favorites/api/nothing')).status, 404)
  assert.equal((await call(handler, 'POST', '/dsh-favorites/api/entry', {})).status, 404)
  assert.equal((await call(handler, 'GET', '/some-other-plugin/api/state')).status, 404)
})

test('body size cap rejects oversized payloads', async () => {
  const handler = makeHandler(null)
  const big = { sessionId: 's-1', note: 'x'.repeat(MAX_BODY_BYTES + 1) }
  const req = {
    method: 'PUT',
    url: '/dsh-favorites/api/entry',
    on(event, fn) {
      if (event === 'data') fn(Buffer.from(JSON.stringify(big)))
      if (event === 'end') fn()
    },
  }
  const res = { headersSent: false, writeHead() { res.headersSent = true; res.statusCode = 400 }, end() {} }
  await handler(req, res)
  assert.equal(res.statusCode, 400)
})

test('whenReady gate: early writes wait for the domain instead of being dropped', async () => {
  // The settings-save race (skill §一.3): the tables resolve late; a save
  // arriving first must still land once the domain opens.
  let release
  const whenReady = new Promise((resolve) => { release = resolve })
  const tables = mockTables()
  const handler = createApiHandler({ whenReady, rejectRequest: undefined })
  const pending = call(handler, 'PUT', '/dsh-favorites/api/entry', { sessionId: 'early' })
  release(tables)
  const { status } = await pending
  assert.equal(status, 200)
  assert.equal(tables.entries.get('early').sessionId, 'early')
})

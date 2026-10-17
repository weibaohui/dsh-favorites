/**
 * One-off real-storage journey verification (skill §九):
 * boot → PUT folder+entry → domain.close() → reopen → GET must read back
 * exactly what was saved. Uses the host's own dsh-storage-domain +
 * dsh-storage-json packages. Not a committed test: it depends on the local
 * host install path and auto-skips there.
 */
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const HOST_PKG = join(process.env.HOME, '.local/lib/node_modules/@deepseek-ai/dsh')

let JsonStorageBackend, DomainFacility
try {
  JsonStorageBackend = require(join(HOST_PKG, 'node_modules/@deepseek-ai/dsh-storage-json/lib/index.js')).JsonStorageBackend
  DomainFacility = require(join(HOST_PKG, 'node_modules/@deepseek-ai/dsh-storage-domain/lib/index.js')).DomainFacility
} catch (error) {
  console.log('SKIP: host storage packages not available —', error.message)
  process.exit(0)
}

const Host = require('../src/index.js')
const { domainSpec, createApiHandler } = Host.__internals

const root = mkdtempSync(join(tmpdir(), 'dsh-favorites-rt-'))
const makeCtx = (backend) => ({
  emit() {},
  logger: { info() {}, warn() {}, error() {} },
  storage: { backend: { get: (name) => (name === 'json' ? backend : undefined) } },
})

async function openTables(backend) {
  const facility = new DomainFacility(makeCtx(backend), { backend: 'json' })
  const domain = await facility.open(domainSpec)
  return {
    facility,
    tables: { folders: domain.table('folders'), entries: domain.table('entries') },
    close: () => domain.close(),
  }
}

async function call(handler, method, path, body) {
  const out = { status: 0, body: null }
  const res = {
    headersSent: false,
    writeHead(status) { res.headersSent = true; out.status = status },
    end(payload) { out.body = payload ? JSON.parse(String(payload)) : null },
  }
  const req = {
    method,
    url: path,
    on(event, fn) {
      if (event === 'data' && body !== undefined) fn(Buffer.from(JSON.stringify(body)))
      if (event === 'end') fn()
    },
  }
  await handler(req, res)
  return out
}

try {
  const backend = new JsonStorageBackend(root)

  // Boot 1: write a folder, a nested folder, and a favorite.
  const boot1 = await openTables(backend)
  const handler1 = createApiHandler({ whenReady: Promise.resolve(boot1.tables), rejectRequest: undefined })
  const folder = (await call(handler1, 'PUT', '/dsh-favorites/api/folder', { name: '研究' })).body.folder
  await call(handler1, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-1', folderId: folder.id, name: '别名', note: '备注' })
  await boot1.close()

  // Boot 2: a fresh facility over the same medium must read everything back.
  const boot2 = await openTables(backend)
  const handler2 = createApiHandler({ whenReady: Promise.resolve(boot2.tables), rejectRequest: undefined })
  const state = await call(handler2, 'GET', '/dsh-favorites/api/state')

  const okFolder = state.body.folders.length === 1 && state.body.folders[0].id === folder.id && state.body.folders[0].name === '研究'
  const okEntry = state.body.entries.length === 1
    && state.body.entries[0].sessionId === 's-1'
    && state.body.entries[0].folderId === folder.id
    && state.body.entries[0].name === '别名'
    && state.body.entries[0].note === '备注'

  // And a write on boot 2 lands too (post-restart durability).
  await call(handler2, 'PUT', '/dsh-favorites/api/entry', { sessionId: 's-2' })
  await boot2.close()

  const boot3 = await openTables(backend)
  const state3 = await call(createApiHandler({ whenReady: Promise.resolve(boot3.tables), rejectRequest: undefined }), 'GET', '/dsh-favorites/api/state')
  await boot3.close()

  const okSecondWrite = state3.body.entries.some((entry) => entry.sessionId === 's-2')

  if (okFolder && okEntry && okSecondWrite) {
    console.log('REAL-STORAGE ROUNDTRIP OK — 保存内容在重启后逐字读回')
  } else {
    console.error('ROUNDTRIP MISMATCH', JSON.stringify({ okFolder, okEntry, okSecondWrite, state: state.body }, null, 2))
    process.exitCode = 1
  }
} finally {
  rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}

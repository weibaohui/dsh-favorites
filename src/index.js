/**
 * dsh-plugin-dsh-favorites — Host half.
 *
 * Session favorites ("收藏夹"): durable folders + per-session favorite
 * entries stored through the host `storageDomain` service (domain
 * `dsh_favorites`), served to the browser half over a webServer route
 * guarded by the connection trust barrier.
 *
 * The client half (`client/bundle.js`) registers:
 * - a favorite toggle in each session row's "..." menu and a star hover
 *   button (`sidebar.workspaces.session.menu.item` / `...row.action`),
 * - a favorites main panel (sidebar.panellist + `main` keyed slot) with
 *   folders, notes, custom display names, open / fork / rename actions,
 *   basic session stats, and a fork-relationship graph.
 *
 * Zero behavior lives here beyond storage + HTTP: every UI concern belongs
 * to the client half, every durable byte belongs to the domain below.
 */

const { z } = require('zod')

const PLUGIN_NAME = 'dsh-favorites'
const ROUTE_PREFIX = '/dsh-favorites/api'

/** Maximum request body the API accepts (folder/entry payloads are tiny). */
const MAX_BODY_BYTES = 64 * 1024

/** Field length limits (mirror-checked client side; enforced here). */
const LIMITS = {
  sessionId: 200,
  folderId: 100,
  name: 200,
  note: 4000,
}

// ── storage schemas ─────────────────────────────────────────────────────────
// The stored-record schemas are deliberately LOOSE (zod.looseObject):
// DomainFacility.open re-parses every record already on disk, so a strict
// schema would turn any future field addition into a boot-killing change for
// deployments holding records written by older versions (the dsh-tasks
// lesson). Strict shaping happens in normalizeEntry/normalizeFolder at read
// time and in the write-path validators below.

/** One favorites folder. Keyed by `id`; `parentId: ''` = top level. */
const folderSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
  createdAt: z.string().optional(),
  order: z.number().optional(),
})

/** One favorited session. Keyed by `sessionId`; `folderId: ''` = unfiled. */
const entrySchema = z.looseObject({
  sessionId: z.string(),
  folderId: z.string().optional(),
  /** Custom display name shown by the favorites UI ('' = use session title). */
  name: z.string().optional(),
  /** Free-form user note ('' = none). */
  note: z.string().optional(),
  addedAt: z.string().optional(),
  order: z.number().optional(),
})

const domainSpec = {
  name: 'dsh_favorites',
  version: 1,
  tables: {
    folders: { valueSchema: folderSchema },
    entries: { valueSchema: entrySchema },
  },
}

// ── pure helpers (exported for offline tests) ───────────────────────────────

/** Trim to a string; anything non-string collapses to ''. */
function textOf(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Validate + normalize an entry upsert body. Absent optional fields are
 * `undefined` (keep the stored value); explicit `null` clears the field.
 * @returns the normalized patch, or throws on invalid input.
 */
function normalizeEntryInput(body) {
  const sessionId = textOf(body.sessionId)
  if (!sessionId) throw new Error('sessionId must not be empty')
  if (sessionId.length > LIMITS.sessionId) throw new Error('sessionId too long')
  const patch = { sessionId }
  if (body.folderId !== undefined) {
    const folderId = body.folderId === null ? '' : textOf(body.folderId)
    if (folderId.length > LIMITS.folderId) throw new Error('folderId too long')
    patch.folderId = folderId
  }
  for (const field of ['name', 'note']) {
    if (body[field] !== undefined) {
      const value = body[field] === null ? '' : textOf(body[field])
      if (value.length > LIMITS[field]) throw new Error(`${field} too long`)
      patch[field] = value
    }
  }
  return patch
}

/**
 * Validate + normalize a folder upsert body. `id` absent → create; `null`
 * parentId / '' both mean top level.
 */
function normalizeFolderInput(body) {
  const name = textOf(body.name)
  if (!name) throw new Error('folder name must not be empty')
  if (name.length > LIMITS.name) throw new Error('folder name too long')
  const patch = { name }
  if (body.id !== undefined && body.id !== null) {
    const id = textOf(body.id)
    if (!id) throw new Error('folder id must not be empty')
    if (id.length > LIMITS.folderId) throw new Error('folder id too long')
    patch.id = id
  }
  if (body.parentId !== undefined) {
    const parentId = body.parentId === null ? '' : textOf(body.parentId)
    if (parentId.length > LIMITS.folderId) throw new Error('parentId too long')
    patch.parentId = parentId
  }
  return patch
}

/** Read one table row map as a plain array, tolerant of a missing table.
 *  The real KvTable handle's `keys()` returns an iterator (not an array),
 *  so this must iterate — never `.map()` it. */
function rowsOf(table) {
  if (!table || typeof table.keys !== 'function') return []
  const rows = []
  for (const key of table.keys()) {
    const row = table.get(key)
    if (row !== undefined) rows.push(row)
  }
  return rows
}

/** Every folder id in the subtree rooted at `rootId` (inclusive). */
function subtreeIds(folders, rootId) {
  const byParent = new Map()
  for (const folder of folders) {
    const parent = textOf(folder.parentId) || ''
    if (!byParent.has(parent)) byParent.set(parent, [])
    byParent.get(parent).push(folder.id)
  }
  const seen = new Set([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const id = queue.pop()
    for (const child of byParent.get(id) || []) {
      if (!seen.has(child)) {
        seen.add(child)
        queue.push(child)
      }
    }
  }
  return seen
}

/**
 * Whether moving `folderId` under `parentId` would create a cycle
 * (parentId inside folderId's subtree).
 */
function moveCreatesCycle(folders, folderId, parentId) {
  if (!parentId) return false
  return subtreeIds(folders, folderId).has(parentId)
}

/** Short random id for created folders (`f-<base36 time>-<base36 rand>`). */
function newFolderId() {
  return 'f-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/**
 * The HTTP API handler factory. Split from `apply` so offline tests can
 * drive the full request journey (barrier → dispatch → storage) against a
 * mock domain and a mock `requestRejection`.
 *
 * @param options.whenReady - Promise of `{ folders, entries }` table pair;
 *   every request awaits it first (the domain opens asynchronously, and an
 *   early save must never be silently dropped).
 * @param options.rejectRequest - the connection service's trust barrier;
 *   `undefined` (absent service) lets the request through, matching the
 *   host's own semantics.
 * @returns the webServer route handler.
 */
function createApiHandler({ whenReady, rejectRequest } = {}) {
  return async function handler(req, res) {
    const sendJson = (res2, status, payload) => {
      if (res2.headersSent) return
      res2.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
      res2.end(JSON.stringify(payload))
    }
    try {
      // 与其它 host 路由一致的信任栅栏：connection 服务的 Host/Origin 检查
      // 加浏览器认证。缺了它，收藏数据就能被任意网页跨站读写。
      const rejection = typeof rejectRequest === 'function' ? rejectRequest(req) : undefined
      if (rejection !== undefined) {
        res.writeHead(rejection)
        res.end()
        return
      }

      const method = (req.method || 'GET').toUpperCase()
      const url = new URL(req.url || '/', 'http://dsh.local')
      const apiPath = url.pathname.replace(/\/+$/, '')
      if (!apiPath.endsWith(ROUTE_PREFIX) && !apiPath.startsWith(ROUTE_PREFIX + '/')) {
        return sendJson(res, 404, { error: 'not found' })
      }
      const action = apiPath === ROUTE_PREFIX ? '' : apiPath.slice(ROUTE_PREFIX.length).replace(/^\//, '')

      const { folders, entries } = await whenReady

      if (method === 'GET' && action === 'state') {
        return sendJson(res, 200, { folders: rowsOf(folders), entries: rowsOf(entries) })
      }

      if (method === 'PUT' && action === 'entry') {
        const body = await readBody(req)
        const patch = normalizeEntryInput(body)
        const existing = entries.get(patch.sessionId)
        const next = {
          sessionId: patch.sessionId,
          folderId: patch.folderId !== undefined ? patch.folderId : textOf(existing && existing.folderId),
          name: patch.name !== undefined ? patch.name : textOf(existing && existing.name),
          note: patch.note !== undefined ? patch.note : textOf(existing && existing.note),
          addedAt: (existing && existing.addedAt) || new Date().toISOString(),
        }
        // put/delete are async (backend durability → memory → change event):
        // a 200 must mean the record is already durable, so await every write.
        await entries.put(patch.sessionId, next)
        return sendJson(res, 200, { ok: true, entry: next })
      }

      if (method === 'DELETE' && action === 'entry') {
        const sessionId = textOf(url.searchParams.get('sessionId'))
        if (!sessionId) return sendJson(res, 400, { error: 'sessionId must not be empty' })
        if (entries.get(sessionId) !== undefined) await entries.delete(sessionId)
        return sendJson(res, 200, { ok: true })
      }

      if (method === 'PUT' && action === 'folder') {
        const body = await readBody(req)
        const patch = normalizeFolderInput(body)
        if (patch.id !== undefined) {
          const existing = folders.get(patch.id)
          if (existing === undefined) return sendJson(res, 404, { error: 'folder not found' })
          const next = {
            id: patch.id,
            name: patch.name,
            parentId: patch.parentId !== undefined ? patch.parentId : textOf(existing.parentId),
            createdAt: existing.createdAt || new Date().toISOString(),
          }
          if (next.parentId && next.parentId !== next.id) {
            if (moveCreatesCycle(rowsOf(folders), next.id, next.parentId)) {
              return sendJson(res, 400, { error: 'cannot move a folder into its own subtree' })
            }
            if (folders.get(next.parentId) === undefined) {
              return sendJson(res, 404, { error: 'parent folder not found' })
            }
          } else {
            next.parentId = ''
          }
          await folders.put(next.id, next)
          return sendJson(res, 200, { ok: true, folder: next })
        }
        const id = newFolderId()
        const next = {
          id,
          name: patch.name,
          parentId: patch.parentId !== undefined ? patch.parentId : '',
          createdAt: new Date().toISOString(),
        }
        if (next.parentId && folders.get(next.parentId) === undefined) {
          return sendJson(res, 404, { error: 'parent folder not found' })
        }
        await folders.put(id, next)
        return sendJson(res, 200, { ok: true, folder: next })
      }

      if (method === 'DELETE' && action === 'folder') {
        const id = textOf(url.searchParams.get('id'))
        if (!id) return sendJson(res, 400, { error: 'id must not be empty' })
        if (folders.get(id) === undefined) return sendJson(res, 404, { error: 'folder not found' })
        // 递归删除子文件夹；被删文件夹（含自身）里的收藏全部回落到
        // 「未分类」，收藏本身永不因文件夹删除而丢失。
        const doomed = subtreeIds(rowsOf(folders), id)
        for (const folderId of doomed) {
          if (folders.get(folderId) !== undefined) await folders.delete(folderId)
        }
        for (const key of entries.keys()) {
          const entry = entries.get(key)
          if (entry !== undefined && doomed.has(textOf(entry.folderId))) {
            await entries.put(key, { ...entry, folderId: '' })
          }
        }
        return sendJson(res, 200, { ok: true })
      }

      return sendJson(res, 404, { error: 'not found' })
    } catch (error) {
      return sendJson(res, 400, { error: String((error && error.message) || error) })
    }
  }
}

/** Read and size-cap a JSON request body. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (!text) return resolve({})
      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new Error('request body must be JSON'))
      }
    })
    req.on('error', reject)
  })
}

// ── cordis plugin ───────────────────────────────────────────────────────────

const plugin = {
  name: PLUGIN_NAME,
  inject: ['storageDomain', 'webServer', 'connection'],
  apply(ctx) {
    const log = (msg) => {
      try {
        ctx.logger.info(msg)
      } catch {
        console.log(msg)
      }
    }
    const warn = (msg) => {
      try {
        ctx.logger.warn(msg)
      } catch {
        console.warn(msg)
      }
    }

    // The cleanup effect must be registered synchronously while the plugin's
    // cordis fiber is still active: calling ctx.effect() after an await
    // throws "cannot create effect on inactive context" and takes the whole
    // host boot down with it (dsh-tasks lesson).
    const domainPromise = ctx.storageDomain.open(domainSpec)
    ctx.effect(() => () => {
      domainPromise.then((domain) => domain.close()).catch(() => {})
    }, 'dsh-favorites: domain close')

    const whenReady = domainPromise.then((domain) => ({
      folders: domain.table('folders'),
      entries: domain.table('entries'),
    }))
    whenReady.catch((error) => warn(`dsh-favorites: storage domain unavailable — ${String((error && error.message) || error)}`))

    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler: createApiHandler({
        whenReady: whenReady.then((tables) => {
          if (!tables.folders || !tables.entries) throw new Error('storage tables unavailable')
          return tables
        }),
        rejectRequest: (req) => {
          try {
            const connection = ctx.get('connection')
            return connection && typeof connection.requestRejection === 'function'
              ? connection.requestRejection(req)
              : undefined
          } catch {
            return undefined
          }
        },
      }),
    }), 'dsh-favorites: api route')

    log('dsh-favorites: host half ready')
  },
}

module.exports = {
  ...plugin,
  __internals: {
    PLUGIN_NAME,
    ROUTE_PREFIX,
    LIMITS,
    MAX_BODY_BYTES,
    folderSchema,
    entrySchema,
    domainSpec,
    textOf,
    normalizeEntryInput,
    normalizeFolderInput,
    rowsOf,
    subtreeIds,
    moveCreatesCycle,
    createApiHandler,
  },
}

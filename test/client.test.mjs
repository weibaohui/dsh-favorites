/**
 * Offline test suite for the Browser half's pure logic: the fork-graph
 * layout, folder-tree helpers, favorites store behavior, and formatters.
 * The client module loads under plain Node via its React shim.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Client = require('../client/index.js')

const {
  NS,
  PANEL_ID,
  favStore,
  deriveFavSet,
  favSetsEqual,
  buildGraphLayout,
  folderSubtree,
  folderDepth,
  sortFolders,
  sortEntries,
  fmtNum,
  fmtMs,
  fmtTime,
  truncate,
  interpolate,
  ZH,
} = Client.__internals

/** Build a sessions.list-shaped snapshot from [id, parentId, extra] rows. */
function snap(rows) {
  const byId = {}
  const ids = []
  for (const row of rows) {
    const [id, parent, extra] = row
    ids.push(id)
    byId[id] = {
      sessionId: id,
      title: 'T-' + id,
      updatedAt: 1700000000000,
      running: false,
      blank: false,
      ...(parent ? { parentSessionId: parent } : {}),
      ...(extra || {}),
    }
  }
  return { ids, byId, projectionsBySession: {} }
}

const FAV = (ids) => new Set(ids)

// ── graph layout ──────────────────────────────────────────────────────────

test('empty inputs yield an empty, zero-sized layout', () => {
  const layout = buildGraphLayout(null, new Set(), {})
  assert.equal(layout.nodes.length, 0)
  assert.equal(layout.width, 0)
  const layout2 = buildGraphLayout(snap([['a', null]]), FAV([]), {})
  assert.equal(layout2.nodes.length, 0)
})

test('a favorited root with two forks lays out as a two-edge tree', () => {
  const layout = buildGraphLayout(
    snap([['root', null], ['f1', 'root'], ['f2', 'root']]),
    FAV(['root']),
    {},
  )
  // root + both fork children ride along even though only root is favorited.
  assert.equal(layout.nodes.length, 3)
  assert.equal(layout.edges.length, 2)
  const root = layout.nodes.find((n) => n.id === 'root')
  const f1 = layout.nodes.find((n) => n.id === 'f1')
  const f2 = layout.nodes.find((n) => n.id === 'f2')
  assert.equal(root.depth, 0)
  assert.equal(f1.depth, 1)
  assert.equal(f2.depth, 1)
  assert.notEqual(f1.y, f2.y, 'siblings never overlap vertically')
  assert.ok(f1.x > root.x && f2.x > root.x, 'children sit one column right of the parent')
  assert.equal(root.favorited, true)
  assert.equal(f1.favorited, false)
})

test('runtime rows carrying `parentId` (the live field name) link identically', () => {
  // The live client snapshot names the lineage field `parentId`; the d.ts
  // says `parentSessionId` on cold summaries. Both must work.
  const s = snap([['root', null], ['kid', null]])
  s.byId.kid.parentId = 'root'
  delete s.byId.kid.parentSessionId
  const layout = buildGraphLayout(s, FAV(['root']), {})
  assert.equal(layout.nodes.length, 2)
  assert.equal(layout.edges.length, 1)
  assert.equal(layout.edges[0].from, 'root')
  assert.equal(layout.edges[0].to, 'kid')
  // Favoriting only the kid still pulls the root in as its ancestor.
  const fromKid = buildGraphLayout(s, FAV(['kid']), {})
  assert.deepEqual(fromKid.nodes.map((n) => n.id).sort(), ['kid', 'root'])
})

test('ancestors of a favorited deep fork stay visible above it', () => {
  const layout = buildGraphLayout(
    snap([['g0', null], ['g1', 'g0'], ['g2', 'g1']]),
    FAV(['g2']),
    {},
  )
  const ids = layout.nodes.map((n) => n.id).sort()
  assert.deepEqual(ids, ['g0', 'g1', 'g2'], 'the whole lineage joins the graph')
  const g0 = layout.nodes.find((n) => n.id === 'g0')
  const g2 = layout.nodes.find((n) => n.id === 'g2')
  assert.equal(g2.depth - g0.depth, 2)
})

test('subagent-origin sessions are excluded from the fork story', () => {
  const layout = buildGraphLayout(
    snap([['root', null], ['sub', 'root', { origin: 'subagent' }]]),
    FAV(['root']),
    {},
  )
  assert.deepEqual(layout.nodes.map((n) => n.id), ['root'])
})

test('grandchild forks keep subtree contiguity in vertical order', () => {
  const layout = buildGraphLayout(
    snap([['r', null], ['a', 'r'], ['a1', 'a'], ['b', 'r']]),
    FAV(['r']),
    {},
  )
  const yOf = Object.fromEntries(layout.nodes.map((n) => [n.id, n.y]))
  assert.ok(yOf.a1 > yOf.a, 'child sits below its parent')
  assert.ok(yOf.a1 < yOf.b || yOf.a1 > yOf.b, 'defined order')
  // DFS pre-order keeps a's subtree between a and b.
  assert.ok(yOf.a < yOf.a1 && yOf.a1 < yOf.b, "a's subtree stays contiguous before b")
})

test('a favorited session missing from the host list counts as stale, not drawn', () => {
  const layout = buildGraphLayout(snap([['a', null]]), FAV(['a', 'gone']), {})
  assert.equal(layout.nodes.length, 1)
  assert.equal(layout.staleCount, 1)
})

test('the cap bounds runaway forests', () => {
  const rows = [['root', null]]
  for (let i = 0; i < 60; i++) rows.push(['c' + i, 'root'])
  const layout = buildGraphLayout(snap(rows), FAV(['root']), { cap: 10 })
  assert.ok(layout.nodes.length <= 10, 'node count respects the cap')
})

test('cycles in (hypothetical) host data cannot hang the layout', () => {
  const layout = buildGraphLayout(
    snap([['x', 'y'], ['y', 'x']]),
    FAV(['x', 'y']),
    {},
  )
  assert.equal(layout.nodes.length, 2, 'both nodes still get placed')
})

test('unknown parents (deleted hosts) become graph roots', () => {
  const layout = buildGraphLayout(snap([['child', 'deleted-parent']]), FAV(['child']), {})
  assert.equal(layout.nodes.length, 1)
  assert.equal(layout.nodes[0].parentId, null)
  assert.equal(layout.nodes[0].depth, 0)
})

// ── folder tree helpers ───────────────────────────────────────────────────

const FOLDERS = [
  { id: 'a', name: '写作' },
  { id: 'b', name: '深度', parentId: 'a' },
  { id: 'c', name: '随笔', parentId: 'a' },
]

test('folderSubtree matches the host-half semantics', () => {
  assert.deepEqual([...folderSubtree(FOLDERS, 'a')].sort(), ['a', 'b', 'c'])
  assert.deepEqual([...folderSubtree(FOLDERS, 'b')].sort(), ['b'])
})

test('folderDepth counts nesting level', () => {
  assert.equal(folderDepth(FOLDERS, 'a'), 0)
  assert.equal(folderDepth(FOLDERS, 'b'), 1)
  assert.equal(folderDepth(FOLDERS, 'missing'), 0)
})

test('sortFolders uses locale collation and never mutates input', () => {
  const input = [{ id: '1', name: 'b' }, { id: '2', name: 'a' }]
  const out = sortFolders(input)
  assert.equal(out[0].name, 'a')
  assert.equal(input[0].name, 'b')
})

test('sortEntries is newest-favorited-first and stable on missing addedAt', () => {
  const out = sortEntries([
    { sessionId: 'old', addedAt: '2026-01-01T00:00:00Z' },
    { sessionId: 'new', addedAt: '2026-10-01T00:00:00Z' },
    { sessionId: 'bare' },
  ])
  assert.equal(out[0].sessionId, 'new')
  assert.equal(out[2].sessionId, 'bare')
})

// ── favorites store ───────────────────────────────────────────────────────

test('store snapshot identity is stable until a set, then listeners fire', () => {
  const seen = []
  const off = favStore.subscribe(() => seen.push(favStore.get()))
  const first = favStore.get()
  favStore.set({ ...favStore.get(), loaded: true })
  assert.notEqual(favStore.get(), first, 'set swaps the snapshot reference')
  assert.equal(seen.length, 1)
  off()
  favStore.set({ ...favStore.get(), loaded: false })
  assert.equal(seen.length, 1, 'unsubscribed listeners stop firing')
  // Restore a sane baseline for later asserts.
  favStore.set({ folders: [], entries: [], loaded: true, svcSeq: 0, favSet: new Set() })
})

test('deriveFavSet and favSetsEqual implement set semantics', () => {
  const set = deriveFavSet({ entries: [{ sessionId: 'a' }, { sessionId: 'b' }, {}] })
  assert.deepEqual([...set].sort(), ['a', 'b'])
  assert.equal(favSetsEqual(new Set(['a', 'b']), new Set(['b', 'a'])), true)
  assert.equal(favSetsEqual(new Set(['a']), new Set(['a', 'b'])), false)
})

// ── formatters ────────────────────────────────────────────────────────────

test('fmtNum collapses big numbers readably', () => {
  assert.equal(fmtNum(0), '0')
  assert.equal(fmtNum(999), '999')
  assert.equal(fmtNum(1234), '1.2k')
  assert.equal(fmtNum(1000), '1k')
  assert.equal(fmtNum(23456), '2.3w')
  assert.equal(fmtNum(NaN), '0')
})

test('fmtMs renders human durations', () => {
  assert.equal(fmtMs(0), '')
  assert.equal(fmtMs(850), '850ms')
  assert.equal(fmtMs(65000), '1m5s')
  assert.equal(fmtMs(45000), '45s')
})

test('fmtTime tolerates garbage', () => {
  assert.equal(fmtTime(undefined), '')
  assert.equal(fmtTime('not-a-date'), '')
  assert.ok(fmtTime(Date.now()).length > 0)
})

test('truncate is code-point safe with ellipsis', () => {
  assert.equal(truncate('abcdef', 10), 'abcdef')
  assert.equal(truncate('abcdef', 4).endsWith('…'), true)
  assert.equal([...truncate('你好世界', 3)].length, 3)
  assert.equal(truncate(null, 5), '')
})

test('interpolate substitutes named vars', () => {
  assert.equal(interpolate('{n} 轮', { n: 5 }), '5 轮')
  assert.equal(interpolate('no vars'), 'no vars')
})

// ── locale table sanity ───────────────────────────────────────────────────

test('zh and en tables cover the same keys', () => {
  const zhKeys = Object.keys(ZH).sort()
  const Client2 = require('../client/index.js')
  const enKeys = Object.keys(Client2.__internals.EN).sort()
  assert.deepEqual(zhKeys, enKeys)
})

test('client module carries the loader contract fields', () => {
  assert.equal(Client.name, '@weibaohui/dsh-favorites')
  assert.equal(PANEL_ID, 'dsh-favorites')
  assert.equal(NS, 'dsh-favorites')
  assert.equal(typeof Client.apply, 'function')
  assert.deepEqual(Client.inject, ['slots', 'locale'])
})

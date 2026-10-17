/* Generated from client/index.js by scripts/build-client.mjs — do not edit by hand.
 * Regenerate with: npm run build:client
 */
window.__ModuleLoader__.load({
  id: "@weibaohui/dsh-favorites",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    var React = require("react")
    /**
     * dsh-plugin-dsh-favorites - Browser half.
     *
     * Three surfaces, all host slots (no DOM surgery anywhere):
     * 1. Session-row favorite toggle: an entry in the "..." menu (order 500)
     *    and a star hover button (order 250) of every session row —
     *    `sidebar.workspaces.session.menu.item` / `...row.action`.
     * 2. The favorites main panel: a `sidebar.panellist` icon row plus a `main`
     *    keyed slot. Folder tree (browser-bookmark style) + favorited-session
     *    list with custom display names, notes, basic stats, open / fork /
     *    host-rename / move / remove actions.
     * 3. The fork-relationship graph: hand-rolled layered-forest SVG over the
     *    host session list (`sessions.list`), rooted at favorited sessions.
     *
     * Data lives in the host half's storageDomain (`dsh_favorites`), reached
     * through `/dsh-favorites/api/*` with the connection trust barrier. All
     * colors come from the ui-theme `--dsw-*` token layers so light/dark
     * follows the shell; all copy comes from the locale registry (zh/en).
     */

    // React is a loader platform module. Under plain Node (contract tests) a
    // minimal createElement/hook shim keeps the source loadable for assertions.
    let __React = null
    try { __React = require('react') } catch {}
    if (!__React || typeof __React.createElement !== 'function') {
      __React = {
        createElement(type, props, ...kids) {
          return { type, props: props || {}, kids: kids.flat(9).filter((k) => k !== null && k !== undefined && k !== false && k !== true) }
        },
        useState(init) { const v = [typeof init === 'function' ? init() : init]; return [v[0], (x) => { v[0] = typeof x === 'function' ? x(v[0]) : x }] },
        useEffect() {}, useMemo(fn) { return fn() }, useRef(v = null) { return { current: v } },
      }
    }
    const { createElement: h, useState, useEffect, useMemo, useRef } = __React
    // React 18 rides snapshots; the shim (tests) falls back to a subscribe effect.
    const useSyncExternalStore = typeof __React.useSyncExternalStore === 'function'
      ? __React.useSyncExternalStore
      : (subscribe, getSnapshot) => {
        const [value, setValue] = useState(getSnapshot)
        useEffect(() => subscribe(() => setValue(getSnapshot())), [])
        return value
      }

    // Host primitives (MenuItemButton/Tooltip/Button/Modal). Absent under plain
    // Node (tests) — every use site guards and degrades to plain elements.
    let P = null
    try { P = require('@deepseek-ai/dsh-client-ui-primitives') } catch {}

    // NOTE: no class components in this module — a `class X extends
    // React.Component` silently kills rendering inside the plugin loader
    // (skills-management lesson). Render-path helpers must be total.

    const CLIENT_NAME = '@weibaohui/dsh-favorites'
    const NS = 'dsh-favorites'
    const ROUTE = '/dsh-favorites/api'
    // panellist id === main keyed-slot key. Simple string, no '@' or '/' —
    // the keyed-slot matcher is brittle around special characters (dsh-dashboard).
    const PANEL_ID = 'dsh-favorites'

    // ── locale ────────────────────────────────────────────────────────────────

    const ZH = {
      panelLabel: '收藏夹',
      viewList: '列表',
      viewGraph: '关系图',
      refresh: '刷新',
      allFavorites: '全部收藏',
      unfiled: '未分类',
      newFolder: '新建文件夹',
      folderNamePlaceholder: '文件夹名称，回车创建',
      renameFolder: '重命名文件夹',
      deleteFolder: '删除文件夹',
      deleteFolderConfirm: '删除文件夹「{name}」？其中的收藏会移回「未分类」，不会丢失。',
      empty: '还没有收藏。在左侧会话的 ⋯ 菜单或行尾 ☆ 按钮里收藏会话。',
      emptyFolder: '这个文件夹还没有收藏。',
      noFolderSelected: '选择左侧文件夹查看收藏。',
      stale: '已失效',
      staleHint: '该会话在宿主中已不存在，可移除收藏。',
      running: '运行中',
      blankSession: '空白会话',
      openContinue: '继续会话',
      favorite: '收藏到收藏夹',
      openFailed: '打开失败：',
      fork: 'Fork 新会话',
      forkStarted: '已从「{name}」Fork 出新会话',
      forkFailed: 'Fork 失败：',
      forkUnavailable: '空白会话无法 Fork（还没有可复制的对话）。',
      edit: '编辑名称与备注',
      displayName: '显示名称（可选，覆盖会话标题）',
      displayNamePlaceholder: '留空则显示会话标题',
      note: '备注',
      notePlaceholder: '给这个会话写点备注…',
      save: '保存',
      cancel: '关闭',
      saved: '已保存',
      saveFailed: '保存失败：',
      remove: '移除收藏',
      removed: '已从收藏夹移除',
      removeFailed: '移除失败：',
      addFailed: '收藏失败：',
      renameSession: '重命名会话',
      renameSessionTitle: '重命名会话（宿主标题）',
      renameFailed: '重命名失败：',
      moveTo: '移动到…',
      moveToFolder: '移动到「{name}」',
      movedToRoot: '移动到「未分类」',
      loadFailed: '收藏夹加载失败：',
      serviceMissing: '会话服务不可用，统计与关系图暂不可用（打开过会话后重试）。',
      statsTurns: '{n} 轮',
      statsSteps: '{n} 步',
      statsTokens: '{n} tok',
      statsLlm: '模型 {n}',
      statsForks: 'Fork 子会话 ×{n}',
      statsUpdated: '最近活动 {n}',
      statsAdded: '收藏于 {n}',
      graphEmpty: '收藏里还没有可绘制的会话关系。',
      graphStaleHint: '{n} 个已失效收藏未显示在图中。',
      graphHint: '实线 = fork/派生关系 · 虚线框 = 未收藏的相关会话 · 点击节点打开会话',
      confirmDeleteTitle: '确认删除',
      delete: '删除',
    }

    const EN = {
      panelLabel: 'Favorites',
      viewList: 'List',
      viewGraph: 'Graph',
      refresh: 'Refresh',
      allFavorites: 'All favorites',
      unfiled: 'Unfiled',
      newFolder: 'New folder',
      folderNamePlaceholder: 'Folder name, press Enter',
      renameFolder: 'Rename folder',
      deleteFolder: 'Delete folder',
      deleteFolderConfirm: 'Delete folder "{name}"? Favorites inside move back to Unfiled — nothing is lost.',
      empty: 'No favorites yet. Star a session from its ⋯ menu or the ☆ row button.',
      emptyFolder: 'Nothing in this folder yet.',
      noFolderSelected: 'Pick a folder on the left.',
      stale: 'Gone',
      staleHint: 'This session no longer exists on the host; you can remove it.',
      running: 'running',
      blankSession: 'blank session',
      openContinue: 'Continue session',
      favorite: 'Add to favorites',
      openFailed: 'Open failed: ',
      fork: 'Fork new session',
      forkStarted: 'Forked a new session from "{name}"',
      forkFailed: 'Fork failed: ',
      forkUnavailable: 'A blank session cannot be forked (nothing to copy yet).',
      edit: 'Edit name & note',
      displayName: 'Display name (optional, overrides session title)',
      displayNamePlaceholder: 'Empty shows the session title',
      note: 'Note',
      notePlaceholder: 'Write a note for this session…',
      save: 'Save',
      cancel: 'Close',
      saved: 'Saved',
      saveFailed: 'Save failed: ',
      remove: 'Remove favorite',
      removed: 'Removed from favorites',
      removeFailed: 'Remove failed: ',
      addFailed: 'Favorite failed: ',
      renameSession: 'Rename session',
      renameSessionTitle: 'Rename session (host title)',
      renameFailed: 'Rename failed: ',
      moveTo: 'Move to…',
      moveToFolder: 'Move to "{name}"',
      movedToRoot: 'Move to Unfiled',
      loadFailed: 'Failed to load favorites: ',
      serviceMissing: 'Session service unavailable — stats and the graph are disabled for now.',
      statsTurns: '{n} turns',
      statsSteps: '{n} steps',
      statsTokens: '{n} tok',
      statsLlm: 'model {n}',
      statsForks: '{n} forks',
      statsUpdated: 'active {n}',
      statsAdded: 'saved {n}',
      graphEmpty: 'No favorited sessions to draw yet.',
      graphStaleHint: '{n} stale favorites are not shown.',
      graphHint: 'Solid edge = fork lineage · dashed node = related but not favorited · click a node to open it',
      confirmDeleteTitle: 'Confirm delete',
      delete: 'Delete',
    }

    function interpolate(template, vars) {
      let out = String(template || '')
      if (vars) for (const [k, v] of Object.entries(vars)) out = out.split('{' + k + '}').join(String(v))
      return out
    }

    // Bound at apply(); toast helpers outside React fall back to zh.
    let localeT = (key, vars) => interpolate(ZH[key] || EN[key] || key, vars)

    // ── favorites store ───────────────────────────────────────────────────────
    // One module-level snapshot store shared by row actions and the panel.
    // Snapshot identity is stable between changes so React can bail out.

    let nextSeq = 1
    function makeSnapshotStore(initial) {
      const store = {
        snapshot: initial,
        listeners: new Set(),
        get() { return store.snapshot },
        set(next) {
          store.snapshot = { ...next, seq: nextSeq++ }
          for (const fn of [...store.listeners]) {
            try { fn() } catch { /* a dead listener never breaks the store */ }
          }
        },
        subscribe(fn) {
          store.listeners.add(fn)
          return () => { store.listeners.delete(fn) }
        },
      }
      return store
    }

    const favStore = makeSnapshotStore({ folders: [], entries: [], loaded: false, svcSeq: 0, favSet: new Set() })

    /** ObservableSnapshot<ReadonlySet<sessionId>> for the slot inject hooks. */
    const favSetSource = {
      getSnapshot: () => favStore.get().favSet,
      subscribe: (fn) => favStore.subscribe(fn),
    }

    function deriveFavSet(state) {
      const set = new Set()
      for (const entry of state.entries || []) {
        if (entry && typeof entry.sessionId === 'string') set.add(entry.sessionId)
      }
      return set
    }

    // ── host client services (attached dynamically, absence tolerated) ────────

    let sessionsSvc = null
    let uiWorkspaceSvc = null

    function attachServices(ctx) {
      try {
        ctx.inject(['sessions'], (scope) => {
          const svc = scope && scope.sessions
          if (svc && typeof svc.fork === 'function') sessionsSvc = svc
          favStore.set({ ...favStore.get(), svcSeq: favStore.get().svcSeq + 1 })
        })
      } catch { /* older host without the service: stats/graph degrade */ }
      try {
        ctx.inject(['uiWorkspace'], (scope) => {
          const svc = scope && scope.uiWorkspace
          if (svc && typeof svc.openSession === 'function') uiWorkspaceSvc = svc
        })
      } catch { /* open/fork degrade to toasts */ }
    }

    function openSession(sessionId) {
      if (uiWorkspaceSvc && typeof uiWorkspaceSvc.openSession === 'function') {
        try { uiWorkspaceSvc.openSession(sessionId); return true } catch (error) { toast(t('openFailed') + errText(error)); return false }
      }
      toast(t('serviceMissing'))
      return false
    }

    function forkSession(sessionId, sourceName) {
      if (!sessionsSvc || typeof sessionsSvc.fork !== 'function') {
        toast(t('serviceMissing'))
        return Promise.resolve(false)
      }
      return sessionsSvc.fork({ sessionId, increaseTitle: true }).then((childId) => {
        toast(interpolate(t('forkStarted'), { name: sourceName || sessionId }))
        if (uiWorkspaceSvc && typeof uiWorkspaceSvc.openSession === 'function') {
          try { uiWorkspaceSvc.openSession(childId) } catch { /* the child stays one click away in the list */ }
        }
        // The child's row arrives without lineage fields until a full list
        // refresh — pull one so the graph gains the edge immediately.
        try { sessionsSvc.refresh().catch(() => {}) } catch { /* best effort */ }
        return true
      }).catch((error) => {
        toast(t('forkFailed') + errText(error))
        return false
      })
    }

    /** Host-authoritative session rename (same hop the browser's dialog uses). */
    function renameSessionOnHost(sessionId, title) {
      if (!sessionsSvc || typeof sessionsSvc.using !== 'function') {
        return Promise.reject(new Error(t('serviceMissing')))
      }
      return sessionsSvc.using(sessionId, { source: 'dsh-favorites' }, (reference) => {
        const session = reference && reference.binding && reference.binding.session
        if (!session || typeof session.rename !== 'function') throw new Error('session face unavailable')
        return session.rename(title)
      }).then((result) => {
        if (!result || !result.ok) {
          throw new Error((result && result.error && result.error.message) || 'rename rejected')
        }
        return result
      })
    }

    /** Read one live row (+ projections) out of the host session list. */
    function sessionRow(sessionId) {
      if (!sessionsSvc || !sessionsSvc.list || typeof sessionsSvc.list.getSnapshot !== 'function') return null
      const snap = sessionsSvc.list.getSnapshot()
      const row = snap && snap.byId ? snap.byId[sessionId] : undefined
      if (!row) return null
      const proj = snap.projectionsBySession ? snap.projectionsBySession[sessionId] : undefined
      const values = (proj && proj.values) || {}
      return { row, stats: values.sessionStats || null, meta: values.sessionListMetadata || null, snap }
    }

    /** Ask the host to load projections once per connection for favorited ids. */
    function refreshProjectionsQuietly(sessionIds) {
      if (!sessionsSvc || typeof sessionsSvc.refreshProjections !== 'function') return
      for (const id of sessionIds.slice(0, 30)) {
        try { sessionsSvc.refreshProjections(id).catch(() => {}) } catch { /* read-only convenience */ }
      }
    }

    // ── api ───────────────────────────────────────────────────────────────────
    // fetch does not reject on 4xx/5xx — every call must check res.ok, and a
    // failed mutation re-reads GET /state so the UI falls back to the truth
    // instead of a fake success (dsh-matrix lesson).

    function api(path, options = {}) {
      const init = { method: options.method || 'GET', headers: {} }
      if (options.body !== undefined) {
        init.headers['content-type'] = 'application/json'
        init.body = JSON.stringify(options.body)
      }
      return fetch(ROUTE + path, init).then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status))
        return data
      })
    }

    function refreshFavorites() {
      return api('/state').then((data) => {
        const folders = Array.isArray(data && data.folders) ? data.folders : []
        const entries = Array.isArray(data && data.entries) ? data.entries : []
        const prev = favStore.get()
        favStore.set({ folders, entries, loaded: true, svcSeq: prev.svcSeq, favSet: deriveFavSet({ entries }) })
      })
    }

    function favSetsEqual(a, b) {
      if (a.size !== b.size) return false
      for (const id of a) if (!b.has(id)) return false
      return true
    }

    function errText(error) {
      return String((error && error.message) || error || 'unknown error')
    }

    /** Toggle favorite for a session row. Optimistic, truthful on failure. */
    function toggleFavorite(sessionId) {
      const isFav = favStore.get().favSet.has(sessionId)
      if (isFav) {
        const prev = favStore.get()
        const entries = prev.entries.filter((entry) => entry.sessionId !== sessionId)
        favStore.set({ ...prev, entries, favSet: deriveFavSet({ entries }) })
        api('/entry?sessionId=' + encodeURIComponent(sessionId), { method: 'DELETE' })
          .then(() => refreshFavorites())
          .then(() => toast(localeT('removed')))
          .catch((error) => {
            refreshFavorites().catch(() => {})
            toast(localeT('removeFailed') + errText(error))
          })
        return
      }
      const prev = favStore.get()
      const entry = { sessionId, folderId: '', name: '', note: '', addedAt: new Date().toISOString() }
      const entries = [...prev.entries, entry]
      favStore.set({ ...prev, entries, favSet: deriveFavSet({ entries }) })
      api('/entry', { method: 'PUT', body: { sessionId } })
        .then(() => refreshFavorites())
        .catch((error) => {
          refreshFavorites().catch(() => {})
          toast(localeT('addFailed') + errText(error))
        })
    }

    // ── toast ─────────────────────────────────────────────────────────────────

    let toastTimer = null
    function toast(message) {
      if (typeof document === 'undefined') return
      try {
        let el = document.getElementById('dshf-toast')
        if (!el) {
          el = document.createElement('div')
          el.id = 'dshf-toast'
          el.className = 'dshf-toast'
          document.body.appendChild(el)
        }
        el.textContent = String(message || '')
        el.style.display = 'block'
        if (toastTimer) clearTimeout(toastTimer)
        toastTimer = setTimeout(() => { if (el) el.style.display = 'none' }, 2600)
      } catch { /* a toast must never take the host down */ }
    }

    function t(key, vars) {
      return localeT(key, vars)
    }

    // ── pure format helpers (offline-tested) ──────────────────────────────────

    /** 1234 → '1.2k', 12345 → '1.2w', else the number itself. */
    function fmtNum(n) {
      const value = Number(n)
      if (!Number.isFinite(value)) return '0'
      if (Math.abs(value) >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
      if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
      return String(value)
    }

    /** 850 → '850ms', 65000 → '1m5s'. */
    function fmtMs(ms) {
      const value = Number(ms)
      if (!Number.isFinite(value) || value <= 0) return ''
      if (value < 1000) return Math.round(value) + 'ms'
      const seconds = Math.round(value / 1000)
      if (seconds < 60) return seconds + 's'
      return Math.floor(seconds / 60) + 'm' + (seconds % 60) + 's'
    }

    /** Local 'YYYY-MM-DD HH:mm' (year omitted when it is the current one). */
    function fmtTime(ts) {
      const ms = typeof ts === 'number' ? ts : Date.parse(String(ts || ''))
      if (!Number.isFinite(ms) || ms <= 0) return ''
      const d = new Date(ms)
      const pad = (n) => String(n).padStart(2, '0')
      const ymd = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
      const hm = ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
      return d.getFullYear() === new Date().getFullYear() ? ymd.slice(5) + hm : ymd + hm
    }

    /** Truncate to a code-point budget with an ellipsis. */
    function truncate(value, maximum) {
      const text = String(value || '')
      const chars = [...text]
      if (chars.length <= maximum) return text
      return chars.slice(0, Math.max(0, maximum - 1)).join('') + '…'
    }

    /**
     * Layered forest layout for the fork graph.
     *
     * Node set: favorited sessions ∪ their ancestors (walk parentSessionId up)
     * ∪ their descendants (breadth-first over non-subagent children), capped.
     * Depth = longest edge distance below a root; sibling order follows the
     * host list; the vertical order is a DFS pre-order so subtrees stay
     * contiguous.
     *
     * @param snap - `sessions.list.getSnapshot()` (may be null).
     * @param favSet - ReadonlySet of favorited session ids.
     * @param options.cap - maximum node count (default 400).
     * @returns `{ nodes, edges, width, height, staleCount }`; nodes carry
     *   `{ id, parentId, depth, x, y, title, favorited, running, blank }`.
     */
    function buildGraphLayout(snap, favSet, options) {
      const cap = (options && options.cap) || 400
      const byId = (snap && snap.byId) || {}
      const ids = (snap && snap.ids) || []
      const COL = 260
      const ROW = 46
      const NODE_W = 210
      const NODE_H = 32
      const PAD = 16

      const include = new Set()
      for (const id of favSet || []) if (byId[id]) include.add(id)
      // Runtime rows name the lineage field `parentId` (d.ts says parentSessionId
      // on cold summaries) — accept both everywhere.
      const parentOf = (row) => row.parentSessionId ?? row.parentId
      // Ancestors keep the fork lineage visible above a favorited session.
      for (const start of [...include]) {
        let cur = start
        let guard = 0
        while (guard++ < 64) {
          const row = byId[cur]
          const parent = row && parentOf(row)
          if (!parent || !byId[parent] || include.has(parent)) break
          include.add(parent)
          cur = parent
        }
      }
      // Descendants: non-subagent children only — subagent swarms bury the fork
      // story (origin: 'subagent' is the host's own marker).
      const childrenOf = new Map()
      for (const id of ids) {
        const row = byId[id]
        const parent = row && parentOf(row)
        if (!parent || !byId[parent]) continue
        if (row.origin === 'subagent') continue
        if (!childrenOf.has(parent)) childrenOf.set(parent, [])
        childrenOf.get(parent).push(id)
      }
      const queue = [...include]
      while (queue.length > 0 && include.size < cap) {
        const id = queue.shift()
        for (const child of childrenOf.get(id) || []) {
          if (include.size >= cap) break
          if (!include.has(child)) {
            include.add(child)
            queue.push(child)
          }
        }
      }

      const staleCount = [...(favSet || [])].filter((id) => !byId[id]).length
      const nodes = []
      const edges = []
      if (include.size === 0) {
        return { nodes, edges, width: 0, height: 0, staleCount }
      }

      const meta = new Map()
      for (const id of include) {
        const row = byId[id]
        const parent = parentOf(row)
        meta.set(id, {
          id,
          parentId: parent && include.has(parent) ? parent : null,
          title: truncate(row.title || '', 26),
          favorited: favSet.has(id),
          running: row.running === true,
          blank: row.blank === true,
        })
      }

      const depthOf = new Map()
      const roots = [...meta.values()].filter((node) => node.parentId === null)
      // Assign depth top-down (BFS); cycle-safe because a child is visited once.
      const frontier = roots.map((node) => [node, 0])
      const visitedDepth = new Set()
      while (frontier.length > 0) {
        const [node, depth] = frontier.shift()
        if (visitedDepth.has(node.id)) continue
        visitedDepth.add(node.id)
        depthOf.set(node.id, depth)
        for (const child of childrenOf.get(node.id) || []) {
          if (meta.has(child) && !visitedDepth.has(child)) frontier.push([meta.get(child), depth + 1])
        }
      }
      // Any node missed by the BFS (a cycle among non-roots) becomes a root.
      for (const node of meta.values()) {
        if (!depthOf.has(node.id)) {
          depthOf.set(node.id, 0)
          roots.push(node)
        }
      }

      // Vertical order: DFS pre-order per root, siblings in host list order.
      const childList = (id) => (childrenOf.get(id) || []).filter((child) => meta.has(child))
      let index = 0
      const placed = new Set()
      const walk = (node, depth) => {
        if (placed.has(node.id)) return
        placed.add(node.id)
        const y = PAD + index * ROW
        const x = PAD + depth * COL
        nodes.push({ ...node, depth, x, y })
        index += 1
        for (const childId of childList(node.id)) walk(meta.get(childId), depth + 1)
      }
      for (const root of roots) walk(root, depthOf.get(root.id) || 0)
      for (const node of meta.values()) {
        if (!placed.has(node.id)) walk(node, 0)
      }

      for (const node of nodes) {
        if (node.parentId && meta.has(node.parentId)) edges.push({ from: node.parentId, to: node.id })
      }

      let maxDepth = 0
      for (const node of nodes) maxDepth = Math.max(maxDepth, node.depth)
      return {
        nodes,
        edges,
        width: PAD * 2 + (maxDepth + 1) * COL,
        height: PAD * 2 + Math.max(0, nodes.length - 1) * ROW + NODE_H,
        staleCount,
      }
    }

    // ── stylesheet ────────────────────────────────────────────────────────────

    let stylesEnsured = false
    function ensureStyles() {
      if (stylesEnsured || typeof document === 'undefined') return
      stylesEnsured = true
      const css = `
    .dshf-panel { display:flex; flex-direction:column; height:100%; min-height:0; padding:14px 16px; gap:10px;
      color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-layer-1); box-sizing:border-box; }
    .dshf-head { display:flex; align-items:center; gap:10px; flex:none; }
    .dshf-title { font-size:15px; font-weight:600; }
    .dshf-spring { flex:1; }
    .dshf-seg { display:flex; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; overflow:hidden; }
    .dshf-seg > button { border:0; background:transparent; color:var(--dsw-alias-label-secondary); padding:4px 12px; font-size:12px; cursor:pointer; }
    .dshf-seg > button.dshf-on { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
    .dshf-body { display:flex; flex:1; min-height:0; gap:14px; }
    .dshf-folders { width:210px; flex:none; display:flex; flex-direction:column; gap:2px; overflow:auto;
      border-right:1px solid var(--dsw-alias-border-l2); padding-right:8px; }
    .dshf-folder { display:flex; align-items:center; gap:6px; padding:5px 8px; border-radius:6px; cursor:pointer;
      color:var(--dsw-alias-label-primary); font-size:13px; }
    .dshf-folder:hover { background:var(--dsw-alias-interactive-bg-hover); }
    .dshf-folder.dshf-on { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-state-business-primary); font-weight:600; }
    .dshf-folder .dshf-count { margin-left:auto; font-size:11px; color:var(--dsw-alias-label-tertiary); }
    .dshf-folder .dshf-ficon { flex:none; opacity:.8; }
    .dshf-newfolder { display:flex; gap:4px; margin-top:8px; padding-top:8px; border-top:1px solid var(--dsw-alias-border-l2); }
    .dshf-list { flex:1; min-width:0; overflow:auto; display:flex; flex-direction:column; gap:8px; }
    .dshf-entry { border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); border-radius:10px;
      padding:10px 12px; display:flex; flex-direction:column; gap:6px; position:relative; }
    .dshf-entry.dshf-stale { opacity:.6; border-style:dashed; }
    .dshf-entry-name { font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; min-width:0; }
    .dshf-entry-sub { font-size:12px; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dshf-note { font-size:12px; color:var(--dsw-alias-label-secondary); border-left:2px solid var(--dsw-alias-border-l2); padding-left:8px;
      white-space:pre-wrap; word-break:break-word; }
    .dshf-stats { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:11.5px; color:var(--dsw-alias-label-tertiary); }
    .dshf-actions { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
    .dshf-btn { display:inline-flex; align-items:center; justify-content:center; gap:4px; border:1px solid transparent; border-radius:6px;
      background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; padding:3px 7px; font-size:12px; }
    .dshf-btn:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
    .dshf-btn.dshf-primary { background:var(--dsw-alias-state-business-primary); color:var(--dsw-alias-label-primary-inverted); }
    .dshf-btn.dshf-primary:hover { filter:brightness(1.08); }
    .dshf-btn:disabled { opacity:.45; cursor:default; }
    .dshf-badge { display:inline-flex; align-items:center; font-size:10.5px; border-radius:999px; padding:1px 8px;
      border:1px solid var(--dsw-alias-border-l2); color:var(--dsw-alias-label-secondary); flex:none; }
    .dshf-badge.dshf-run { color:var(--dsw-alias-state-success-primary); border-color:var(--dsw-alias-state-success-primary); }
    .dshf-badge.dshf-gone { color:var(--dsw-alias-state-error-primary); border-color:var(--dsw-alias-state-error-primary); }
    .dshf-star { color:var(--dsw-alias-state-business-primary); flex:none; }
    .dshf-popover { position:absolute; top:100%; right:0; margin-top:4px; z-index:40; min-width:180px; max-height:260px; overflow:auto;
      background:var(--dsw-alias-bg-layer-3); border:1px solid var(--dsw-alias-border-l2); border-radius:8px; padding:4px;
      box-shadow:0 8px 24px rgba(0,0,0,.18); }
    .dshf-popover > button { display:block; width:100%; text-align:left; border:0; background:transparent; cursor:pointer;
      color:var(--dsw-alias-label-primary); font-size:12.5px; padding:6px 8px; border-radius:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dshf-popover > button:hover { background:var(--dsw-alias-interactive-bg-hover); }
    .dshf-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:300; display:flex; align-items:center; justify-content:center; }
    .dshf-modal { width:min(460px, 92vw); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary);
      border:1px solid var(--dsw-alias-border-l2); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px;
      box-shadow:0 16px 48px rgba(0,0,0,.28); }
    .dshf-modal-title { font-size:14px; font-weight:600; }
    .dshf-modal-label { font-size:12px; color:var(--dsw-alias-label-secondary); }
    .dshf-input, .dshf-textarea { width:100%; box-sizing:border-box; background:var(--dsw-alias-bg-layer-3); color:var(--dsw-alias-label-primary);
      border:1px solid var(--dsw-alias-border-l2); border-radius:8px; padding:7px 9px; font-size:13px; outline:none; }
    .dshf-input:focus, .dshf-textarea:focus { border-color:var(--dsw-alias-state-business-primary); }
    .dshf-textarea { min-height:84px; resize:vertical; font-family:inherit; }
    .dshf-modal-foot { display:flex; justify-content:flex-end; gap:8px; }
    .dshf-error { font-size:12px; color:var(--dsw-alias-state-error-primary); word-break:break-all; }
    .dshf-empty { flex:1; display:flex; align-items:center; justify-content:center; color:var(--dsw-alias-label-tertiary); font-size:13px;
      text-align:center; padding:24px; }
    .dshf-graph { flex:1; min-width:0; overflow:auto; background:var(--dsw-alias-bg-layer-2); border:1px solid var(--dshf-ignore, var(--dsw-alias-border-l1));
      border-radius:10px; }
    .dshf-graph-hint { font-size:11.5px; color:var(--dsw-alias-label-tertiary); flex:none; }
    .dshf-toast { display:none; position:fixed; left:50%; bottom:36px; transform:translateX(-50%); z-index:9999;
      background:var(--dsw-alias-bg-layer-3); color:var(--dsw-alias-label-primary); border:1px solid var(--dsw-alias-border-l2);
      border-radius:8px; padding:8px 14px; font-size:12.5px; box-shadow:0 8px 24px rgba(0,0,0,.2); max-width:70vw; }
    `
      const style = document.createElement('style')
      style.id = 'dshf-styles'
      style.textContent = css
      document.head.appendChild(style)
    }

    // ── small inline icons (no dependency on host icon-name roulette) ─────────

    function StarIcon({ filled, size }) {
      const s = size || 14
      const path = 'M12 17.25 6.18 20.4l1.11-6.48L2.6 9.36l6.51-.95L12 2.5l2.89 5.91 6.51.95-4.69 4.56 1.11 6.48z'
      return h('svg', {
        className: 'dshf-star', width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true',
        fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linejoin': 'round',
      }, h('path', { d: path }))
    }

    function FolderIcon({ size }) {
      const s = size || 14
      return h('svg', { className: 'dshf-ficon', width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linejoin': 'round' },
        h('path', { d: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.5h8.4A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z' }))
    }

    function PenIcon({ size }) {
      const s = size || 13
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        h('path', { d: 'M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z' }))
    }

    function TrashIcon({ size }) {
      const s = size || 13
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' },
        h('path', { d: 'M4 7h16M9 7V5h6v2m-8.5 0 .8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L18.5 7' }))
    }

    function BranchIcon({ size }) {
      const s = size || 13
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' },
        h('circle', { cx: 6, cy: 5, r: 2.2 }), h('circle', { cx: 6, cy: 19, r: 2.2 }), h('circle', { cx: 18, cy: 12, r: 2.2 }),
        h('path', { d: 'M6 7.2v9.6M6 12h9.8' }))
    }

    function PlayIcon({ size }) {
      const s = size || 13
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'currentColor' },
        h('path', { d: 'M8 5.5v13l10-6.5z' }))
    }

    function RefreshIcon({ size }) {
      const s = size || 13
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round' },
        h('path', { d: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4' }))
    }

    function MoveIcon({ size }) {
      const s = size || 13
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        h('path', { d: 'M12 15V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3' }))
    }

    // ── slot entry components ─────────────────────────────────────────────────

    /** Hover star button (row.action order 250). Filled when favorited. */
    function FavoriteRowButton(props) {
      const sessionId = props && props.sessionId
      const useFavorite = props && props.useFavorite
      const fav = typeof useFavorite === 'function' ? useFavorite((set) => set.has(sessionId)) : favStore.get().favSet.has(sessionId)
      const label = t(fav ? 'remove' : 'favorite')
      const button = h('button', {
        type: 'button',
        'aria-label': label,
        title: label,
        className: 'dshf-btn',
        style: { padding: '2px', borderRadius: '6px' },
        onClick: (event) => {
          try { event.stopPropagation() } catch { /* strip keeps clicks anyway */ }
          toggleFavorite(sessionId)
        },
      }, h(StarIcon, { filled: fav, size: 14 }))
      if (P && typeof P.Tooltip === 'function') {
        try {
          return h(P.Tooltip, { label, side: 'bottom', align: 'end', delayMs: 500 }, button)
        } catch { /* fall through to the bare button */ }
      }
      return button
    }

    /** "..." menu row (order 500): 收藏到收藏夹 / 从收藏夹移除. */
    function FavoriteMenuItem(props) {
      const sessionId = props && props.sessionId
      const useMenuOpenState = props && props.useMenuOpenState
      const useFavorite = props && props.useFavorite
      const fav = typeof useFavorite === 'function' ? useFavorite((set) => set.has(sessionId)) : favStore.get().favSet.has(sessionId)
      const label = t(fav ? 'remove' : 'favorite')
      const select = () => {
        if (typeof useMenuOpenState === 'function') {
          try {
            const [, setMenuOpen] = useMenuOpenState()
            if (typeof setMenuOpen === 'function') setMenuOpen(false)
          } catch { /* menu dismissal is best-effort */ }
        }
        toggleFavorite(sessionId)
      }
      if (P && typeof P.MenuItemButton === 'function') {
        try {
          return h(P.MenuItemButton, {
            icon: h(StarIcon, { filled: fav, size: 14 }),
            onSelect: select,
          }, label)
        } catch { /* fall through to the plain menuitem */ }
      }
      return h('button', { type: 'button', role: 'menuitem', className: 'dshf-btn', onClick: select }, label)
    }

    /** Sidebar icon row for the favorites main panel. */
    function FavoritesPanelIcon(props) {
      const size = (props && props.size) || 18
      return h('span', {
        'aria-hidden': 'true',
        style: { display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center', color: 'var(--dsw-alias-state-business-primary)' },
      }, h(StarIcon, { filled: true, size: size - 3 }))
    }

    // ── panel plumbing hooks ──────────────────────────────────────────────────

    function useFavorites() {
      return useSyncExternalStore(favStore.subscribe, () => favStore.get())
    }

    /** Re-render on host session-list changes; null until the service attaches. */
    function useSessionList() {
      const fav = useFavorites()
      const svcSeq = fav.svcSeq
      const subscribe = useMemo(() => {
        return (fn) => {
          if (!sessionsSvc || !sessionsSvc.list) return () => {}
          return sessionsSvc.list.subscribe(fn)
        }
      }, [svcSeq])
      const getSnapshot = useMemo(() => {
        return () => (sessionsSvc && sessionsSvc.list ? sessionsSvc.list.getSnapshot() : null)
      }, [svcSeq])
      return useSyncExternalStore(subscribe, getSnapshot)
    }

    // ── folders ───────────────────────────────────────────────────────────────

    /** Folder ids in the subtree of `folderId` (inclusive). */
    function folderSubtree(folders, folderId) {
      const byParent = new Map()
      for (const folder of folders) {
        const parent = (folder && folder.parentId) || ''
        if (!byParent.has(parent)) byParent.set(parent, [])
        byParent.get(parent).push(folder.id || '')
      }
      const seen = new Set([folderId])
      const queue = [folderId]
      while (queue.length > 0) {
        const id = queue.pop()
        for (const child of byParent.get(id) || []) {
          if (!seen.has(child)) { seen.add(child); queue.push(child) }
        }
      }
      return seen
    }

    /** Depth of a folder in the folder tree (root folders = 0). */
    function folderDepth(folders, folderId) {
      const byId = new Map(folders.map((folder) => [folder.id, folder]))
      let depth = 0
      let cur = folderId
      let guard = 0
      while (guard++ < 32) {
        const folder = byId.get(cur)
        const parent = folder && folder.parentId
        if (!parent || !byId.has(parent)) break
        depth += 1
        cur = parent
      }
      return depth
    }

    function sortFolders(folders) {
      return [...folders].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN'))
    }

    function sortEntries(entries) {
      return [...entries].sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')))
    }

    // ── dialogs ───────────────────────────────────────────────────────────────

    function Modal({ title, children, footer, error, onClose }) {
      return h('div', { className: 'dshf-overlay', onMouseDown: (event) => { if (event.target === event.currentTarget) onClose() } },
        h('div', { className: 'dshf-modal', role: 'dialog', 'aria-modal': 'true' },
          h('div', { className: 'dshf-modal-title' }, title),
          error ? h('div', { className: 'dshf-error' }, error) : null,
          children,
          h('div', { className: 'dshf-modal-foot' }, footer),
        ))
    }

    function EditEntryDialog({ entry, liveTitle, onClose }) {
      const [name, setName] = useState(entry.name || '')
      const [note, setNote] = useState(entry.note || '')
      const [error, setError] = useState(null)
      const [saving, setSaving] = useState(false)
      const save = () => {
        setSaving(true)
        setError(null)
        api('/entry', { method: 'PUT', body: { sessionId: entry.sessionId, name, note } })
          .then(() => refreshFavorites())
          .then(() => { toast(t('saved')); onClose() })
          .catch((reason) => {
            setSaving(false)
            setError(t('saveFailed') + errText(reason))
            refreshFavorites().catch(() => {})
          })
      }
      return h(Modal, {
        title: t('edit'), error, onClose,
        footer: [
          h('button', { key: 'c', type: 'button', className: 'dshf-btn', onClick: onClose, disabled: saving }, t('cancel')),
          h('button', { key: 's', type: 'button', className: 'dshf-btn dshf-primary', onClick: save, disabled: saving }, t('save')),
        ],
      },
        h('div', { className: 'dshf-modal-label' }, t('displayName')),
        h('input', { className: 'dshf-input', value: name, placeholder: t('displayNamePlaceholder'), onChange: (e) => setName(e.target.value) }),
        h('div', { className: 'dshf-modal-label' }, t('note')),
        h('textarea', { className: 'dshf-textarea', value: note, placeholder: t('notePlaceholder'), onChange: (e) => setNote(e.target.value) }),
        liveTitle ? h('div', { className: 'dshf-modal-label' }, liveTitle) : null)
    }

    function RenameSessionDialog({ sessionId, currentTitle, onClose }) {
      const [title, setTitle] = useState(currentTitle || '')
      const [error, setError] = useState(null)
      const [saving, setSaving] = useState(false)
      const save = () => {
        const trimmed = title.trim()
        if (!trimmed) return
        setSaving(true)
        setError(null)
        renameSessionOnHost(sessionId, trimmed)
          .then(() => refreshFavorites())
          .then(() => { toast(t('saved')); onClose() })
          .catch((reason) => {
            setSaving(false)
            setError(t('renameFailed') + errText(reason))
          })
      }
      return h(Modal, {
        title: t('renameSessionTitle'), error, onClose,
        footer: [
          h('button', { key: 'c', type: 'button', className: 'dshf-btn', onClick: onClose, disabled: saving }, t('cancel')),
          h('button', { key: 's', type: 'button', className: 'dshf-btn dshf-primary', onClick: save, disabled: saving || !title.trim() }, t('save')),
        ],
      },
        h('input', {
          className: 'dshf-input', value: title, autoFocus: true,
          onChange: (e) => setTitle(e.target.value),
          onKeyDown: (e) => { if (e.key === 'Enter') save() },
        }))
    }

    function RenameFolderDialog({ folder, onClose }) {
      const [name, setName] = useState(folder.name || '')
      const [error, setError] = useState(null)
      const save = () => {
        const trimmed = name.trim()
        if (!trimmed) return
        api('/folder', { method: 'PUT', body: { id: folder.id, name: trimmed } })
          .then(() => refreshFavorites())
          .then(() => { onClose() })
          .catch((reason) => setError(t('saveFailed') + errText(reason)))
      }
      return h(Modal, {
        title: t('renameFolder'), error, onClose,
        footer: [
          h('button', { key: 'c', type: 'button', className: 'dshf-btn', onClick: onClose }, t('cancel')),
          h('button', { key: 's', type: 'button', className: 'dshf-btn dshf-primary', onClick: save, disabled: !name.trim() }, t('save')),
        ],
      },
        h('input', {
          className: 'dshf-input', value: name, autoFocus: true,
          onChange: (e) => setName(e.target.value),
          onKeyDown: (e) => { if (e.key === 'Enter') save() },
        }))
    }

    function ConfirmDialog({ title, text, confirmLabel, onConfirm, onClose }) {
      const [error, setError] = useState(null)
      const [busy, setBusy] = useState(false)
      const run = () => {
        setBusy(true)
        Promise.resolve().then(onConfirm)
          .then(() => onClose())
          .catch((reason) => { setBusy(false); setError(errText(reason)) })
      }
      return h(Modal, {
        title, error, onClose,
        footer: [
          h('button', { key: 'c', type: 'button', className: 'dshf-btn', onClick: onClose, disabled: busy }, t('cancel')),
          h('button', { key: 'd', type: 'button', className: 'dshf-btn', onClick: run, disabled: busy }, confirmLabel || t('delete')),
        ],
      }, h('div', { className: 'dshf-modal-label' }, text))
    }

    // ── entry row ─────────────────────────────────────────────────────────────

    function StatsLine({ sessionId, live, t: tt }) {
      if (!live) return null
      const { row, stats, meta } = live
      const parts = []
      if (stats && Number.isFinite(stats.turns)) parts.push(interpolate(tt('statsTurns'), { n: fmtNum(stats.turns) }))
      if (stats && Number.isFinite(stats.steps)) parts.push(interpolate(tt('statsSteps'), { n: fmtNum(stats.steps) }))
      if (stats && Number.isFinite(stats.decodeTokens) && stats.decodeTokens > 0) parts.push(interpolate(tt('statsTokens'), { n: fmtNum(stats.decodeTokens) }))
      if (stats && Number.isFinite(stats.llmMs) && stats.llmMs > 0) parts.push(interpolate(tt('statsLlm'), { n: fmtMs(stats.llmMs) }))
      const snap = sessionsSvc && sessionsSvc.list ? sessionsSvc.list.getSnapshot() : null
      let forks = 0
      if (snap && snap.byId) {
        for (const otherId of snap.ids || []) {
          const other = snap.byId[otherId]
          if (other && (other.parentSessionId ?? other.parentId) === sessionId && other.origin !== 'subagent') forks += 1
        }
      }
      if (forks > 0) parts.push(interpolate(tt('statsForks'), { n: forks }))
      const updated = (row.updatedAt && fmtTime(row.updatedAt)) || (meta && meta.lastPromptAt && fmtTime(meta.lastPromptAt)) || ''
      if (updated) parts.push(interpolate(tt('statsUpdated'), { n: updated }))
      if (parts.length === 0) return null
      return h('div', { className: 'dshf-stats' }, parts.map((part, i) => h('span', { key: i }, part)))
    }

    function EntryRow({ entry, folders, onEdit, onRenameHost, onConfirmRemove, onMove }) {
      const live = sessionRow(entry.sessionId)
      const row = live && live.row
      const display = String(entry.name || '').trim() || (row && row.title) || ''
      const stale = !row
      const running = !!(row && row.running)
      const [moveOpen, setMoveOpen] = useState(false)
      const forkBlocked = stale || !!(row && row.blank)
      const openOrContinue = () => {
        if (stale) { toast(t('staleHint')); return }
        openSession(entry.sessionId)
      }
      return h('div', { className: 'dshf-entry' + (stale ? ' dshf-stale' : '') },
        h('div', { className: 'dshf-entry-name' },
          h(StarIcon, { filled: true, size: 12 }),
          h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, display || entry.sessionId),
          running ? h('span', { className: 'dshf-badge dshf-run' }, t('running')) : null,
          stale ? h('span', { className: 'dshf-badge dshf-gone' }, t('stale')) : null,
          !stale && row.blank ? h('span', { className: 'dshf-badge' }, t('blankSession')) : null,
        ),
        display && row && row.title && String(entry.name || '').trim()
          ? h('div', { className: 'dshf-entry-sub' }, row.title)
          : null,
        entry.note ? h('div', { className: 'dshf-note' }, entry.note) : null,
        stale ? h('div', { className: 'dshf-entry-sub' }, t('staleHint')) : null,
        h(StatsLine, { sessionId: entry.sessionId, live, t }),
        h('div', { className: 'dshf-actions' },
          h('button', { type: 'button', className: 'dshf-btn dshf-primary', onClick: openOrContinue, disabled: stale, title: t('openContinue') },
            h(PlayIcon, {}), h('span', null, t('openContinue'))),
          h('button', {
            type: 'button', className: 'dshf-btn', disabled: forkBlocked,
            title: forkBlocked ? t('forkUnavailable') : t('fork'),
            onClick: () => { if (!forkBlocked) forkSession(entry.sessionId, display || entry.sessionId) },
          }, h(BranchIcon, {}), h('span', null, t('fork'))),
          h('button', { type: 'button', className: 'dshf-btn', onClick: onEdit, title: t('edit') }, h(PenIcon, {}), h('span', null, t('edit'))),
          h('button', {
            type: 'button', className: 'dshf-btn', disabled: stale, title: t('renameSession'),
            onClick: onRenameHost,
          }, h('span', null, t('renameSession'))),
          h('div', { style: { position: 'relative' } },
            h('button', { type: 'button', className: 'dshf-btn', onClick: () => setMoveOpen(!moveOpen), title: t('moveTo') },
              h(MoveIcon, {}), h('span', null, t('moveTo'))),
            moveOpen ? h(MovePopover, {
              folders, currentFolderId: entry.folderId || '', onPick: (folderId) => { setMoveOpen(false); onMove(folderId) },
              onClose: () => setMoveOpen(false),
            }) : null),
          h('button', { type: 'button', className: 'dshf-btn', onClick: onConfirmRemove, title: t('remove') },
            h(TrashIcon, {}), h('span', null, t('remove'))),
          h('span', { className: 'dshf-spring' }),
          entry.addedAt ? h('span', { className: 'dshf-stats' }, interpolate(t('statsAdded'), { n: fmtTime(entry.addedAt) })) : null,
        ))
    }

    function MovePopover({ folders, currentFolderId, onPick, onClose }) {
      const ref = useRef(null)
      useEffect(() => {
        const onDown = (event) => {
          if (ref.current && !ref.current.contains(event.target)) onClose()
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
      }, [onClose])
      const items = [{ id: '', name: t('unfiled') }, ...sortFolders(folders).map((folder) => ({
        id: folder.id,
        name: folder.name || folder.id,
        depth: folderDepth(folders, folder.id),
      }))]
      return h('div', { className: 'dshf-popover', ref },
        items.map((item) => h('button', {
          key: item.id || '__unfiled__',
          type: 'button',
          style: item.id === currentFolderId ? { color: 'var(--dsw-alias-state-business-primary)' } : undefined,
          onClick: () => onPick(item.id),
        }, (item.depth || 0) > 0 ? '　'.repeat(item.depth) : '', item.name)))
    }

    // ── folder column ─────────────────────────────────────────────────────────

    function FolderColumn({ folders, entries, selection, onSelect, onCreate, onRename, onDelete }) {
      const [draft, setDraft] = useState('')
      const countIn = (predicate) => entries.filter(predicate).length
      const total = entries.length
      const unfiled = countIn((entry) => !entry.folderId)
      const submit = () => {
        const name = draft.trim()
        if (!name) return
        onCreate(name, () => setDraft(''))
      }
      return h('div', { className: 'dshf-folders' },
        h('div', {
          className: 'dshf-folder' + (selection.kind === 'all' ? ' dshf-on' : ''),
          onClick: () => onSelect({ kind: 'all' }),
        }, h(StarIcon, { filled: true, size: 13 }), h('span', null, t('allFavorites')), h('span', { className: 'dshf-count' }, total)),
        h('div', {
          className: 'dshf-folder' + (selection.kind === 'unfiled' ? ' dshf-on' : ''),
          onClick: () => onSelect({ kind: 'unfiled' }),
        }, h(FolderIcon, { size: 13 }), h('span', null, t('unfiled')), h('span', { className: 'dshf-count' }, unfiled)),
        sortFolders(folders).map((folder) => {
          const subtree = folderSubtree(folders, folder.id)
          const count = countIn((entry) => subtree.has(entry.folderId || ''))
          const depth = folderDepth(folders, folder.id)
          return h('div', {
            key: folder.id,
            className: 'dshf-folder' + (selection.kind === 'folder' && selection.id === folder.id ? ' dshf-on' : ''),
            style: depth > 0 ? { paddingLeft: 8 + depth * 14 } : undefined,
            onClick: () => onSelect({ kind: 'folder', id: folder.id }),
          },
            h(FolderIcon, { size: 13 }),
            h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, folder.name || folder.id),
            h('span', { className: 'dshf-count' }, count),
            h('button', {
              type: 'button', className: 'dshf-btn', style: { padding: '1px 4px' }, title: t('renameFolder'),
              onClick: (e) => { e.stopPropagation(); onRename(folder) },
            }, h(PenIcon, { size: 11 })),
            h('button', {
              type: 'button', className: 'dshf-btn', style: { padding: '1px 4px' }, title: t('deleteFolder'),
              onClick: (e) => { e.stopPropagation(); onDelete(folder) },
            }, h(TrashIcon, { size: 11 })))
        }),
        h('div', { className: 'dshf-newfolder' },
          h('input', {
            className: 'dshf-input', value: draft, placeholder: t('folderNamePlaceholder'),
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter') submit() },
          }),
          h('button', { type: 'button', className: 'dshf-btn', onClick: submit, disabled: !draft.trim(), title: t('newFolder') }, '+')))
    }

    // ── fork graph view ───────────────────────────────────────────────────────

    function ForkGraphView({ snap, favSet, t: tt }) {
      const layout = useMemo(() => buildGraphLayout(snap, favSet, { cap: 400 }), [snap, favSet])
      if (!layout.nodes.length) {
        return h('div', { className: 'dshf-empty' }, tt('graphEmpty'))
      }
      const open = (id) => openSession(id)
      const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))
      return h('div', { className: 'dshf-graph' },
        h('svg', {
          width: layout.width, height: layout.height, viewBox: '0 0 ' + layout.width + ' ' + layout.height,
          style: { display: 'block' },
        },
          layout.edges.map((edge, i) => {
            const from = nodeById.get(edge.from)
            const to = nodeById.get(edge.to)
            if (!from || !to) return null
            const x1 = from.x + 210
            const y1 = from.y + 16
            const x2 = to.x
            const y2 = to.y + 16
            const bend = Math.max(24, Math.abs(y2 - y1) / 2)
            return h('path', {
              key: i, d: 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + bend) + ' ' + y1 + ', ' + (x2 - bend) + ' ' + y2 + ', ' + x2 + ' ' + y2,
              fill: 'none', stroke: 'var(--dsw-alias-border-l2)', 'stroke-width': 1.4,
            })
          }),
          layout.nodes.map((node) => h(GraphNode, { key: node.id, node, onOpen: open, t: tt })),
        ),
        h('div', { style: { height: 6 } }),
        h('div', { className: 'dshf-graph-hint' },
          tt('graphHint'),
          layout.staleCount > 0 ? ' · ' + interpolate(tt('graphStaleHint'), { n: layout.staleCount }) : null))
    }

    function GraphNode({ node, onOpen, t: tt }) {
      const fill = node.favorited ? 'var(--dsw-alias-bg-layer-3)' : 'var(--dsw-alias-bg-layer-1)'
      const stroke = node.favorited ? 'var(--dsw-alias-state-business-primary)' : 'var(--dsw-alias-border-l2)'
      const labelColor = node.favorited ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-tertiary)'
      return h('g', {
        transform: 'translate(' + node.x + ',' + node.y + ')',
        onClick: () => onOpen(node.id),
        style: { cursor: 'pointer' },
      },
        h('rect', {
          width: 210, height: 32, rx: 8, fill, stroke,
          'stroke-width': node.favorited ? 1.4 : 1, 'stroke-dasharray': node.favorited ? undefined : '4 3',
        }),
        node.running ? h('circle', { cx: 14, cy: 16, r: 3.5, fill: 'var(--dsw-alias-state-success-primary)' }) : null,
        node.favorited ? h('g', { transform: 'translate(22,7) scale(0.42)' }, h('path', {
          d: 'M12 17.25 6.18 20.4l1.11-6.48L2.6 9.36l6.51-.95L12 2.5l2.89 5.91 6.51.95-4.69 4.56 1.11 6.48z',
          fill: 'var(--dsw-alias-state-business-primary)',
        })) : null,
        h('text', {
          x: node.favorited ? 36 : 24, y: 21, fontSize: 12, fill: labelColor,
          style: { pointerEvents: 'none' },
        }, node.title),
        h('title', null, node.title + '\n' + node.id),
      )
    }

    // ── the panel ─────────────────────────────────────────────────────────────

    function FavoritesPanel() {
      const fav = useFavorites()
      const snap = useSessionList()
      const [view, setView] = useState('list')
      const [selection, setSelection] = useState({ kind: 'all', id: '' })
      const [editing, setEditing] = useState(null)
      const [renamingHost, setRenamingHost] = useState(null)
      const [renamingFolder, setRenamingFolder] = useState(null)
      const [deletingFolder, setDeletingFolder] = useState(null)
      const [removing, setRemoving] = useState(null)

      const sessionIds = useMemo(() => fav.entries.map((entry) => entry.sessionId), [fav.entries])
      useEffect(() => { refreshProjectionsQuietly(sessionIds) }, [sessionIds.join('|')])

      const visibleEntries = useMemo(() => {
        if (selection.kind === 'all') return sortEntries(fav.entries)
        if (selection.kind === 'unfiled') return sortEntries(fav.entries.filter((entry) => !entry.folderId))
        const subtree = folderSubtree(fav.folders, selection.id)
        return sortEntries(fav.entries.filter((entry) => subtree.has(entry.folderId || '')))
      }, [fav.entries, fav.folders, selection])

      const createFolder = (name, done) => {
        api('/folder', { method: 'PUT', body: { name } })
          .then((data) => refreshFavorites().then(() => {
            const folder = data && data.folder
            if (folder && folder.id) setSelection({ kind: 'folder', id: folder.id })
          }))
          .then(() => { if (typeof done === 'function') done() })
          .catch((reason) => toast(t('saveFailed') + errText(reason)))
      }
      const moveEntry = (entry, folderId) => {
        const prev = favStore.get()
        const entries = prev.entries.map((item) => (item.sessionId === entry.sessionId ? { ...item, folderId } : item))
        favStore.set({ ...prev, entries, favSet: prev.favSet })
        api('/entry', { method: 'PUT', body: { sessionId: entry.sessionId, folderId } })
          .then(() => refreshFavorites())
          .catch((reason) => {
            refreshFavorites().catch(() => {})
            toast(t('saveFailed') + errText(reason))
          })
      }
      const removeEntry = (entry) => {
        const prev = favStore.get()
        const entries = prev.entries.filter((item) => item.sessionId !== entry.sessionId)
        favStore.set({ ...prev, entries, favSet: deriveFavSet({ entries }) })
        api('/entry?sessionId=' + encodeURIComponent(entry.sessionId), { method: 'DELETE' })
          .then(() => refreshFavorites())
          .catch((reason) => {
            refreshFavorites().catch(() => {})
            toast(t('removeFailed') + errText(reason))
          })
      }
      const deleteFolder = (folder) => {
        return api('/folder?id=' + encodeURIComponent(folder.id), { method: 'DELETE' })
          .then(() => refreshFavorites())
          .then(() => { setSelection((sel) => (sel.kind === 'folder' && folderSubtree(fav.folders, folder.id).has(sel.id) ? { kind: 'all', id: '' } : sel)) })
      }
      const hardRefresh = () => {
        refreshFavorites().catch((reason) => toast(t('loadFailed') + errText(reason)))
        try {
          if (sessionsSvc && typeof sessionsSvc.refresh === 'function') sessionsSvc.refresh().catch(() => {})
        } catch { /* best effort */ }
      }

      if (!fav.loaded) {
        return h('div', { className: 'dshf-panel' }, h('div', { className: 'dshf-empty' }, '…'))
      }

      return h('div', { className: 'dshf-panel' },
        h('div', { className: 'dshf-head' },
          h(StarIcon, { filled: true, size: 16 }),
          h('span', { className: 'dshf-title' }, t('panelLabel')),
          h('span', { className: 'dshf-spring' }),
          h('div', { className: 'dshf-seg' },
            h('button', { type: 'button', className: view === 'list' ? 'dshf-on' : '', onClick: () => setView('list') }, t('viewList')),
            h('button', { type: 'button', className: view === 'graph' ? 'dshf-on' : '', onClick: () => setView('graph') }, t('viewGraph'))),
          h('button', { type: 'button', className: 'dshf-btn', onClick: hardRefresh, title: t('refresh') }, h(RefreshIcon, {}), h('span', null, t('refresh')))),
        !sessionsSvc ? h('div', { className: 'dshf-graph-hint' }, t('serviceMissing')) : null,
        view === 'graph'
          ? h(ForkGraphView, { snap, favSet: fav.favSet, t })
          : h('div', { className: 'dshf-body' },
            h(FolderColumn, {
              folders: fav.folders, entries: fav.entries, selection,
              onSelect: setSelection, onCreate: createFolder,
              onRename: setRenamingFolder, onDelete: setDeletingFolder,
            }),
            h('div', { className: 'dshf-list' },
              visibleEntries.length === 0
                ? h('div', { className: 'dshf-empty' },
                  selection.kind === 'all' ? t('empty') : t('emptyFolder'))
                : visibleEntries.map((entry) => h(EntryRow, {
                  key: entry.sessionId, entry, folders: fav.folders,
                  onEdit: () => setEditing(entry),
                  onRenameHost: () => {
                    const live = sessionRow(entry.sessionId)
                    setRenamingHost({ sessionId: entry.sessionId, currentTitle: (live && live.row && live.row.title) || '' })
                  },
                  onConfirmRemove: () => setRemoving(entry),
                  onMove: (folderId) => moveEntry(entry, folderId),
                })))),
        editing ? h(EditEntryDialog, {
          key: editing.sessionId,
          entry: editing,
          liveTitle: (() => {
            const live = sessionRow(editing.sessionId)
            return (live && live.row && live.row.title) || ''
          })(),
          onClose: () => setEditing(null),
        }) : null,
        renamingHost ? h(RenameSessionDialog, { key: renamingHost.sessionId, sessionId: renamingHost.sessionId, currentTitle: renamingHost.currentTitle, onClose: () => setRenamingHost(null) }) : null,
        renamingFolder ? h(RenameFolderDialog, { key: renamingFolder.id, folder: renamingFolder, onClose: () => setRenamingFolder(null) }) : null,
        deletingFolder ? h(ConfirmDialog, {
          title: t('confirmDeleteTitle'),
          text: interpolate(t('deleteFolderConfirm'), { name: deletingFolder.name || deletingFolder.id }),
          onConfirm: () => deleteFolder(deletingFolder),
          onClose: () => setDeletingFolder(null),
        }) : null,
        removing ? h(ConfirmDialog, {
          title: t('confirmDeleteTitle'),
          text: t('remove') + ' — ' + (removing.name || removing.sessionId),
          confirmLabel: t('remove'),
          onConfirm: () => removeEntry(removing),
          onClose: () => setRemoving(null),
        }) : null)
    }

    // ── module wiring ─────────────────────────────────────────────────────────

    module.exports = {
      name: CLIENT_NAME,
      inject: ['slots', 'locale'],
      apply(ctx) {
        ensureStyles()
        try {
          if (ctx.locale && typeof ctx.locale.register === 'function') {
            ctx.locale.register(NS, 'zh', ZH)
            ctx.locale.register(NS, 'en', EN)
            const bound = ctx.locale.bind(NS)
            if (typeof bound === 'function') {
              localeT = bound
            }
          }
        } catch { /* keep the fallback zh table */ }

        attachServices(ctx)

        const slots = ctx.get('slots')
        if (slots === undefined) return

        const disposers = []
        const registerOnce = (fn) => {
          try { fn() } catch (error) {
            try { ctx.logger.warn('dsh-favorites: slot registration failed — ' + errText(error)) } catch { console.warn(error) }
          }
        }

        // Favorite toggle in the row menu + the hover star strip.
        const favoriteInjected = () => ({ hooks: { favorite: favSetSource }, toggleFavorite })
        registerOnce(() => {
          disposers.push(slots.inject('sidebar.workspaces.session.menu.item', function* () {
            yield slots.register({
              name: 'sidebar.workspaces.session.menu.item',
              id: 'dsh-favorites.favorite',
              order: 500,
              locale: NS,
              inject: favoriteInjected,
            }, FavoriteMenuItem)
          }))
          disposers.push(slots.inject('sidebar.workspaces.session.row.action', function* () {
            yield slots.register({
              name: 'sidebar.workspaces.session.row.action',
              id: 'dsh-favorites.favorite',
              order: 250,
              locale: NS,
              inject: favoriteInjected,
            }, FavoriteRowButton)
          }))
        })

        // The favorites main panel: sidebar icon row + keyed main slot.
        registerOnce(() => {
          disposers.push(slots.inject('sidebar.panellist', () => slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, label: () => t('panelLabel'), order: -95 },
            FavoritesPanelIcon,
          )))
          disposers.push(slots.inject('main', () => slots.register(
            { name: 'main', key: PANEL_ID },
            () => { ensureStyles(); return h(FavoritesPanel) },
          )))
        })

        ctx.effect(() => () => {
          for (const dispose of disposers.splice(0)) {
            try { if (typeof dispose === 'function') dispose() } catch { /* ignore */ }
          }
        }, 'dsh-favorites: slots')

        // First load; failures surface in the panel (loaded stays false) and via toast.
        refreshFavorites().catch((error) => toast(t('loadFailed') + errText(error)))

        // Diagnostic handle (console: __dshFavorites) — same convention as the
        // other ecosystem plugins' window.__dshXxx handles.
        try {
          window.__dshFavorites = {
            store: favStore,
            services: () => ({ sessions: !!sessionsSvc, uiWorkspace: !!uiWorkspaceSvc }),
            sessionsSnap: () => (sessionsSvc && sessionsSvc.list ? sessionsSvc.list.getSnapshot() : null),
            graph: () => buildGraphLayout(sessionsSvc && sessionsSvc.list ? sessionsSvc.list.getSnapshot() : null, favStore.get().favSet, { cap: 400 }),
          }
        } catch { /* diagnostics are best-effort */ }
      },

      __internals: {
        NS,
        ROUTE,
        PANEL_ID,
        ZH,
        EN,
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
      },
    }

    return module.exports
  }
})

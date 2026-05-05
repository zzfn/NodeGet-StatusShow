import { useEffect, useRef, useMemo, useState, useDeferredValue } from 'react'
import { AnimatePresence } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import { LoadingScreen } from './components/LoadingScreen'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { useConfig } from './hooks/useConfig'
import { useNodes } from './hooks/useNodes'
import { Background } from './components/Background'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { NodeCard } from './components/NodeCard'
import { NodeTable } from './components/NodeTable'
import { WorldMap } from './components/WorldMap'
import { NodeDetail } from './components/NodeDetail'
import { TagFilter } from './components/TagFilter'
import { RegionStats } from './components/RegionStats'
import type { Node, View } from './types'

const DEFAULT_LOGO = `${import.meta.env.BASE_URL}logo.png`
const VIEW_KEY = 'nodeget.view'

function initialView(): View {
  const v = localStorage.getItem(VIEW_KEY)
  return v === 'table' ? 'table' : 'cards'
}

function readHash() {
  return decodeURIComponent(window.location.hash.slice(1)) || null
}

export function App() {
  const { config, error: configError } = useConfig()
  const { nodes, errors, fetchNodeTcpHistory, fetchCardHistory, fetchUptimeHistory } = useNodes(config)
  const deferredNodes = useDeferredValue(nodes)

  const [view, setView] = useState<View>(initialView)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeRegion, setActiveRegion] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(readHash)

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

  useEffect(() => {
    if (config?.site_name) document.title = config.site_name
  }, [config?.site_name])

  useEffect(() => {
    const onHash = () => setSelected(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const target = selected ? `#${encodeURIComponent(selected)}` : ''
    if (window.location.hash === target) return
    if (selected) {
      window.location.hash = encodeURIComponent(selected)
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [selected])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const n of deferredNodes.values()) {
      if (n.meta?.hidden) continue
      for (const t of n.meta?.tags ?? []) set.add(t)
    }
    return [...set].sort()
  }, [deferredNodes])

  const regionEntries = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of deferredNodes.values()) {
      if (n.meta?.hidden) continue
      const r = n.meta?.region?.trim().toUpperCase() || ''
      if (r) counts.set(r, (counts.get(r) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [deferredNodes])

  useEffect(() => {
    if (activeTag && !allTags.includes(activeTag)) setActiveTag(null)
  }, [allTags, activeTag])

  const list = useMemo(() => {
    let arr = [...deferredNodes.values()].filter(n => !n.meta?.hidden)
    if (activeRegion) arr = arr.filter(n => n.meta?.region?.trim().toUpperCase() === activeRegion)
    if (activeTag) arr = arr.filter(n => n.meta?.tags?.includes(activeTag))

    const q = query.trim().toLowerCase()
    if (q) {
      arr = arr.filter(n => {
        const hay = [
          n.uuid,
          n.source,
          n.meta?.name,
          n.meta?.region,
          n.meta?.virtualization,
          n.static?.system?.system_host_name,
          n.static?.system?.system_name,
          ...(n.meta?.tags ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }

    return arr.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1
      const ao = a.meta?.order ?? 0
      const bo = b.meta?.order ?? 0
      if (ao !== bo) return ao - bo
      const an = a.meta?.name || a.uuid
      const bn = b.meta?.name || b.uuid
      return an.localeCompare(bn)
    })
  }, [deferredNodes, query, activeTag, activeRegion])

  const selectedNode = selected ? nodes.get(selected) || null : null

  const islandStats = useMemo(() => {
    const visible = [...deferredNodes.values()].filter(n => !n.meta?.hidden)
    if (!visible.length) return null
    const onlineNodes = visible.filter(n => n.online)
    const regions = new Set(onlineNodes.map(n => n.meta?.region?.trim().toUpperCase()).filter(Boolean))
    const totalUp = visible.reduce((s, n) => s + (n.dynamic?.total_transmitted ?? 0), 0)
    const totalDown = visible.reduce((s, n) => s + (n.dynamic?.total_received ?? 0), 0)
    const netUp = visible.reduce((s, n) => s + (n.dynamic?.transmit_speed ?? 0), 0)
    const netDown = visible.reduce((s, n) => s + (n.dynamic?.receive_speed ?? 0), 0)
    return { online: onlineNodes.length, total: visible.length, regions: regions.size, totalUp, totalDown, netUp, netDown }
  }, [deferredNodes])

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>加载 config.json 失败</AlertTitle>
          <AlertDescription>{String(configError.message || configError)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        加载中…
      </div>
    )
  }

  const logo = config.site_logo || DEFAULT_LOGO
  const empty = list.length === 0
  const hasErrors = errors.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <Background />
      <Navbar
        siteName={config.site_name || '你没设置'}
        logo={logo}
        query={query}
        onQuery={setQuery}
        view={view}
        onView={setView}
        stats={islandStats}
        regionEntries={regionEntries}
        activeRegion={activeRegion}
        onRegion={setActiveRegion}
        totalNodes={[...deferredNodes.values()].filter(n => !n.meta?.hidden).length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-10 space-y-4">
        {!empty && <TagFilter tags={allTags} active={activeTag} onChange={setActiveTag} />}

        <AnimatePresence>
          {empty && !hasErrors && <LoadingScreen key="loading" />}
        </AnimatePresence>

        {empty && hasErrors && (
          <div className="py-20 text-center text-muted-foreground">暂无节点</div>
        )}

        {!empty && view === 'cards' && (
          <VirtualCardGrid nodes={list} />
        )}
        {!empty && view === 'table' && <NodeTable nodes={list} onOpen={setSelected} />}
        {view === 'map' && <WorldMap nodes={list} onSelect={setSelected} />}

        {hasErrors && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{errors.length} 个后端错误</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {errors.map((e, i) => (
                  <li key={i}>
                    <b>{e.source}</b>：
                    {e.error instanceof Error ? e.error.message : String(e.error)}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </main>

      <Footer text={config.footer} />

      <NodeDetail
        node={selectedNode}
        onClose={() => setSelected(null)}
        showSource={(config.site_tokens?.length ?? 0) > 1}
        fetchTcpHistory={fetchNodeTcpHistory}
        fetchUptimeHistory={fetchUptimeHistory}
      />
    </div>
  )
}

const COLS = 2
const ROW_GAP = 12  // gap-3 = 12px

function VirtualCardGrid({
  nodes,
}: {
  nodes: Node[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollMarginRef = useRef(0)

  useEffect(() => {
    scrollMarginRef.current = containerRef.current?.offsetTop ?? 0
  })

  const rowCount = Math.ceil(nodes.length / COLS)

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 220,
    overscan: 4,
    scrollMargin: scrollMarginRef.current,
  })

  return (
    <div ref={containerRef}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vRow => {
          const start = vRow.index * COLS
          const rowNodes = nodes.slice(start, start + COLS)
          return (
            <div
              key={vRow.key}
              data-index={vRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${vRow.start - virtualizer.options.scrollMargin}px)`,
                paddingBottom: ROW_GAP,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3">
                {rowNodes.map(n => (
                  <NodeCard key={n.uuid} node={n} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

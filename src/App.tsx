import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { AnimatePresence } from 'motion/react'
import { AlertTriangle, Map as MapIcon } from 'lucide-react'
import { LoadingScreen } from './components/LoadingScreen'
import { Toaster } from './components/ui/sonner'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { useConfig } from './hooks/useConfig'
import { useNodes } from './hooks/useNodes'
import { Background } from './components/Background'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { AlertBanner } from './components/AlertBanner'
import { WorldMap } from './components/WorldMap'
import { NodeDetail } from './components/NodeDetail'
import { NodeGrid } from './components/NodeGrid'
import { deriveUsage } from './utils/derive'
import { resolveCoords } from './utils/coords'
import type { View, Node } from './types'

const DEFAULT_LOGO = `${import.meta.env.BASE_URL}logo.png`

function initialView(): View {
  return 'cards'
}

// ── 聚合流量 Sparkline ────────────────────────────────────────────────────────
function TrafficSparkline({ nodes }: { nodes: Node[] }) {
  const W = 600
  const H = 72
  const PAD = { t: 10, b: 12, l: 8, r: 8 }

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { inPath, outPath, totalIn, totalOut, ins, outs, keys, step, maxVal } = useMemo(() => {
    const BUCKET = 30_000
    const bucketIn = new Map<number, number>()
    const bucketOut = new Map<number, number>()
    for (const n of nodes) {
      for (const h of n.history) {
        const k = Math.floor(h.t / BUCKET) * BUCKET
        bucketIn.set(k, (bucketIn.get(k) ?? 0) + (h.netIn ?? 0))
        bucketOut.set(k, (bucketOut.get(k) ?? 0) + (h.netOut ?? 0))
      }
    }
    const keys = [...new Set([...bucketIn.keys(), ...bucketOut.keys()])].sort()
    if (keys.length < 2) return { inPath: '', outPath: '', totalIn: 0, totalOut: 0, ins: [], outs: [], keys: [], step: 0, maxVal: 1 }

    const ins = keys.map(k => bucketIn.get(k) ?? 0)
    const outs = keys.map(k => bucketOut.get(k) ?? 0)
    const maxVal = Math.max(...ins, ...outs, 1)
    const cW = W - PAD.l - PAD.r
    const cH = H - PAD.t - PAD.b
    const step = cW / (keys.length - 1)

    const toPath = (vals: number[]) =>
      vals
        .map((v, i) => {
          const x = PAD.l + i * step
          const y = PAD.t + cH - (v / maxVal) * cH
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')

    const totalIn = ins[ins.length - 1]
    const totalOut = outs[outs.length - 1]
    return { inPath: toPath(ins), outPath: toPath(outs), totalIn, totalOut, ins, outs, keys, step, maxVal }
  }, [nodes])

  function fmtSpeed(v: number) {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}G`
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
    return `${v.toFixed(0)}B`
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || keys.length < 2) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round((mouseX - PAD.l) / step)
    setHoverIdx(Math.max(0, Math.min(keys.length - 1, idx)))
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const cH = H - PAD.t - PAD.b
  const hoverX = hoverIdx !== null && step > 0 ? PAD.l + hoverIdx * step : null
  const hoverInY = hoverIdx !== null && ins[hoverIdx] !== undefined
    ? PAD.t + cH - (ins[hoverIdx] / maxVal) * cH : null
  const hoverOutY = hoverIdx !== null && outs[hoverIdx] !== undefined
    ? PAD.t + cH - (outs[hoverIdx] / maxVal) * cH : null

  return (
    <div className="relative h-full flex flex-col" style={{ minWidth: 0 }}>
      {/* 图表标头 */}
      <div
        className="flex items-baseline justify-between px-3 pt-1.5 text-[9px] font-mono uppercase tracking-widest shrink-0"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <span>Aggregate Traffic</span>
        <span>
          {hoverIdx !== null && ins[hoverIdx] !== undefined
            ? <>↓{fmtSpeed(ins[hoverIdx])}/s · ↑{fmtSpeed(outs[hoverIdx])}/s</>
            : <>↓{fmtSpeed(totalIn)}/s · ↑{fmtSpeed(totalOut)}/s</>
          }
        </span>
      </div>
      {/* SVG 波形 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoverIdx(null); setMousePos(null) }}
        >
          {inPath && (
            <>
              <path
                d={`${inPath} L ${W - PAD.r} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`}
                fill="hsl(142 71% 45%)"
                opacity={0.1}
              />
              <path
                d={inPath}
                fill="none"
                stroke="hsl(142 71% 45%)"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
          {outPath && (
            <>
              <path
                d={`${outPath} L ${W - PAD.r} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`}
                fill="hsl(217 91% 60%)"
                opacity={0.08}
              />
              <path
                d={outPath}
                fill="none"
                stroke="hsl(217 91% 60%)"
                strokeWidth={1.1}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 3"
                opacity={0.7}
              />
            </>
          )}

          {/* hover 竖线 + 数据点 */}
          {hoverX !== null && (
            <>
              <line
                x1={hoverX} y1={PAD.t} x2={hoverX} y2={H - PAD.b}
                stroke="white" strokeWidth={0.6} opacity={0.3}
              />
              {hoverInY !== null && (
                <circle cx={hoverX} cy={hoverInY} r={2.5} fill="hsl(142 71% 45%)" />
              )}
              {hoverOutY !== null && (
                <circle cx={hoverX} cy={hoverOutY} r={2} fill="hsl(217 91% 60%)" />
              )}
            </>
          )}
        </svg>
      </div>

      {/* 浮动 tooltip */}
      {hoverIdx !== null && mousePos && ins[hoverIdx] !== undefined && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md font-mono"
          style={{ left: mousePos.x + 14, top: mousePos.y - 40 }}
        >
          <div style={{ color: 'hsl(142 71% 45%)' }}>↓ {fmtSpeed(ins[hoverIdx])}/s</div>
          <div style={{ color: 'hsl(217 91% 60%)' }}>↑ {fmtSpeed(outs[hoverIdx])}/s</div>
          <div className="mt-0.5 text-muted-foreground text-[10px]">
            {new Date(keys[hoverIdx]).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 排行榜 ──────────────────────────────────────────────────────────────────
function TopRanking({ nodes, onSelect }: { nodes: Node[]; onSelect: (uuid: string) => void }) {
  function fmtSpeed(v: number) {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}G`
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
    return `${v.toFixed(0)}B`
  }

  const online = nodes.filter(n => n.online)

  const topCpu = [...online]
    .filter(n => n.dynamic?.cpu_usage != null)
    .sort((a, b) => (b.dynamic!.cpu_usage!) - (a.dynamic!.cpu_usage!))
    .slice(0, 5)

  const topMem = [...online]
    .filter(n => n.dynamic?.used_memory && n.dynamic?.total_memory)
    .sort((a, b) => {
      const pa = a.dynamic!.used_memory! / a.dynamic!.total_memory!
      const pb = b.dynamic!.used_memory! / b.dynamic!.total_memory!
      return pb - pa
    })
    .slice(0, 5)

  const topTraffic = [...online]
    .filter(n => n.dynamic)
    .sort((a, b) => {
      const ta = (a.dynamic!.receive_speed ?? 0) + (a.dynamic!.transmit_speed ?? 0)
      const tb = (b.dynamic!.receive_speed ?? 0) + (b.dynamic!.transmit_speed ?? 0)
      return tb - ta
    })
    .slice(0, 5)

  function valueColor(pct: number) {
    if (pct >= 85) return 'hsl(0 80% 60%)'
    if (pct >= 65) return 'hsl(45 90% 55%)'
    return 'hsl(var(--muted-foreground))'
  }

  const col = 'flex-1 min-w-0 px-3 py-2'
  const title = 'text-[9px] font-mono uppercase tracking-widest mb-1.5'
  const row = 'flex items-center justify-between gap-2 py-0.5 text-xs cursor-pointer hover:text-foreground transition-colors'
  const name = 'truncate flex-1 min-w-0'

  if (online.length === 0) return null

  return (
    <div
      className="flex"
      style={{
        background: 'hsl(var(--card) / 0.5)',
        borderBottom: '1px solid hsl(var(--border) / 0.4)',
      }}
    >
      {/* Top CPU */}
      <div className={col} style={{ borderRight: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className={title} style={{ color: 'hsl(var(--muted-foreground))' }}>Top CPU</div>
        {topCpu.map(n => {
          const pct = n.dynamic!.cpu_usage!
          return (
            <div key={n.uuid} className={row} style={{ color: 'hsl(var(--muted-foreground))' }} onClick={() => onSelect(n.uuid)}>
              <span className={name}>{n.meta?.name || n.uuid.slice(0, 8)}</span>
              <span className="font-mono tabular-nums shrink-0" style={{ color: valueColor(pct) }}>{pct.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>

      {/* Top Memory */}
      <div className={col} style={{ borderRight: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className={title} style={{ color: 'hsl(var(--muted-foreground))' }}>Top Mem</div>
        {topMem.map(n => {
          const pct = n.dynamic!.used_memory! / n.dynamic!.total_memory! * 100
          return (
            <div key={n.uuid} className={row} style={{ color: 'hsl(var(--muted-foreground))' }} onClick={() => onSelect(n.uuid)}>
              <span className={name}>{n.meta?.name || n.uuid.slice(0, 8)}</span>
              <span className="font-mono tabular-nums shrink-0" style={{ color: valueColor(pct) }}>{pct.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>

      {/* Top Traffic */}
      <div className={col}>
        <div className={title} style={{ color: 'hsl(var(--muted-foreground))' }}>Top Traffic</div>
        {topTraffic.map(n => {
          const rx = n.dynamic!.receive_speed ?? 0
          const tx = n.dynamic!.transmit_speed ?? 0
          return (
            <div key={n.uuid} className={row} style={{ color: 'hsl(var(--muted-foreground))' }} onClick={() => onSelect(n.uuid)}>
              <span className={name}>{n.meta?.name || n.uuid.slice(0, 8)}</span>
              <span className="font-mono tabular-nums shrink-0 text-[11px]">
                <span style={{ color: 'hsl(142 71% 45%)' }}>↓{fmtSpeed(rx)}</span>
                <span className="opacity-40 mx-0.5">/</span>
                <span style={{ color: 'hsl(217 91% 60%)' }}>↑{fmtSpeed(tx)}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 状态色辅助 ──────────────────────────────────────────────────────────────
function nodeStatus(n: Node): 'ok' | 'warn' | 'alert' {
  if (!n.online) return 'alert'
  const u = deriveUsage(n)
  if ((u.cpu ?? 0) >= 85 || (u.mem ?? 0) >= 95 || (u.disk ?? 0) >= 90) return 'alert'
  if ((u.cpu ?? 0) >= 65 || (u.mem ?? 0) >= 80 || (u.disk ?? 0) >= 80) return 'warn'
  return 'ok'
}

// ── 状态计数组件 ─────────────────────────────────────────────────────────────
function StatusCounts({ nodes }: { nodes: Node[] }) {
  const ok    = nodes.filter(n => nodeStatus(n) === 'ok').length
  const warn  = nodes.filter(n => nodeStatus(n) === 'warn').length
  const alert = nodes.filter(n => nodeStatus(n) === 'alert').length

  return (
    // wireframe: .counts { padding:10px 14px; display:flex; flex-direction:column; gap:4px; min-width:180px }
    <div
      style={{
        borderRight: '1px solid hsl(var(--border) / 0.5)',
        minWidth: 180,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        padding: '10px 14px',
        flexShrink: 0,
      }}
    >
      {([
        { n: ok,    label: 'Operational', color: 'hsl(142 71% 45%)' },
        { n: warn,  label: 'Alert',        color: 'hsl(45 90% 55%)' },
        { n: alert, label: 'Offline/Halt', color: 'hsl(0 80% 55%)' },
      ] as const).map(({ n, label, color }) => (
        // wireframe: .count { grid-template-columns: 11px auto 1fr; gap: 10px }
        <div
          key={label}
          style={{
            display: 'grid',
            gridTemplateColumns: '11px auto 1fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {/* wireframe: .count .dot { width:11px; height:11px; border-radius:50% } */}
          <span
            style={{
              width: 11, height: 11, borderRadius: '50%',
              background: color, flexShrink: 0,
            }}
          />
          {/* wireframe: .count .n { font-family:'Caveat'; font-size:28px; font-weight:700 } */}
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 700,
              fontSize: 28,
              lineHeight: 1,
              color: 'hsl(var(--foreground))',
            }}
          >
            {n}
          </span>
          {/* wireframe: .count .l { font-size:10px; letter-spacing:.18em; text-align:right } */}
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              color: 'hsl(var(--muted-foreground))',
              textTransform: 'uppercase',
              textAlign: 'right',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── 迷你世界地图 ──────────────────────────────────────────────────────────────
function MiniWorldMap({
  nodes,
  onViewMap,
}: {
  nodes: Node[]
  onViewMap?: () => void
}) {
  const W = 320
  const H = 110

  const pins = useMemo(() => {
    const seen = new Map<string, { x: number; y: number; color: string }>()
    for (const n of nodes) {
      const c = resolveCoords(n.meta)
      if (!c) continue
      const [lng, lat] = c
      const x = ((lng + 180) / 360) * W
      const y = ((75 - lat) / 130) * H
      const key = `${Math.round(x)},${Math.round(y)}`
      if (!seen.has(key)) {
        const s = nodeStatus(n)
        seen.set(key, {
          x,
          y,
          color:
            s === 'alert'
              ? 'hsl(0 80% 55%)'
              : s === 'warn'
                ? 'hsl(45 90% 55%)'
                : 'hsl(142 71% 45%)',
        })
      }
    }
    return [...seen.values()]
  }, [nodes])

  return (
    <button
      type="button"
      onClick={onViewMap}
      className="relative h-full min-w-[180px] flex-1 overflow-hidden cursor-pointer"
      style={{
        borderLeft: '1px solid hsl(var(--border) / 0.5)',
        background: 'hsl(var(--card) / 0.4)',
      }}
      title="打开世界地图"
    >
      {/* 极简大陆轮廓 */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.25 }}
      >
        <g fill="hsl(var(--foreground))" stroke="none">
          {/* 亚洲 */}
          <path d="M220 18 Q260 12 290 28 Q310 45 300 65 Q285 80 265 75 Q240 70 225 55 Q210 42 220 18 Z" />
          {/* 欧洲 */}
          <path d="M160 16 Q185 12 195 28 Q200 45 188 55 Q175 60 162 50 Q148 38 160 16 Z" />
          {/* 北美 */}
          <path d="M45 18 Q90 10 110 35 Q120 58 105 72 Q85 78 65 70 Q40 58 35 38 Z" />
          {/* 南美 */}
          <path d="M72 82 Q88 74 100 90 Q105 108 95 118 Q80 122 70 110 Q60 96 72 82 Z" />
          {/* 非洲 */}
          <path d="M178 52 Q195 48 202 68 Q206 90 198 108 Q185 118 172 108 Q160 90 164 70 Z" />
        </g>
      </svg>

      {/* 节点点 */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
      >
        {pins.map(({ x, y, color }, i) => (
          <circle
            key={i}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={3}
            fill={color}
            stroke="hsl(var(--background))"
            strokeWidth={0.8}
          />
        ))}
      </svg>

      {/* 右下角标签 */}
      <div
        className="absolute bottom-1 right-1.5 text-[9px] uppercase tracking-[0.15em] font-mono opacity-60 flex items-center gap-1"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <MapIcon className="w-2.5 h-2.5" />
        Map
      </div>
    </button>
  )
}


export function App() {
  const { config, error: configError } = useConfig()
  const { nodes, errors, loading, fetchNodeTcpHistory, fetchUptimeHistory, prefetchAllHistory } = useNodes(config)
  const deferredNodes = useDeferredValue(nodes)

  const topStickyRef = useRef<HTMLDivElement>(null)
  const [topH, setTopH] = useState(0)
  useEffect(() => {
    const el = topStickyRef.current
    if (!el) return
    const ro = new ResizeObserver(es => {
      for (const e of es) setTopH(Math.round(e.contentRect.height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const prefetchedRef = useRef(false)
  useEffect(() => {
    if (prefetchedRef.current) return
    if (nodes.size === 0) return
    prefetchedRef.current = true
    prefetchAllHistory([...nodes.keys()], 30)
  }, [nodes, prefetchAllHistory])

  const [view, setView] = useState<View>(initialView)
  const [query, setQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState<string | null>(null)
  const [alertOnly, setAlertOnly] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (config?.site_name) document.title = config.site_name
  }, [config?.site_name])

  const regionCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const n of deferredNodes.values()) {
      if (n.meta?.hidden) continue
      const r = n.meta?.region?.trim().toUpperCase()
      if (r) map.set(r, (map.get(r) ?? 0) + 1)
    }
    return map
  }, [deferredNodes])

  const allRegions = useMemo(() =>
    [...regionCounts.keys()].sort(),
    [regionCounts],
  )

  useEffect(() => {
    if (activeRegion && !allRegions.includes(activeRegion)) setActiveRegion(null)
  }, [allRegions, activeRegion])

  const allNodes = useMemo(
    () => [...deferredNodes.values()].filter(n => !n.meta?.hidden),
    [deferredNodes],
  )

  const alertCount = useMemo(
    () => allNodes.filter(n => nodeStatus(n) !== 'ok').length,
    [allNodes],
  )

  const list = useMemo(() => {
    let arr = [...deferredNodes.values()].filter(n => !n.meta?.hidden)

    const q = query.trim().toLowerCase()
    if (q) {
      arr = arr.filter(n => {
        const hay = [
          n.uuid,
          n.source,
          n.meta?.name,
          n.meta?.region,
          n.static?.system?.system_host_name,
          n.static?.system?.system_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }

    if (activeRegion) {
      arr = arr.filter(n => n.meta?.region?.trim().toUpperCase() === activeRegion)
    }

    if (alertOnly) {
      arr = arr.filter(n => nodeStatus(n) !== 'ok')
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
  }, [deferredNodes, query, activeRegion, alertOnly])

  const selectedNode = selected ? nodes.get(selected) || null : null

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
    return <LoadingScreen />
  }

  const logo = config.site_logo || DEFAULT_LOGO
  const empty = list.length === 0
  const hasErrors = errors.length > 0
  const showLoading = loading && allNodes.length === 0

  return (
    <div className="min-h-screen flex flex-col">
      <Background />

      <Navbar
        siteName={config.site_name || '节点监控'}
        logo={logo}
        regions={allRegions}
        regionCounts={regionCounts}
        activeRegion={activeRegion}
        alertCount={alertCount}
        alertOnly={alertOnly}
        query={query}
        onRegionChange={r => { setActiveRegion(r); setAlertOnly(false) }}
        onAlertToggle={() => { setAlertOnly(v => !v); setActiveRegion(null) }}
        onQueryChange={setQuery}
        onHome={() => {
          setActiveRegion(null)
          setAlertOnly(false)
          setQuery('')
          setSelected(null)
          setView('cards')
        }}
      />

      <main className="flex-1 min-w-0 pt-11 pb-0">

        {/* 地图视图 */}
        {view === 'map' && (
          <div className="h-[calc(100vh-44px)]">
            <WorldMap nodes={allNodes} onSelect={setSelected} />
          </div>
        )}

        {view !== 'map' && (
          <>
            {/* ── 粘性顶部区域：仅告警 ── */}
            <div ref={topStickyRef} className="sticky top-11 z-30 backdrop-blur-sm">
              {!showLoading && allNodes.length > 0 && (
                <AlertBanner nodes={allNodes} onSelect={setSelected} />
              )}
            </div>

            {/* ── 非粘性汇总区域 ── */}
            {!showLoading && allNodes.length > 0 && (
              <div style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
                {/* 状态计数 | 流量图 | 迷你地图 */}
                <div style={{
                  background: 'hsl(var(--card) / 0.5)',
                  borderBottom: '1px solid hsl(var(--border) / 0.3)',
                  display: 'grid',
                  gridTemplateColumns: 'auto 2fr 1fr',
                }}>
                  <StatusCounts nodes={allNodes} />
                  <div className="min-w-0 overflow-hidden">
                    <TrafficSparkline nodes={allNodes} />
                  </div>
                  <MiniWorldMap nodes={allNodes} onViewMap={() => setView('map')} />
                </div>
                {/* 排行榜 */}
                <TopRanking nodes={allNodes} onSelect={setSelected} />
              </div>
            )}

            {/* 加载态 */}
            <AnimatePresence>
              {showLoading && !hasErrors && <LoadingScreen key="loading" />}
            </AnimatePresence>

            {!showLoading && allNodes.length > 0 && empty && (
              <div
                className="py-20 text-center text-sm"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                没有符合条件的节点
              </div>
            )}

            {/* 节点卡片网格 */}
            {!showLoading && !empty && (
              <NodeGrid nodes={list} onSelect={setSelected} />
            )}
          </>
        )}

        {/* 错误提示 */}
        {hasErrors && (
          <div className="px-3 py-2">
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
          </div>
        )}
      </main>

      <Footer text={config.footer} nodes={allNodes} />

      <NodeDetail
        node={selectedNode}
        onClose={() => setSelected(null)}
        showSource={(config.site_tokens?.length ?? 0) > 1}
        fetchTcpHistory={fetchNodeTcpHistory}
        fetchUptimeHistory={fetchUptimeHistory}
      />
      <Toaster />
    </div>
  )
}

import { useMemo } from 'react'
import type { Node } from '../types'
import { deriveUsage, displayName } from '../utils/derive'

const UP = 'hsl(142 71% 45%)'
const DOWN = 'hsl(0 72% 56%)'
const FLAT = 'hsl(var(--nx-text-dim))'

function deltaCpu(node: Node, minutes = 5): number | null {
  const h = node.history
  if (!h || h.length < 2) return null
  const now = h[h.length - 1]
  const tCutoff = now.t - minutes * 60_000
  let prev = h[0]
  for (const s of h) {
    if (s.t <= tCutoff) prev = s
    else break
  }
  if (prev.cpu == null || now.cpu == null) return null
  return now.cpu - prev.cpu
}

type Mover = {
  uuid: string
  name: string
  cpu: number | null
  delta: number
}

const MAX = 5

export function TopMovers({ nodes, onSelect }: { nodes: Node[]; onSelect?: (uuid: string) => void }) {
  const { gainers, losers } = useMemo(() => {
    const all: Mover[] = []
    for (const n of nodes) {
      if (!n.online) continue
      const d = deltaCpu(n)
      if (d == null || Math.abs(d) < 0.1) continue
      const u = deriveUsage(n)
      all.push({ uuid: n.uuid, name: displayName(n), cpu: u.cpu, delta: d })
    }
    const sorted = [...all].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    const g = sorted.filter(m => m.delta > 0).slice(0, MAX)
    const l = sorted.filter(m => m.delta < 0).slice(0, MAX)
    return { gainers: g, losers: l }
  }, [nodes])

  return (
    <div
      className="flex flex-col overflow-hidden shrink-0"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] font-mono shrink-0"
        style={{
          background: 'hsl(var(--secondary))',
          color: 'hsl(var(--nx-text-secondary))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <span>Top Movers · Δ5m CPU</span>
        <span className="text-[9px]" style={{ color: 'hsl(var(--nx-text-dim))' }}>
          {gainers.length + losers.length} active
        </span>
      </div>

      <div className="grid grid-cols-2" style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
        <div
          className="px-4 py-1 text-[9px] font-bold uppercase tracking-[0.18em] font-mono text-center"
          style={{ color: UP, background: 'hsl(142 71% 45% / 0.08)', borderRight: '1px solid hsl(var(--border) / 0.4)' }}
        >
          ▲ Gainers
        </div>
        <div
          className="px-4 py-1 text-[9px] font-bold uppercase tracking-[0.18em] font-mono text-center"
          style={{ color: DOWN, background: 'hsl(0 72% 56% / 0.08)' }}
        >
          ▼ Losers
        </div>
      </div>

      <div className="grid grid-cols-2">
        <MoverColumn list={gainers} dir="up" onSelect={onSelect} />
        <MoverColumn list={losers} dir="down" onSelect={onSelect} borderLeft />
      </div>
    </div>
  )
}

function MoverColumn({
  list,
  dir,
  onSelect,
  borderLeft,
}: {
  list: Mover[]
  dir: 'up' | 'down'
  onSelect?: (uuid: string) => void
  borderLeft?: boolean
}) {
  const color = dir === 'up' ? UP : DOWN
  const sym = dir === 'up' ? '▲' : '▼'
  return (
    <div
      className="flex flex-col"
      style={{ borderLeft: borderLeft ? '1px solid hsl(var(--border) / 0.4)' : undefined }}
    >
      {list.length === 0 ? (
        <div className="px-4 py-3 text-[10px] text-center font-mono" style={{ color: FLAT }}>
          —
        </div>
      ) : (
        list.map(m => (
          <button
            key={m.uuid}
            type="button"
            onClick={() => onSelect?.(m.uuid)}
            className="grid items-center gap-2 px-3 py-1.5 text-[11px] font-mono tabular-nums hover:bg-[hsl(var(--secondary)/0.5)] text-left cursor-pointer w-full appearance-none bg-transparent border-0 m-0 font-[inherit]"
            style={{
              gridTemplateColumns: 'minmax(0,1fr) 44px 56px',
              borderBottom: '1px solid hsl(var(--border) / 0.2)',
              color: 'hsl(var(--nx-text-primary))',
            }}
          >
            <span className="truncate font-semibold">{m.name}</span>
            <span className="text-right opacity-75 text-[10px]">
              {m.cpu == null ? '—' : `${m.cpu.toFixed(0)}%`}
            </span>
            <span className="text-right font-bold" style={{ color }}>
              {sym} {dir === 'up' ? '+' : ''}
              {m.delta.toFixed(2)}
            </span>
          </button>
        ))
      )}
    </div>
  )
}

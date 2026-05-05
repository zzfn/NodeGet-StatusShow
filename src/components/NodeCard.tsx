import { ArrowDown, ArrowUp, Clock, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { Progress } from './ui/progress'
import { Flag } from './Flag'
import { StatusDot } from './StatusDot'
import { bytes, relativeAge, uptime } from '../utils/format'
import { cpuLabel, deriveUsage, displayName, distroLogo, osLabel, virtLabel } from '../utils/derive'
import { cn, loadColor } from '../utils/cn'
import { ispColor, shortCron } from '../utils/tcpping'
import { memo } from 'react'
import type { Node, TcpPingRecord } from '../types'
import type { ReactNode } from 'react'

export const NodeCard = memo(function NodeCard({
  node,
}: {
  node: Node
}) {
  const u = deriveUsage(node)
  const tags = Array.isArray(node.meta?.tags) ? node.meta.tags : []
  const os = osLabel(node)
  const logo = distroLogo(node)
  const virt = virtLabel(node)
  const cpu = cpuLabel(node)

  return (
    <a href={`#${encodeURIComponent(node.uuid)}`} className="block group">
      <div className={cn(
        'card-nexus transition-all duration-300 flex flex-col gap-3 p-4',
        node.online ? 'card-online' : 'card-offline opacity-50',
      )}>
        {/* 身份行 */}
        <div className="flex items-center gap-2">
          <StatusDot online={node.online} />
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 shrink-0 object-contain" loading="lazy" />
          )}
          <span
            className="font-semibold flex-1 min-w-0 truncate"
            style={{ color: 'hsl(var(--nx-text-primary))' }}
            title={displayName(node)}
          >
            {displayName(node)}
          </span>
          <Flag code={node.meta?.region} className="shrink-0" />
        </div>

        {(os || virt) && (
          <div className="font-mono text-xs truncate" style={{ color: 'hsl(var(--nx-text-dim))' }}>
            {[os, virt].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* 三个指标 */}
        <div className="flex flex-col gap-2.5">
          <Metric label="CPU" value={u.cpu} valueColor="hsl(var(--nx-cpu))" sub={cpu || null} subTitle={cpu || undefined} />
          <Metric
            label="内存"
            value={u.mem}
            valueColor="hsl(var(--nx-mem))"
            sub={u.memTotal ? `${bytes(u.memUsed)} / ${bytes(u.memTotal)}` : null}
          />
          <Metric
            label="磁盘"
            value={u.disk}
            valueColor="hsl(var(--nx-disk))"
            sub={u.diskTotal ? `${bytes(u.diskUsed)} / ${bytes(u.diskTotal)}` : null}
          />
        </div>

        {/* 网速 + 运行时长 + ping */}
        <div
          className="pt-2.5 border-t border-dashed font-mono text-xs space-y-1.5"
          style={{ color: 'hsl(var(--nx-text-dim))' }}
        >
          <div className="flex items-center gap-3">
            <Stat icon={ArrowDown}><AnimatedBytes value={u.netIn || 0} suffix="/s" /></Stat>
            <Stat icon={ArrowUp}><AnimatedBytes value={u.netOut || 0} suffix="/s" /></Stat>
            {node.tcpPings.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                {latestPerCron(node.tcpPings).map(({ cron, latency }) => (
                  <span key={cron} className="inline-flex items-center gap-0.5">
                    <span style={{ color: ispColor(cron) }}>●</span>
                    <span>{shortCron(cron)}</span>
                    <span className="ml-0.5" style={{ color: 'hsl(var(--nx-cpu))' }}>
                      {latency.toFixed(0)}ms
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Stat icon={Clock}>{uptime(u.uptime)}</Stat>
            <span className="ml-auto">{relativeAge(u.ts)}</span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded-sm"
                style={{
                  border: '1px solid hsl(var(--nx-accent) / 0.2)',
                  color: 'hsl(var(--nx-accent) / 0.8)',
                  background: 'hsl(var(--nx-accent) / 0.06)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  )
}, (prev, next) =>
  prev.node.uuid === next.node.uuid &&
  prev.node.online === next.node.online &&
  prev.node.dynamic?.timestamp === next.node.dynamic?.timestamp &&
  prev.node.history === next.node.history &&
  prev.node.tcpPings === next.node.tcpPings,
)

/* ── helpers ── */

function latestPerCron(pings: TcpPingRecord[]): { cron: string; latency: number }[] {
  const byGroup = new Map<string, number[]>()
  for (const p of pings) {
    if (p.latency == null) continue
    const arr = byGroup.get(p.cron) ?? []
    arr.push(p.latency)
    byGroup.set(p.cron, arr)
  }
  return [...byGroup.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cron, latencies]) => ({
      cron,
      latency: latencies.reduce((s, v) => s + v, 0) / latencies.length,
    }))
}

const SPRING = { stiffness: 80, damping: 18, mass: 0.5 }

function useDirectionColor(value: number | undefined) {
  const prev = useRef(value)
  const [cls, setCls] = useState('')
  useEffect(() => {
    const p = prev.current
    prev.current = value
    if (p === undefined || value === undefined || p === value) return
    setCls(value > p ? 'text-green-500' : 'text-red-500')
    const t = setTimeout(() => setCls(''), 1200)
    return () => clearTimeout(t)
  }, [value])
  return cls
}

function AnimatedPct({ value, baseColor }: { value: number | undefined; baseColor?: string }) {
  const mv = useMotionValue(value ?? 0)
  const spring = useSpring(mv, SPRING)
  const display = useTransform(spring, (n: number) => `${Math.max(0, Math.min(100, n)).toFixed(1)}%`)
  const colorCls = useDirectionColor(value)
  useEffect(() => { mv.set(value ?? 0) }, [value, mv])
  if (value == null || !Number.isFinite(value)) return <span className="font-mono">—</span>
  return (
    <motion.span
      className={cn('font-mono transition-colors duration-700', colorCls)}
      style={colorCls ? {} : (baseColor ? { color: baseColor } : {})}
    >
      {display}
    </motion.span>
  )
}

function AnimatedBytes({ value, suffix = '' }: { value: number; suffix?: string }) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, SPRING)
  const display = useTransform(spring, (n: number) => bytes(Math.max(0, n)) + suffix)
  const colorCls = useDirectionColor(value)
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span className={cn('font-mono transition-colors duration-700', colorCls)}>{display}</motion.span>
}

function Stat({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  )
}

function Metric({
  label,
  value,
  valueColor,
  sub,
  subTitle,
}: {
  label: string
  value: number | undefined
  valueColor?: string
  sub?: string | null
  subTitle?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
          <span className="shrink-0" style={{ color: 'hsl(var(--nx-text-dim))' }}>{label}</span>
          {sub && (
            <span
              className="font-mono text-[10px] truncate"
              style={{ color: 'hsl(var(--nx-text-dim) / 0.65)' }}
              title={subTitle ?? sub}
            >
              {sub}
            </span>
          )}
        </div>
        <AnimatedPct value={value} baseColor={valueColor} />
      </div>
      <Progress value={value} indicatorClassName={loadColor(value)} className="mt-1 h-1.5" />
    </div>
  )
}

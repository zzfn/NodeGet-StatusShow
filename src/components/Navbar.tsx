import { useRef, useState, useEffect } from 'react'
import { AlignJustify, Globe, Grip, Moon, Search as SearchIcon, Sun, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { useTheme } from '../hooks/useTheme'
import { bytes } from '../utils/format'
import { Flag } from './Flag'
import type { View } from '../types'

export interface NavStats {
  online: number
  total: number
  regions: number
  netUp: number
  netDown: number
}

interface Props {
  siteName: string
  logo?: string
  query: string
  onQuery: (v: string) => void
  view: View
  onView: (v: View) => void
  stats?: NavStats | null
  regionEntries?: [string, number][]
  activeRegion?: string | null
  onRegion?: (r: string | null) => void
  totalNodes?: number
}

export function Navbar({
  siteName, logo, query, onQuery, view, onView, stats,
  regionEntries = [], activeRegion, onRegion, totalNodes = 0,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme, toggle } = useTheme()
  const hasRegions = regionEntries.length > 0

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
    else onQuery('')
  }, [searchOpen])

  return (
    <header className="navbar-strip sticky top-0 z-50">
      {/* ── 主控件行 ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-3">

        {/* Logo + name */}
        <a href="./" className="flex items-center gap-2 shrink-0 mr-1">
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 rounded-full object-cover opacity-90" />
          )}
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'hsl(var(--nx-accent))' }}>
            {siteName}
          </span>
        </a>

        {/* Stats inline */}
        {stats && (
          <div
            className="flex items-center gap-1.5 sm:gap-3 text-[11px] pl-3 border-l"
            style={{ borderColor: 'hsl(var(--nx-accent) / 0.15)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="online-dot" />
              <span style={{ color: 'hsl(var(--nx-online))' }} className="font-semibold">{stats.online}</span>
              <span style={{ color: 'hsl(var(--nx-text-dim))' }}>/ {stats.total}</span>
            </span>
            <span className="hidden sm:inline" style={{ color: 'hsl(var(--nx-text-dim))' }}>·</span>
            <span className="hidden sm:inline" style={{ color: 'hsl(var(--nx-cpu))' }}>↑ {bytes(stats.netUp)}/s</span>
            <span className="hidden sm:inline" style={{ color: 'hsl(var(--nx-online))' }}>↓ {bytes(stats.netDown)}/s</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Search input */}
        <div className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          searchOpen ? 'w-44 opacity-100' : 'w-0 opacity-0',
        )}>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索节点…"
            value={query}
            onChange={e => onQuery(e.target.value)}
            className="bg-transparent text-[13px] outline-none w-full border-b pb-0.5"
            style={{
              color: 'hsl(var(--foreground))',
              borderColor: 'hsl(var(--nx-accent) / 0.4)',
              caretColor: 'hsl(var(--nx-accent))',
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center">
          <NavBtn onClick={() => setSearchOpen(o => !o)} active={searchOpen} title={searchOpen ? '关闭' : '搜索'}>
            {searchOpen ? <X className="h-4 w-4" /> : <SearchIcon className="h-4 w-4" />}
          </NavBtn>
          <Sep />
          <NavBtn onClick={() => onView('cards')} active={view === 'cards'} title="卡片">
            <Grip className="h-4 w-4" />
          </NavBtn>
          <NavBtn onClick={() => onView('table')} active={view === 'table'} title="表格">
            <AlignJustify className="h-4 w-4" />
          </NavBtn>
          <NavBtn onClick={() => onView('map')} active={view === 'map'} title="地图">
            <Globe className="h-4 w-4" />
          </NavBtn>
          <Sep />
          <NavBtn onClick={toggle} title={theme === 'dark' ? '亮色' : '暗色'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </NavBtn>
        </div>
      </div>

      {/* ── 区域筛选行（有多个区域时显示）── */}
      {hasRegions && onRegion && (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none"
          style={{ borderTop: '1px solid hsl(var(--nx-accent) / 0.08)' }}
        >
          <div className="flex gap-1.5 py-2 w-max min-w-full">
            <RegionChip
              selected={activeRegion === null}
              onClick={() => onRegion(null)}
            >
              全部
              <Count>{totalNodes}</Count>
            </RegionChip>
            {regionEntries.map(([region, count]) => (
              <RegionChip
                key={region}
                selected={activeRegion === region}
                onClick={() => onRegion(activeRegion === region ? null : region)}
              >
                <Flag code={region} className="mr-1" />
                {region}
                <Count>{count}</Count>
              </RegionChip>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

function Sep() {
  return <div className="w-px h-4 mx-1 shrink-0" style={{ background: 'hsl(var(--nx-accent) / 0.15)' }} />
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5" style={{ color: 'hsl(var(--nx-text-dim))' }}>
      {children}
    </span>
  )
}

function RegionChip({
  selected, onClick, children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('chip-nexus', selected && 'chip-nexus-active')}
    >
      {children}
    </button>
  )
}

function NavBtn({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-1.5 rounded transition-all duration-150 shrink-0"
      style={active
        ? { color: 'hsl(var(--nx-accent))', background: 'hsl(var(--nx-accent) / 0.1)' }
        : { color: 'hsl(var(--nx-text-muted))' }
      }
    >
      {children}
    </button>
  )
}

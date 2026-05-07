import { Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { Flag } from './Flag'
import { cn } from '../utils/cn'

interface Props {
  siteName: string
  logo?: string
  regions?: string[]
  regionCounts?: Map<string, number>
  activeRegion?: string | null
  onRegionChange?: (r: string | null) => void
  onMenuOpen?: () => void
}

export function Navbar({ siteName, logo, regions, regionCounts, activeRegion, onRegionChange, onMenuOpen }: Props) {
  const { theme, toggle } = useTheme()
  const hasRegions = (regions?.length ?? 0) > 1
  const isDark = theme === 'dark'

  return (
    /* 外层：fixed 定位 + 四边留白 */
    <header className="fixed top-3 left-3 right-3 z-50 h-12">
      {/* 内层：浮动圆角毛玻璃卡片 */}
      <div
        className="h-full px-4 flex items-center gap-2 min-w-0 rounded-2xl"
        style={{
          background: isDark
            ? 'rgba(12, 16, 26, 0.55)'
            : 'rgba(248, 250, 252, 0.55)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.07)'
            : '1px solid rgba(0,0,0,0.08)',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5)'
            : '0 4px 24px rgba(0,0,0,0.1)',
        }}
      >
        {/* 汉堡菜单（移动端） */}
        <button
          type="button"
          onClick={onMenuOpen}
          className="lg:hidden p-1.5 rounded transition-colors shrink-0"
          style={{ color: 'hsl(var(--nx-text-muted))' }}
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Logo + 站点名（SpaceX 风格：大写 + 字间距） */}
        <a href="./" className="flex items-center gap-2.5 shrink-0">
          {logo && (
            <img src={logo} alt="" className="w-5 h-5 rounded-full object-cover" />
          )}
          <span
            className="text-xs font-bold tracking-[0.18em] uppercase"
            style={{ color: 'hsl(var(--nx-text-primary))' }}
          >
            {siteName}
          </span>
        </a>

        {hasRegions && (
          <div className="w-px h-3.5 mx-1 shrink-0" style={{ background: 'hsl(var(--border))' }} />
        )}

        {/* 地区筛选 chips */}
        {hasRegions && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onRegionChange?.(null)}
              className={cn(
                'px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors shrink-0',
                !activeRegion ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              全部
            </button>
            {regions!.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => onRegionChange?.(activeRegion === r ? null : r)}
                className={cn(
                  'px-3 py-1.5 text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1 shrink-0',
                  activeRegion === r ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Flag code={r} />
                <span>{r}</span>
                <span style={{ opacity: 0.5 }}>{regionCounts?.get(r)}</span>
              </button>
            ))}
          </div>
        )}

        {!hasRegions && <div className="flex-1" />}

        {/* 主题切换 */}
        <button
          type="button"
          onClick={toggle}
          title={theme === 'dark' ? '切换亮色' : '切换暗色'}
          className="p-1.5 rounded-lg transition-colors shrink-0"
          style={{ color: 'hsl(var(--nx-text-muted))' }}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}

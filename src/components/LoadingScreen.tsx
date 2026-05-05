import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

const CYAN = '#00f5ff'
const PINK = '#ff2d78'

// 生成正六边形顶点字符串
function hexPoly(r: number, rotOffset = 0): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + rotOffset
    return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`
  }).join(' ')
}

// 角落 L 形支架
const BRACKETS: [number, number][][][] = [
  // [corner, h-end, v-end]  TL TR BL BR
  [[[-78, -78], [-78, -64], [-64, -78]]],
  [[[78, -78], [78, -64], [64, -78]]],
  [[[-78, 78], [-78, 64], [-64, 78]]],
  [[[78, 78], [78, 64], [64, 78]]],
]

const GLITCH_POOL = '01アイウカキ!@#<>{}[]\\|;:エオ?%$01'

function GlitchText({ text, rate = 0.12 }: { text: string; rate?: number }) {
  const [out, setOut] = useState(text)
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.18) {
        setOut(
          text.split('').map(c =>
            c !== ' ' && Math.random() < rate
              ? GLITCH_POOL[Math.floor(Math.random() * GLITCH_POOL.length)]
              : c,
          ).join(''),
        )
        setTimeout(() => setOut(text), 90)
      }
    }, 220)
    return () => clearInterval(id)
  }, [text, rate])
  return <>{out}</>
}

function BlockCursor() {
  const [v, setV] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setV(x => (x + 1) % 4), 380)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="ml-1 tracking-widest" style={{ color: PINK }}>
      {'▮'.repeat(v)}{'▯'.repeat(3 - v)}
    </span>
  )
}

export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 select-none"
      style={{ background: 'hsl(var(--background))' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px) brightness(2.5)' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* 顶部标签 */}
      <div
        className="font-mono text-[10px] tracking-[0.35em] uppercase"
        style={{ color: CYAN, opacity: 0.6 }}
      >
        <GlitchText text="SYS :: NETWORK INIT" />
      </div>

      {/* 主视觉 */}
      <svg width="200" height="200" viewBox="-100 -100 200 200" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="gc" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="gp" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* 三波扩散脉冲 */}
        {[0, 1.2, 2.4].map((delay, i) => (
          <motion.circle
            key={`pulse-${i}`}
            cx={0} cy={0} fill="none"
            stroke={CYAN} strokeWidth={0.8}
            filter="url(#gc)"
            initial={{ r: 9, opacity: 0 }}
            animate={{ r: [9, 88], opacity: [0.7, 0] }}
            transition={{ duration: 3.6, delay, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

        {/* 外六边形 顺时针慢转 cyan 虚线 */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <polygon
            points={hexPoly(72)}
            fill="none" stroke={CYAN}
            strokeWidth={1} strokeDasharray="9 6"
            filter="url(#gc)"
          />
        </motion.g>

        {/* 内六边形 逆时针快转 pink 虚线 */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <polygon
            points={hexPoly(52, Math.PI / 6)}
            fill="none" stroke={PINK}
            strokeWidth={1.2} strokeDasharray="5 7"
            filter="url(#gp)"
          />
        </motion.g>

        {/* 中间六边形边段逐一闪烁 */}
        {Array.from({ length: 6 }, (_, i) => {
          const a1 = (i / 6) * Math.PI * 2 - Math.PI / 6
          const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 6
          const r = 62
          return (
            <motion.line
              key={`seg-${i}`}
              x1={(Math.cos(a1) * r).toFixed(2)} y1={(Math.sin(a1) * r).toFixed(2)}
              x2={(Math.cos(a2) * r).toFixed(2)} y2={(Math.sin(a2) * r).toFixed(2)}
              stroke={CYAN} strokeWidth={0.7}
              filter="url(#gc)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 3.6, delay: i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        })}

        {/* 瞄准十字 */}
        {([[-20, 0, -8, 0], [8, 0, 20, 0], [0, -20, 0, -8], [0, 8, 0, 20]] as number[][]).map(
          ([x1, y1, x2, y2], i) => (
            <line
              key={`ch-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={PINK} strokeWidth={1.6}
              filter="url(#gp)" opacity={0.95}
            />
          ),
        )}

        {/* 中心搏动点 */}
        <motion.circle
          cx={0} cy={0} r={4}
          fill={PINK} filter="url(#gp)"
          animate={{ r: [4, 6, 4], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* 四角 L 形支架 */}
        {BRACKETS.map((group, bi) =>
          group.map((pts, pi) => (
            <motion.polyline
              key={`bk-${bi}-${pi}`}
              points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="none" stroke={CYAN}
              strokeWidth={1.6} filter="url(#gc)"
              animate={{ opacity: [0.25, 0.85, 0.25] }}
              transition={{ duration: 2.8, delay: bi * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          )),
        )}

        {/* 角落坐标文字 */}
        {([[-86, -84], [86, -84], [-86, 84], [86, 84]] as [number, number][]).map(([x, y], i) => (
          <motion.text
            key={`coord-${i}`}
            x={x} y={y}
            textAnchor={x < 0 ? 'start' : 'end'}
            dominantBaseline={y < 0 ? 'auto' : 'hanging'}
            fontSize={5} fill={CYAN}
            fontFamily="monospace"
            opacity={0}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: 3.6, delay: i * 0.4, repeat: Infinity }}
          >
            {i % 2 === 0 ? '0x' : ''}{(0xA0 + i * 0x3F).toString(16).toUpperCase()}
          </motion.text>
        ))}
      </svg>

      {/* 底部状态文字 */}
      <div className="font-mono text-center space-y-1.5">
        <div className="text-[11px] tracking-[0.25em] uppercase" style={{ color: CYAN, opacity: 0.75 }}>
          <GlitchText text="ESTABLISHING BACKEND LINK" />
          <BlockCursor />
        </div>
        <div className="text-[10px] tracking-widest" style={{ color: PINK, opacity: 0.45 }}>
          <GlitchText text="AWAIT · AUTH · SYNC" rate={0.06} />
        </div>
      </div>
    </motion.div>
  )
}

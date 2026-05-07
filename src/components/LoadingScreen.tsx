import { motion } from 'motion/react'

export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 select-none overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 背景视频 */}
      <video
        src={`${import.meta.env.BASE_URL}starship.mp4`}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={`${import.meta.env.BASE_URL}starship.webp`}
        aria-hidden
      />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.7) 100%)',
      }} />

      {/* 旋转圆环 */}
      <div className="relative w-12 h-12">
        <motion.svg
          width="48" height="48" viewBox="0 0 48 48"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="3"
          />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="32 94"
          />
        </motion.svg>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium" style={{ color: 'hsl(var(--nx-text-secondary))' }}>
          正在连接后端
        </span>
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ background: 'hsl(var(--nx-text-dim))' }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

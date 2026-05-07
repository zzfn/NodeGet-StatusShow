export function Background() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <video
        src={`${import.meta.env.BASE_URL}starship.mp4`}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={`${import.meta.env.BASE_URL}starship.webp`}
      />
      {/* 渐变遮罩：视频可见，内容可读 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.7) 100%)',
      }} />
    </div>
  )
}

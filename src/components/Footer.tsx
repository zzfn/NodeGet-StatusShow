const REPO = 'https://github.com/NodeSeekDev/NodeGet-StatusShow'

export function Footer({ text }: { text?: string }) {
  return (
    <footer style={{ borderTop: '1px solid hsl(191 97% 55% / 0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-end text-[11px]" style={{ color: 'hsl(220 20% 35%)' }}>
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="transition-all duration-200"
          style={{ color: 'hsl(220 20% 35%)' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'hsl(191 97% 55%)'; (e.target as HTMLElement).style.textShadow = '0 0 8px hsl(191 97% 55% / 0.5)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'hsl(220 20% 35%)'; (e.target as HTMLElement).style.textShadow = '' }}
        >
          {text || 'NEXUS // NodeGet'}
        </a>
      </div>
    </footer>
  )
}

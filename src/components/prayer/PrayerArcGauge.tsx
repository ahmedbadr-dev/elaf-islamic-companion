/** Semi-circular tick gauge with live progress needle (shared home + prayer page) */

export function PrayerArcGauge({
  progress,
  onScrub,
  className = 'w-full max-w-[220px] mx-auto touch-none select-none',
  compact = false,
  tone = 'dark',
}: {
  progress: number
  onScrub?: (p: number) => void
  className?: string
  compact?: boolean
  /** light = day prayers (sun), dark = night prayers (moon) */
  tone?: 'light' | 'dark'
}) {
  const ticks = compact ? 32 : 40
  const cx = 160
  const cy = compact ? 100 : 112
  const r = compact ? 78 : 88
  const p = Math.min(1, Math.max(0, progress))
  const viewH = compact ? 118 : 130

  const activeStroke = tone === 'light' ? 'rgba(19,56,64,0.92)' : 'rgba(255,255,255,0.95)'
  const idleStroke = tone === 'light' ? 'rgba(36,172,181,0.28)' : 'rgba(255,255,255,0.35)'
  const needle = tone === 'light' ? '#133840' : '#fff'
  const hub = tone === 'light' ? '#24ACB5' : '#fff'

  const handlePointer = (clientX: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onScrub?.(t)
  }

  return (
    <svg
      viewBox={`0 0 320 ${viewH}`}
      className={className}
      onPointerDown={(e) => {
        if (!onScrub) return
        e.currentTarget.setPointerCapture(e.pointerId)
        handlePointer(e.clientX, e.currentTarget)
      }}
      onPointerMove={(e) => {
        if (!onScrub || !e.currentTarget.hasPointerCapture(e.pointerId)) return
        handlePointer(e.clientX, e.currentTarget)
      }}
    >
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const t = i / ticks
        const ang = Math.PI - Math.PI * t
        const x1 = cx + (r - 8) * Math.cos(ang)
        const y1 = cy - (r - 8) * Math.sin(ang)
        const x2 = cx + (r + 1) * Math.cos(ang)
        const y2 = cy - (r + 1) * Math.sin(ang)
        const active = t <= p
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={active ? activeStroke : idleStroke}
            strokeWidth={i % 5 === 0 ? 2 : 1.1}
            strokeLinecap="round"
          />
        )
      })}
      <line
        x1={cx}
        y1={cy}
        x2={cx + r * Math.cos(Math.PI - Math.PI * p)}
        y2={cy - r * Math.sin(Math.PI - Math.PI * p)}
        stroke={needle}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx={cx + r * Math.cos(Math.PI - Math.PI * p)}
        cy={cy - r * Math.sin(Math.PI - Math.PI * p)}
        r="5"
        fill={needle}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
      />
      <circle cx={cx} cy={cy} r="3.5" fill={hub} opacity="0.85" />
    </svg>
  )
}

import React from 'react'

interface IconProps {
  className?: string
  size?: number | string
  color?: string
}

// ─── PRAYER ICONS ─────────────────────────────────────────────────────────────
export const IconFajr = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9.043 9.043 0 0 0 12 3z" />
    <path d="M18 4l.8 1.6L20.4 6l-1.6.8L18 8.4l-.8-1.6L15.6 6l1.6-.8L18 4z" fill={color} stroke="none" />
  </svg>
)

export const IconSunrise = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 18a5 5 0 0 0-10 0" />
    <path d="M12 2v7" />
    <path d="M4.93 10.93l4.24 4.24" />
    <path d="M19.07 10.93l-4.24 4.24" />
    <line x1="2" y1="18" x2="22" y2="18" strokeWidth="2" />
    <line x1="2" y1="22" x2="22" y2="22" opacity="0.4" />
  </svg>
)

export const IconDhuhr = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4.5" fill={color} fillOpacity="0.2" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
    <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
    <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
  </svg>
)

export const IconAsr = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="9" r="4" />
    <path d="M15 13a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5H6a4.5 4.5 0 0 1-4.5-4.5A4.5 4.5 0 0 1 6 13c.24 0 .47.02.7.06" />
    <line x1="9" y1="2" x2="9" y2="4" />
    <line x1="2.64" y1="4.64" x2="4.05" y2="6.05" />
    <line x1="15.36" y1="4.64" x2="13.95" y2="6.05" />
  </svg>
)

export const IconMaghrib = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 18a5 5 0 0 0-10 0" fill={color} fillOpacity="0.2" />
    <path d="M12 9v5" />
    <path d="M9 11l3 3 3-3" />
    <line x1="2" y1="18" x2="22" y2="18" strokeWidth="2" />
    <line x1="4" y1="21" x2="20" y2="21" opacity="0.4" />
  </svg>
)

export const IconIsha = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} fillOpacity="0.2" />
    <circle cx="17.5" cy="5.5" r="1" fill={color} stroke="none" />
    <circle cx="19.5" cy="9.5" r="0.75" fill={color} stroke="none" />
    <circle cx="14.5" cy="8" r="0.75" fill={color} stroke="none" />
  </svg>
)

// ─── ISLAMIC ARTIFACTS & SACRED PLACES ─────────────────────────────────────────
export const IconMosque = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Central Dome */}
    <path d="M7 13c0-3.5 2.5-6 5-7 2.5 1 5 3.5 5 7H7z" fill={color} fillOpacity="0.15" />
    <path d="M12 2.5v3.5" strokeWidth="1.5" />
    <circle cx="12" cy="2.5" r="0.75" fill={color} />
    {/* Arch Entrance */}
    <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    {/* Left Minaret */}
    <path d="M3 21V9l1.5-2L6 9v12" />
    <line x1="4.5" y1="4.5" x2="4.5" y2="7" />
    {/* Right Minaret */}
    <path d="M18 21V9l1.5-2L21 9v12" />
    <line x1="19.5" y1="4.5" x2="19.5" y2="7" />
    {/* Base Line */}
    <line x1="2" y1="21" x2="22" y2="21" strokeWidth="2" />
  </svg>
)

export const IconKaaba = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Isometric Cube Shape */}
    <path d="M12 2l9 4.5v11l-9 4.5-9-4.5V6.5L12 2z" fill={color} fillOpacity="0.1" />
    <path d="M12 2l9 4.5-9 4.5-9-4.5L12 2z" />
    <path d="M12 11v11" />
    {/* Golden Belt (Hizam) */}
    <path d="M3 9l9 4.5 9-4.5" strokeWidth="2.2" stroke="#D4AF37" />
    <path d="M3 10.5l9 4.5 9-4.5" strokeWidth="1" stroke="#D4AF37" opacity="0.6" />
  </svg>
)

export const IconMisbaha = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Main Loop Beads */}
    <circle cx="12" cy="5" r="2.2" fill={color} fillOpacity="0.3" />
    <circle cx="18" cy="8.5" r="2.2" fill={color} fillOpacity="0.3" />
    <circle cx="19.5" cy="14" r="2.2" fill={color} fillOpacity="0.3" />
    <circle cx="15.5" cy="18.5" r="2.2" fill={color} fillOpacity="0.3" />
    <circle cx="8.5" cy="18.5" r="2.2" fill={color} fillOpacity="0.3" />
    <circle cx="4.5" cy="14" r="2.2" fill={color} fillOpacity="0.3" />
    <circle cx="6" cy="8.5" r="2.2" fill={color} fillOpacity="0.3" />
    {/* Minaret Tassel (Imam / Shahed) */}
    <path d="M12 7.2v3.8l-1.5 2h3l-1.5-2" />
    <path d="M10.5 13l-1 5m4.5-5l1 5m-2.5-5v5.5" opacity="0.7" />
  </svg>
)

export const IconQuranBook = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Open Quran on Rehal (Stand) */}
    <path d="M2 5c4 0 7-1 10-3 3 2 6 3 10 3v13c-4 0-7-1-10-3-3 2-6 3-10 3V5z" fill={color} fillOpacity="0.15" />
    <path d="M12 2v13" />
    {/* Page Lines */}
    <path d="M5 8h4m-4 3h4m-4 3h3" opacity="0.6" strokeWidth="1.2" />
    <path d="M15 8h4m-4 3h4m-4 3h3" opacity="0.6" strokeWidth="1.2" />
    {/* Wooden X-stand (Rehal) */}
    <path d="M6 19l6 3 6-3m-12 0l12 3m-12 3l12-3" opacity="0.7" strokeWidth="1.4" />
  </svg>
)

export const IconDuaHands = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Cupped Hands Raised in Prayer */}
    <path d="M7 11V5a2 2 0 0 1 4 0v6" />
    <path d="M11 7a2 2 0 0 1 4 0v4" />
    <path d="M7 8a2 2 0 0 0-2 2v6c0 4 3 6 7 6s7-2 7-6v-6a2 2 0 0 0-2-2" />
    <path d="M12 11v11" opacity="0.4" strokeDasharray="2 2" />
  </svg>
)

export const IconShieldCrescent = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={color} fillOpacity="0.1" />
    {/* Crescent inside shield */}
    <path d="M12 7a4 4 0 1 0 4 4 3.2 3.2 0 0 1-4-4z" fill={color} />
  </svg>
)

export const IconCompassRose = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <polygon points="12 4 14.5 10 20 12 14.5 14 12 20 9.5 14 4 12 9.5 10" fill={color} fillOpacity="0.15" />
    <polygon points="12 4 14.5 10 12 12 9.5 10" fill="#24ACB5" stroke="none" />
    <polygon points="12 20 14.5 14 12 12 9.5 14" fill="#D4AF37" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="#133840" />
  </svg>
)

export const IconMicrophoneReciter = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="8" y="2" width="8" height="12" rx="4" fill={color} fillOpacity="0.15" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
)

// ─── UTILITY & NAVIGATION ICONS ───────────────────────────────────────────────
export const IconSmartphone = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <line x1="11" y1="18" x2="13" y2="18" strokeWidth="2" />
    <line x1="10" y1="5" x2="14" y2="5" opacity="0.6" />
  </svg>
)

export const IconTablet = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="2" width="18" height="20" rx="3" />
    <circle cx="12" cy="19" r="1" fill={color} stroke="none" />
  </svg>
)

export const IconRotateOrientation = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.5 2v6h-6" />
    <path d="M2.5 22v-6h6" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L2.5 8.5" />
    <path d="M3.51 15a9 9 0 0 0 14.85 3.36L21.5 15.5" />
  </svg>
)

export const IconSunToggle = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

export const IconMoonToggle = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export const IconTouchPointer = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a4 4 0 0 1 4 4v7a3 3 0 0 1 6 0v2a8 8 0 0 1-8 8H9a7 7 0 0 1-7-7v-3a3 3 0 0 1 6 0v2" />
    <circle cx="12" cy="6" r="1.5" fill={color} stroke="none" />
  </svg>
)

export const IconSpeakerSound = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} fillOpacity="0.2" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

export const IconSpeakerMute = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
)

export const IconPhoneShake = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M2 8l2 2-2 2m0 4l2 2-2 2" opacity="0.6" />
    <path d="M22 8l-2 2 2 2m0 4l-2 2 2 2" opacity="0.6" />
  </svg>
)

export const IconAdhanBell = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={color} fillOpacity="0.15" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="12" cy="2.5" r="1" fill={color} />
  </svg>
)

export const IconPaletteStudio = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C6.49 2 2 6.49 2 12c0 4.41 3.59 8 8 8 .55 0 1-.45 1-1 0-.25-.09-.48-.25-.66-.18-.21-.29-.48-.29-.77 0-.66.54-1.2 1.2-1.2h1.5c4.41 0 8-3.59 8-8 0-5.51-4.49-9.37-9.16-8.37z" />
    <circle cx="7.5" cy="11.5" r="1.5" fill={color} />
    <circle cx="10.5" cy="7.5" r="1.5" fill={color} />
    <circle cx="14.5" cy="7.5" r="1.5" fill={color} />
    <circle cx="17.5" cy="11.5" r="1.5" fill={color} />
  </svg>
)

export const IconCopyDoc = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const IconLightningBolt = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.2" />
  </svg>
)

export const IconPadlock = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const IconSparkle = ({ size = 16, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" className={className}>
    <path d="M12 0l2.5 8.5L23 11l-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5z" />
  </svg>
)

export const IconFlameStreak = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.04-2.8-1.5-4.5-.46 1.7-1.5 2.87-1.5 4.5z" fill={color} />
    <path d="M12 2c-4 4-7 8.5-7 13a7 7 0 0 0 14 0c0-4.5-3-9-7-13z" />
  </svg>
)

export const IconStopwatch = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="14" r="8" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="14" x2="15" y2="11" />
  </svg>
)

export const IconLocationPin = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s7-7.2 7-13a7 7 0 1 0-14 0c0 5.8 7 13 7 13z" fill={color} fillOpacity="0.15" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

export const IconLiveBroadcast = ({ size = 22, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M7.76 16.24a6 6 0 0 1 0-8.49M4.93 19.07a10 10 0 0 1 0-14.14" />
  </svg>
)

export const IconSleep = ({ size = 20, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} fillOpacity="0.15" />
    <path d="M14 7h2.5M15.2 5.8v2.4" strokeWidth="1.4" />
    <path d="M17.5 10h1.8M18.4 9.1v1.8" strokeWidth="1.2" opacity="0.7" />
  </svg>
)

export const IconListSurah = ({ size = 18, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6h16M4 12h16M4 18h10" />
    <circle cx="19" cy="18" r="2" fill={color} stroke="none" />
  </svg>
)

export function PrayerIcon({ id, size = 20, color, className }: { id: string; size?: number; color?: string; className?: string }) {
  const norm = id.toLowerCase()
  if (norm.includes('fajr') || norm.includes('فجر')) return <IconFajr size={size} color={color} className={className} />
  if (norm.includes('sun') || norm.includes('شروق')) return <IconSunrise size={size} color={color} className={className} />
  if (norm.includes('dhuhr') || norm.includes('ظهر')) return <IconDhuhr size={size} color={color} className={className} />
  if (norm.includes('asr') || norm.includes('عصر')) return <IconAsr size={size} color={color} className={className} />
  if (norm.includes('maghrib') || norm.includes('مغرب')) return <IconMaghrib size={size} color={color} className={className} />
  if (norm.includes('isha') || norm.includes('عشاء')) return <IconIsha size={size} color={color} className={className} />
  return <IconFajr size={size} color={color} className={className} />
}


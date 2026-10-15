import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Capacitor } from '@capacitor/core'
import { SimulatorProvider, useSimulator } from './context/SimulatorContext'
import { MushafScreen } from './components/quran/MushafScreen'
import { useNfc, clearSebhaPairing, persistSebha, loadSebhaPairing } from './hooks/useNfc'
import { consumeNfcLaunch } from './plugins/NfcLaunch'
import { useLocationPrayerTimes } from './hooks/useLocationPrayerTimes'
import { useAdhanScheduler } from './hooks/useAdhanScheduler'
import { useEveningAzkarScheduler } from './hooks/useEveningAzkarScheduler'
import { useMorningAzkarScheduler } from './hooks/useMorningAzkarScheduler'
import { useAzkarNotifyScheduler } from './hooks/useAzkarNotifyScheduler'
import { EVENING_AZKAR_AUDIO, EVENING_AZKAR_OPEN_EVENT } from './data/eveningAzkar'
import { MORNING_AZKAR_AUDIO, MORNING_AZKAR_OPEN_EVENT } from './data/morningAzkar'
import { usePrayerWidget } from './hooks/usePrayerWidget'
import { useAuth } from './hooks/useAuth'
import type { AdhanMode } from './data/adhanAudio'
import { AuthScreen } from './components/auth/AuthScreen'
import { SplashScreen } from './components/SplashScreen'
import { ProfileScreen } from './components/profile/ProfileScreen'
import { PrayerScreen } from './components/prayer/PrayerScreen'
import { LiveStreamScreen } from './components/live/LiveStreamScreen'
import { ElafAiScreen } from './components/ai/ElafAiScreen'
import { MisbahaOrderScreen } from './components/shop/MisbahaOrderScreen'
import { ProWelcomeOverlay } from './components/auth/ProWelcomeOverlay'
import { PrayerArcGauge } from './components/prayer/PrayerArcGauge'
import { QiblaOverlay } from './components/prayer/QiblaOverlay'
import { LocationForceModal } from './components/location/LocationForceModal'
import { MosqueLocationConsentBanner } from './components/location/MosqueLocationConsentBanner'
import { LocationService } from './services/LocationService'
import {
  hasLocationShareConsent,
  syncUserLocationForMosques,
} from './services/UserLocationService'
import { getAppDateLabels } from './utils/islamicDate'
import { addOrder } from './services/OrderHistoryService'
import { AzkarVoice } from './services/AzkarVoiceService'
import {
  AZKAR_CATEGORIES,
  DEFAULT_ATHKAR_CATEGORY,
  buildAthkarData,
  type AthkarItem,
} from './data/azkarDb'
import {
  isSpeechRecognitionSupported,
  requestMicrophoneAccess,
  startDhikrListen,
  type TasmeeSession,
  type TasmeeStatus,
} from './services/TasmeeService'
import {
  clearPendingNfcClaim,
  getPendingNfcClaim,
  setPendingNfcClaim,
} from './data/pendingNfcClaim'
import {
  claimOrRestoreTag,
  hydratePairingAfterLogin,
  lookupTag,
  syncTagStats,
} from './services/SebhaPairingService'
import type { UserProfile } from './services/AuthService'
import type { NfcTagData, SebhaData } from './services/NfcService'
import { NfcService } from './services/NfcService'
import {
  loadMushafBookmark,
  loadWirdDoneToday,
  setWirdDoneToday,
  type MushafBookmark,
} from './services/UserPrefsService'
import { getNextPrayerIndex } from './services/PrayerTimesService'
import {
  getVerseForPrayer,
  loadVerseSession,
  PRAYER_VERSES,
  saveVerseSession,
  verseIndexForPrayer,
} from './data/dailyVerses'
import { PhraseIcon, ProphetName } from './components/icons/PhraseIcon'
import {
  PrayerIcon,
  IconMosque,
  IconKaaba,
  IconQuranBook,
  IconMicrophoneReciter,
  IconDuaHands,
  IconSpeakerSound,
  IconSpeakerMute,
  IconSunToggle,
  IconMoonToggle,
  IconSparkle,
  IconMisbaha,
  IconPaletteStudio,
  IconAdhanBell,
  IconLiveBroadcast,
  IconPhoneShake,
} from './components/icons/IslamicIcons'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'home' | 'live' | 'misbaha' | 'prayer' | 'quran' | 'athkar'

// ─── Data ─────────────────────────────────────────────────────────────────────
const PRAYERS = [
  { name: 'الفجر', time: '05:12', icon: 'fajr' },
  { name: 'الشروق', time: '06:40', icon: 'sunrise' },
  { name: 'الظهر', time: '12:49', icon: 'dhuhr' },
  { name: 'العصر', time: '16:18', icon: 'asr' },
  { name: 'المغرب', time: '18:58', icon: 'maghrib' },
  { name: 'العشاء', time: '20:15', icon: 'isha' },
]

const DAILY_VERSE = {
  arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  transliteration: 'Alā bidhikri llāhi taṭmaʾinnu l-qulūb',
  translation: 'Verily, in the remembrance of Allah do hearts find rest.',
  surah: 'سورة الرعد — ٢٨',
}

const ELAF_PRODUCTS = [
  {
    id: 'misbaha-nfc',
    name: 'سبحة إيلاف الذكية',
    desc: 'عدّ تلقائي عند لمس السبحة مع تفعيل مزايا PRO',
    price: '٢٤٩ ر.س',
    badge: 'الأكثر مبيعاً',
    image: '/products/misbaha-nfc.jpg',
  },
  {
    id: 'smart-ring',
    name: 'خاتم التسبيح الذكي',
    desc: 'عداد أذكار وتنبيهات صلاة بتصميم أنيق يومي',
    price: '١٧٩ ر.س',
    badge: 'جديد',
    image: '/products/smart-ring.jpg',
  },
  {
    id: 'dhikr-bracelet',
    name: 'سوار الأذكار NFC',
    desc: 'لمس واحد لفتح الأذكار الصوتية والورد اليومي',
    price: '١٢٩ ر.س',
    badge: 'NFC',
    image: '/products/dhikr-bracelet.jpg',
  },
  {
    id: 'quran-companion',
    name: 'رفيق المصحف الذكي',
    desc: 'سبحة إيلاف تفتح التلاوة والصفحة الأخيرة فوراً',
    price: '٩٩ ر.س',
    badge: null,
    image: '/products/quran-companion.jpg',
  },
]

// ─── Counter animation ────────────────────────────────────────────────────────
function useCountUp(target: number) {
  const [val, setVal] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    if (prev.current === target) return
    const start = prev.current; const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - t0) / 400, 1)
      setVal(Math.round(start + (target - start) * p))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    prev.current = target
  }, [target])
  return val
}

// ─── NFC icon (hardware) ──────────────────────────────────────────────────────
const IcoNfc = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 6.5C20 6.5 22.5 9 22.5 12s-2.5 5.5-2.5 5.5"/>
    <path d="M4 6.5C4 6.5 1.5 9 1.5 12s2.5 5.5 2.5 5.5"/>
    <path d="M17 9.5C17 9.5 19 10.8 19 12s-2 2.5-2 2.5"/>
    <path d="M7 9.5C7 9.5 5 10.8 5 12s2 2.5 2 2.5"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>
  </svg>
)

/** Anatomical-style heart for Misbaha — color driven by zikr progress */
function ZikrHeart({
  size = 42,
  color = '#4A4A4A',
}: {
  size?: number
  color?: string
  style?: { transition?: string }
}) {
  const fillTransition = { transition: 'fill 0.55s ease' }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
    >
      {/* Main heart body */}
      <path
        d="M32 54.5c-1.2 0-2.3-.4-3.2-1.2C18.4 43.6 10 35.8 10 26.2 10 19.6 15.2 14.5 21.6 14.5c3.6 0 6.9 1.7 8.9 4.4l1.5 2 1.5-2c2-2.7 5.3-4.4 8.9-4.4C48.8 14.5 54 19.6 54 26.2c0 9.6-8.4 17.4-18.8 27.1-.9.8-2 1.2-3.2 1.2z"
        fill={color}
        style={fillTransition}
      />
      {/* Soft highlight (like anatomical illustration) */}
      <path
        d="M22.5 23.5c-2.2 0-4 1.7-4 4.1 0 .7.6 1.2 1.3 1.2s1.3-.5 1.3-1.2c0-1 .8-1.7 1.4-1.7.7 0 1.3-.6 1.3-1.2s-.6-1.2-1.3-1.2z"
        fill="#fff"
        fillOpacity="0.28"
      />
      {/* Arteries / vessels at top */}
      <path
        d="M28.5 16.2c.4-2.2-.2-4.2-1.6-5.4-.4-.3-.9-.1-1 .4-.4 1.6.2 3.3 1.4 4.5.3.3.9.3 1.2.5z"
        fill={color}
        fillOpacity="0.85"
        style={fillTransition}
      />
      <path
        d="M33.2 15.8c1.1-2.4 3.2-3.8 5.4-3.6.5 0 .7.6.4 1-1.5 1.7-3.4 2.6-5.2 3.1-.4.1-.8-.2-.6-.5z"
        fill={color}
        fillOpacity="0.85"
        style={fillTransition}
      />
      <path
        d="M35.8 14.2c1.6-1.1 3.6-1.2 5.2-.2.4.2.4.8 0 1-1.6.7-3.4.6-5 .1-.4-.1-.5-.6-.2-.9z"
        fill={color}
        fillOpacity="0.75"
        style={fillTransition}
      />
    </svg>
  )
}

function lerpHeartColor(progress: number): string {
  const t = Math.min(1, Math.max(0, progress))
  // ease-in so early taps stay grey longer, then warm into red
  const e = t * t * (3 - 2 * t)
  const from = [74, 74, 74] // dark grey
  const to = [220, 45, 55] // normal red
  const r = Math.round(from[0] + (to[0] - from[0]) * e)
  const g = Math.round(from[1] + (to[1] - from[1]) * e)
  const b = Math.round(from[2] + (to[2] - from[2]) * e)
  return `rgb(${r}, ${g}, ${b})`
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { state, playSound } = useSimulator()
  const tabs = [
    { id: 'home' as Tab, label: 'الرئيسية', Icon: IconMosque },
    { id: 'misbaha' as Tab, label: 'السبحة', Icon: IconMisbaha },
    { id: 'quran' as Tab, label: 'القرآن الكريم', Icon: IconQuranBook },
    { id: 'prayer' as Tab, label: 'الصلاة', Icon: IconKaaba },
    { id: 'athkar' as Tab, label: 'الأذكار', Icon: IconDuaHands },
  ]
  return (
    <nav
      style={{
        background: state.theme.colorMode === 'dark' ? '#0F262C' : '#fff',
        borderTop: '1px solid #CDEEF5',
        boxShadow: '0 -4px 20px -2px rgba(36,172,181,0.09)',
      }}
      className="flex z-50 relative items-end"
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id
        const isQuran = id === 'quran'
        const color = isQuran
          ? '#fff'
          : isActive
            ? state.theme.primaryColor
            : '#7E9DA3'

        if (isQuran) {
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                playSound('click')
                onChange(id)
              }}
              className="flex-1 flex justify-center relative"
              style={{ paddingBottom: 6 }}
            >
              <span
                className="flex flex-col items-center justify-center gap-0.5 px-3 transition-all duration-200"
                style={{
                  marginTop: -18,
                  minWidth: 72,
                  height: 64,
                  borderRadius: 20,
                  background: isActive
                    ? 'linear-gradient(160deg, #2DD1DC 0%, #24ACB5 45%, #1F969E 100%)'
                    : 'linear-gradient(160deg, #24ACB5 0%, #1F969E 100%)',
                  boxShadow: isActive
                    ? '0 10px 24px -4px rgba(36,172,181,0.55), 0 0 0 3px rgba(36,172,181,0.18)'
                    : '0 8px 20px -4px rgba(36,172,181,0.4)',
                  color: '#fff',
                }}
              >
                <Icon size={22} color="#fff" />
                <span
                  className="text-[8px] font-bold leading-tight text-center px-0.5"
                  style={{ color: '#fff', fontFamily: 'Cairo, sans-serif' }}
                >
                  {label}
                </span>
              </span>
            </button>
          )
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              playSound('click')
              onChange(id)
            }}
            className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2 relative transition-all duration-200"
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                style={{ background: state.theme.primaryColor }}
              />
            )}
            <span
              style={{
                color,
                display: 'inline-flex',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            >
              <Icon size={22} color={color} />
            </span>
            <span
              className="text-[10px] font-semibold leading-tight text-center px-0.5"
              style={{ color, fontFamily: 'Cairo, sans-serif' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
function toArabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)])
}

function parsePrayerDate(timeStr: string, base: Date): Date {
  const latin = (timeStr || '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  const [h, m] = (latin.split(' ')[0] || '00:00').split(':').map(Number)
  const d = new Date(base)
  d.setSeconds(0, 0)
  d.setMilliseconds(0)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

function getRemainingToNext(prayers: { time: string }[], nextIdx: number, now: Date) {
  const next = prayers[nextIdx] || prayers[0]
  const prev = prayers[nextIdx === 0 ? prayers.length - 1 : nextIdx - 1]

  let target = parsePrayerDate(next?.time || '00:00', now)
  if (target.getTime() <= now.getTime()) {
    target = new Date(target)
    target.setDate(target.getDate() + 1)
  }

  const diffMs = Math.max(0, target.getTime() - now.getTime())
  const totalSec = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60

  const label =
    hours > 0
      ? `${toArabicDigits(hours)}:${toArabicDigits(String(mins).padStart(2, '0'))}:${toArabicDigits(String(secs).padStart(2, '0'))}`
      : `${toArabicDigits(String(mins).padStart(2, '0'))}:${toArabicDigits(String(secs).padStart(2, '0'))}`

  let prevAt = parsePrayerDate(prev?.time || '00:00', now)
  if (nextIdx === 0) {
    prevAt = new Date(prevAt)
    prevAt.setDate(prevAt.getDate() - 1)
  } else if (prevAt.getTime() > now.getTime()) {
    prevAt = new Date(prevAt)
    prevAt.setDate(prevAt.getDate() - 1)
  }

  const span = Math.max(1, target.getTime() - prevAt.getTime())
  const elapsed = Math.min(span, Math.max(0, now.getTime() - prevAt.getTime()))
  const progress = Math.min(1, elapsed / span)

  return { label, progress, hours, mins, secs, totalSec }
}

function HomeScreen({
  isPro,
  onActivatePro,
  onOpenElafAi,
  adhan,
  userName,
  userInitials,
  userPhotoURL,
  onOpenProfile,
  onOpenMisbahaShop,
  onRefreshLocationTimes,
  locationLoading,
}: {
  isPro?: boolean
  onActivatePro: () => void
  onOpenElafAi: () => void
  adhan: ReturnType<typeof useAdhanScheduler>
  userName?: string
  userInitials?: string
  userPhotoURL?: string
  onOpenProfile: () => void
  onOpenMisbahaShop: () => void
  onRefreshLocationTimes: () => void
  locationLoading?: boolean
}) {
  const { state, setActiveTab, updateVerse } = useSimulator()
  const activePro = isPro !== undefined ? isPro : state.isPro
  const [prayerDone, setPrayerDone] = useState([false, false, false, false, false])
  const [athkarDone, setAthkarDone] = useState({ morning: false, evening: false })
  const [wirdBookmark, setWirdBookmark] = useState<MushafBookmark | null>(() => loadMushafBookmark())
  const [wirdDone, setWirdDone] = useState(() => loadWirdDoneToday())
  const [now, setNow] = useState(() => new Date())
  const [verseFlash, setVerseFlash] = useState(false)
  const lastPeriodRef = useRef<string | null>(null)

  useEffect(() => {
    const onBookmark = (e: Event) => {
      const detail = (e as CustomEvent<MushafBookmark>).detail
      if (detail) setWirdBookmark(detail)
      else setWirdBookmark(loadMushafBookmark())
    }
    const onWird = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail
      setWirdDone(typeof detail === 'boolean' ? detail : loadWirdDoneToday())
    }
    const refresh = () => {
      setWirdBookmark(loadMushafBookmark())
      setWirdDone(loadWirdDoneToday())
    }
    window.addEventListener('elaf-mushaf-bookmark', onBookmark)
    window.addEventListener('elaf-wird-done', onWird)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('elaf-mushaf-bookmark', onBookmark)
      window.removeEventListener('elaf-wird-done', onWird)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const toggleWirdDone = () => {
    const next = !wirdDone
    setWirdDone(next)
    setWirdDoneToday(next)
  }

  const openWird = () => {
    setActiveTab('quran')
  }

  const adhanModeIndex: Record<AdhanMode, number> = { sound: 0, vibrate: 1, silent: 2 }
  const adhanModes: AdhanMode[] = ['sound', 'vibrate', 'silent']
  const adhanMode = adhanModeIndex[adhan.settings.mode] ?? 0

  // Live clock — refresh remaining countdown every second
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const nextIdx = getNextPrayerIndex(state.prayers, now)
  const nextPrayer = state.prayers[nextIdx] || state.prayers[0]
  const remaining = getRemainingToNext(state.prayers, nextIdx, now)

  // آية اليوم — تتغير تلقائياً مع كل وقت صلاة
  const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  useEffect(() => {
    const key = `${dayKey}#${nextIdx}`
    if (lastPeriodRef.current === key) return

    const saved = loadVerseSession()
    let index: number
    if (saved?.periodKey === key) {
      index = saved.verseIndex
    } else {
      index = verseIndexForPrayer(now, nextIdx)
      saveVerseSession(key, index)
      if (lastPeriodRef.current !== null) {
        setVerseFlash(true)
        window.setTimeout(() => setVerseFlash(false), 700)
      }
    }
    lastPeriodRef.current = key
    updateVerse(PRAYER_VERSES[index] ?? getVerseForPrayer(now, nextIdx))
  }, [nextIdx, dayKey, now, updateVerse])

  const cycleVerse = () => {
    const key = `${dayKey}#${nextIdx}`
    const saved = loadVerseSession()
    const current =
      saved?.periodKey === key ? saved.verseIndex : verseIndexForPrayer(now, nextIdx)
    const next = (current + 1) % PRAYER_VERSES.length
    saveVerseSession(key, next)
    updateVerse(PRAYER_VERSES[next])
    setVerseFlash(true)
    window.setTimeout(() => setVerseFlash(false), 500)
  }

  const dateLabels = getAppDateLabels(now)

  const nextId = (nextPrayer.id || nextPrayer.name || '').toLowerCase()
  const isNightPrayer =
    nextId.includes('maghrib') ||
    nextId.includes('isha') ||
    nextId.includes('مغرب') ||
    nextId.includes('عشاء')
  const prayerCardTone: 'light' | 'dark' = isNightPrayer ? 'dark' : 'light'

  const prayerCardTheme =
    prayerCardTone === 'light'
      ? {
          border: '1px solid rgba(36, 172, 181, 0.35)',
          shadow: '0 18px 40px -16px rgba(36, 172, 181, 0.35)',
          overlay:
            'linear-gradient(145deg, rgba(255,252,245,0.72) 0%, rgba(234,249,252,0.62) 45%, rgba(212,238,242,0.68) 100%)',
          badgeBg: 'rgba(212,175,55,0.16)',
          badgeBorder: '1px solid rgba(212,175,55,0.45)',
          badgeText: '#9A7B1A',
          title: '#133840',
          time: '#1F969E',
          iconBg: 'rgba(36,172,181,0.15)',
          iconBorder: '1px solid rgba(36,172,181,0.35)',
          iconColor: '#24ACB5',
          chipBg: 'rgba(19,56,64,0.06)',
          chipBorder: '1px solid rgba(36,172,181,0.28)',
          chipLabel: '#9A7B1A',
          chipValue: '#133840',
          modeIdleBg: 'rgba(19,56,64,0.06)',
          modeIdleText: '#3A5C64',
          modeIdleBorder: 'rgba(36,172,181,0.28)',
          modeBarBg: 'rgba(255,255,255,0.78)',
          modeBarBorder: '1px solid rgba(36,172,181,0.28)',
          accentIcon: '#E8A317',
        }
      : {
          border: '1px solid rgba(120, 140, 200, 0.35)',
          shadow: '0 18px 40px -16px rgba(10, 20, 40, 0.7)',
          overlay:
            'linear-gradient(145deg, rgba(8,14,32,0.68) 0%, rgba(18,28,58,0.55) 45%, rgba(10,18,40,0.72) 100%)',
          badgeBg: 'rgba(180,190,255,0.14)',
          badgeBorder: '1px solid rgba(180,190,255,0.35)',
          badgeText: '#C8D0FF',
          title: '#F8FCFD',
          time: '#9EC8FF',
          iconBg: 'rgba(120,150,255,0.2)',
          iconBorder: '1px solid rgba(140,170,255,0.4)',
          iconColor: '#B8C8FF',
          chipBg: 'rgba(255,255,255,0.12)',
          chipBorder: '1px solid rgba(255,255,255,0.2)',
          chipLabel: '#C8D0FF',
          chipValue: '#F8FCFD',
          modeIdleBg: 'rgba(255,255,255,0.1)',
          modeIdleText: '#EAF0FF',
          modeIdleBorder: 'rgba(255,255,255,0.22)',
          modeBarBg: 'rgba(255,255,255,0.1)',
          modeBarBorder: '1px solid rgba(255,255,255,0.18)',
          accentIcon: '#E8D48B',
        }

  const adhanModeMeta = [
    { label: 'صوت', Icon: IconSpeakerSound },
    { label: 'اهتزاز', Icon: IconPhoneShake },
    { label: 'صامت', Icon: IconSpeakerMute },
  ] as const

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      {/* Top header */}
      <div className="flex items-center justify-between pt-2 gap-3">
        <div className="min-w-0 flex-1">
          {userName && (
            <p className="text-[12px] font-bold mb-0.5 truncate" style={{ color: '#133840' }}>
              مرحباً، {userName.split(' ')[0]}
            </p>
          )}
          <p className="text-[11px] font-medium truncate" style={{ color: '#7E9DA3' }}>
            {dateLabels.hijri}
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#3A5C64' }}>
            {dateLabels.gregorian}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activePro && (
            <span className="pro-badge">✦ PRO</span>
          )}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: '#fff', border: '1px solid #CDEEF5', boxShadow: '0 2px 8px rgba(36,172,181,0.12)' }}
          >
            <img src="/elaf-logo.png" alt="إيلاف" className="w-full h-full object-contain p-0.5" />
          </div>
          <button
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: '#fff',
              border: '1px solid #CDEEF5',
              boxShadow: '0 2px 8px rgba(36,172,181,0.12)',
              color: '#24ACB5',
            }}
            aria-label="الملف الشخصي"
          >
            {userPhotoURL ? (
              <img src={userPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.75" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M5.5 19.25c0-3.4 2.9-5.75 6.5-5.75s6.5 2.35 6.5 5.75"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Location + Time bar */}
      <div className="elaf-card p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill={state.theme.primaryColor}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="font-bold text-[13px]" style={{ color: state.theme.colorMode === 'dark' ? '#F1F9FB' : '#133840' }}>
              {state.cityName}
            </span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: '#7E9DA3' }}>طريقة الحساب: {state.calculationMethod}</p>
          <button
            type="button"
            disabled={locationLoading}
            onClick={() => onRefreshLocationTimes()}
            className="text-[10px] font-bold mt-1 disabled:opacity-60"
            style={{ color: state.theme.primaryColor }}
          >
            {locationLoading ? 'جاري تحديث الموقع والمواقيت…' : 'تحديث الموقع والمواقيت ←'}
          </button>
        </div>
        <div style={{ direction: 'ltr' }}>
          <p className="text-2xl font-black tabular-nums" style={{ color: state.theme.primaryColor, fontFamily: 'Cairo, sans-serif' }}>{timeStr}</p>
        </div>
      </div>


      {/* Next Prayer Hero — video background */}
      <div
        className="prayer-hero-card -mx-4 w-[calc(100%+2rem)] max-w-none rounded-none px-5 py-12 relative overflow-hidden transition-all duration-500"
        style={{
          background: '#133840',
          border: 'none',
          borderTop: prayerCardTheme.border,
          borderBottom: prayerCardTheme.border,
          boxShadow: prayerCardTheme.shadow,
        }}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src="/images/ky-mosque.mp4"
          poster="/images/ky-mosque.png"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-500"
          style={{ background: prayerCardTheme.overlay }}
        />

        {/* Sun / moon accent */}
        <div
          className="absolute top-3 left-3 z-[2] w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: prayerCardTone === 'light' ? 'rgba(255,200,80,0.25)' : 'rgba(180,190,255,0.18)',
            border: prayerCardTone === 'light' ? '1px solid rgba(232,163,23,0.45)' : '1px solid rgba(180,190,255,0.35)',
            boxShadow:
              prayerCardTone === 'light'
                ? '0 0 20px rgba(255,200,80,0.35)'
                : '0 0 18px rgba(160,180,255,0.25)',
          }}
          aria-hidden
        >
          {prayerCardTone === 'light' ? (
            <IconSunToggle size={18} color={prayerCardTheme.accentIcon} />
          ) : (
            <IconMoonToggle size={18} color={prayerCardTheme.accentIcon} />
          )}
        </div>

        {/* الصلاة القادمة — top right */}
        <div
          className="absolute top-3 right-3 z-[2] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: prayerCardTheme.badgeBg, border: prayerCardTheme.badgeBorder }}
        >
          <IconAdhanBell size={12} color={prayerCardTheme.badgeText} />
          <p className="text-[10px] font-bold tracking-wide" style={{ color: prayerCardTheme.badgeText }}>
            الصلاة القادمة
          </p>
        </div>

        <div className="relative z-[1] pt-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-nowrap min-w-0">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: prayerCardTheme.iconBg, border: prayerCardTheme.iconBorder }}
                >
                  <PrayerIcon id={nextPrayer.id || nextPrayer.name} size={20} color={prayerCardTheme.iconColor} />
                </span>
                <div className="min-w-0 flex flex-col items-start gap-1">
                  <p
                    className="text-4xl font-black leading-none whitespace-nowrap"
                    style={{ color: prayerCardTheme.title, fontFamily: 'Cairo, sans-serif' }}
                  >
                    {nextPrayer.name}
                  </p>
                  <p
                    className="text-2xl font-black tabular-nums leading-none whitespace-nowrap"
                    style={{ color: prayerCardTheme.time, direction: 'ltr', fontFamily: 'Cairo, sans-serif' }}
                  >
                    {nextPrayer.time}
                  </p>
                </div>
              </div>

              {/* صوت / اهتزاز / صامت — under prayer name */}
              <div
                className="inline-flex gap-1 flex-nowrap mt-3 px-1.5 py-1.5 rounded-2xl"
                style={{
                  background: prayerCardTheme.modeBarBg,
                  border: prayerCardTheme.modeBarBorder,
                  boxShadow:
                    prayerCardTone === 'light'
                      ? '0 4px 14px -6px rgba(19,56,64,0.18)'
                      : 'none',
                }}
              >
                {adhanModeMeta.map(({ label, Icon }, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => adhan.setMode(adhanModes[i])}
                    className="text-[9px] px-2 py-1 rounded-full font-bold transition-all inline-flex items-center gap-0.5 flex-shrink-0"
                    style={{
                      background:
                        adhanMode === i
                          ? 'linear-gradient(135deg, #24ACB5, #1F969E)'
                          : prayerCardTheme.modeIdleBg,
                      color: adhanMode === i ? '#fff' : prayerCardTheme.modeIdleText,
                      border: `1px solid ${adhanMode === i ? '#2DD1DC' : prayerCardTheme.modeIdleBorder}`,
                      boxShadow: adhanMode === i ? '0 4px 10px -3px rgba(36,172,181,0.45)' : 'none',
                    }}
                    aria-pressed={adhanMode === i}
                  >
                    <Icon
                      size={10}
                      color={adhanMode === i ? '#fff' : prayerCardTheme.modeIdleText}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center flex-shrink-0 -my-1 -translate-x-2.5">
              <PrayerArcGauge
                progress={remaining.progress}
                compact
                tone={prayerCardTone}
                className="w-[180px] touch-none select-none"
              />
              <div
                className="inline-flex items-center gap-1.5 -mt-1 px-2.5 py-1 rounded-full"
                style={{ background: prayerCardTheme.chipBg, border: prayerCardTheme.chipBorder }}
              >
                <span className="text-[9px] font-bold" style={{ color: prayerCardTheme.chipLabel }}>
                  متبقي
                </span>
                <span
                  className="font-black tabular-nums leading-none"
                  style={{
                    color: prayerCardTheme.chipValue,
                    fontFamily: 'Cairo, sans-serif',
                    fontSize: remaining.hours > 0 ? 12 : 14,
                    direction: 'ltr',
                  }}
                >
                  {remaining.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mushaf preview card → opens Quran mushaf */}
      <button
        type="button"
        onClick={() => setActiveTab('quran')}
        className="elaf-card w-full text-center overflow-hidden relative active:scale-[0.99] transition-transform p-0"
        style={{ background: '#FFFFFF', border: '1px solid #E8EEF0' }}
        aria-label="فتح المصحف الشريف"
      >
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: '#F8FCFD', border: '1px solid #CDEEF5' }}>
          <IconQuranBook size={12} color="#24ACB5" />
          <span className="text-[10px] font-bold" style={{ color: '#24ACB5' }}>المصحف</span>
        </div>

        <div
          className="relative px-5 pt-8 pb-6"
          style={{
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 42%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 42%, transparent 100%)',
          }}
        >
          <p
            className="mushaf-font text-[18px] leading-[2.1] mb-1"
            style={{ color: '#1A2B30' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          <p
            className="mushaf-font text-[17px] leading-[2.15] mb-0.5"
            style={{ color: '#243840' }}
          >
            الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
            <span className="ayah-end-marker" style={{ fontSize: '0.55em', marginInlineStart: '0.15em' }}>١</span>
          </p>

          <p
            className="mushaf-font text-[16px] leading-[2.15]"
            style={{ color: '#3A5C64' }}
          >
            الرَّحْمَٰنِ الرَّحِيمِ
            <span className="ayah-end-marker" style={{ fontSize: '0.55em', marginInlineStart: '0.15em' }}>٢</span>
            {' '}مَالِكِ يَوْمِ الدِّينِ
          </p>

          <p
            className="mushaf-font text-[15px] leading-[2.1] mt-0.5"
            style={{ color: '#7E9DA3' }}
          >
            إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
            <span className="ayah-end-marker" style={{ fontSize: '0.55em', marginInlineStart: '0.15em' }}>٣</span>
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-14 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF 75%)' }} />
      </button>

      {/* NFC Misbaha widget */}
      <button
        className="p-4 w-full text-right active:scale-[0.98] transition-transform rounded-2xl"
        onClick={onActivatePro}
        style={{
          background: 'linear-gradient(135deg, #24ACB5 0%, #1F969E 100%)',
          border: '1px solid #1F969E',
          boxShadow: '0 10px 25px -5px rgba(36,172,181,0.45), 0 4px 6px -2px rgba(36,172,181,0.25)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <span
              className="absolute w-full h-full rounded-full"
              style={{ border: '2px solid rgba(255,255,255,0.55)', animation: 'nfc-wave 2s ease-out infinite' }}
            />
            <span
              className="absolute w-full h-full rounded-full"
              style={{ border: '2px solid rgba(255,255,255,0.45)', animation: 'nfc-wave 2s ease-out 0.7s infinite' }}
            />
            <div style={{ color: '#FFFFFF' }}>
              <IcoNfc />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {isPro ? (
              <>
                <p className="font-bold text-[13px]" style={{ color: '#FFFFFF' }}>
                  سبحة إيلاف متصلة
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#FFFFFF', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }}
                  />
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    باقة PRO مفعّلة مدى الحياة
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-bold text-[13px]" style={{ color: '#FFFFFF' }}>
                  اكتشف سبحة إيلاف الذكية
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  المسّ سبحة إيلاف لتفعيل باقة PRO مدى الحياة
                </p>
              </>
            )}
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="rgba(255,255,255,0.85)"
            style={{ transform: 'scaleX(-1)', flexShrink: 0 }}
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          </svg>
        </div>
      </button>

      {/* Daily Verse — interactive, auto-rotates each prayer */}
      <button
        type="button"
        onClick={cycleVerse}
        className="elaf-card p-5 w-full text-center active:scale-[0.99] transition-all duration-300"
        style={{
          background:
            state.theme.colorMode === 'dark'
              ? '#132B32'
              : 'linear-gradient(160deg, #F8FCFD 0%, #EAF9FC 100%)',
          opacity: verseFlash ? 0.72 : 1,
          transform: verseFlash ? 'scale(0.985)' : 'scale(1)',
        }}
        aria-label="آية اليوم — اضغط لآية أخرى"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: state.theme.primaryColor }}
            >
              ✦ آية اليوم
            </span>
            <p className="text-[9px] font-semibold mt-0.5" style={{ color: '#7E9DA3' }}>
              تتجدد مع {nextPrayer.name} · اضغط لتغييرها
            </p>
          </div>
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#EAF9FC', border: '1px solid #CDEEF5' }}
            aria-hidden
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={state.theme.primaryColor} strokeWidth="2">
              <path d="M4 12a8 8 0 0 1 14.3-4.9M20 12a8 8 0 0 1-14.3 4.9" strokeLinecap="round" />
              <path d="M18 3v5h-5M6 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <p
          className="mushaf-font text-xl text-center leading-[2.2] mb-2 transition-opacity duration-300"
          style={{
            color: state.theme.colorMode === 'dark' ? '#F1F9FB' : '#133840',
          }}
        >
          {state.dailyVerse.arabic}
        </p>
        <p className="text-[11px] text-center italic mb-2" style={{ color: '#7E9DA3' }}>
          {state.dailyVerse.transliteration}
        </p>
        <p
          className="text-[12px] text-center font-medium"
          style={{ color: state.theme.colorMode === 'dark' ? '#CBD5E1' : '#3A5C64' }}
        >
          {state.dailyVerse.translation}
        </p>
        <div className="mt-3 flex justify-center">
          <span
            className="text-[11px] px-3 py-1 rounded-full"
            style={{
              background: '#EAF9FC',
              color: state.theme.primaryColor,
              border: '1px solid #CDEEF5',
            }}
          >
            {state.dailyVerse.surah}
          </span>
        </div>
      </button>

      {/* سبحة إيلاف — open shop */}
      <button
        type="button"
        onClick={onOpenMisbahaShop}
        className="relative w-full overflow-hidden text-right active:scale-[0.99] transition-transform rounded-3xl"
        style={{
          minHeight: 168,
          backgroundImage: 'url(/images/misbaha-promo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          boxShadow: '0 12px 28px -8px rgba(0,0,0,0.55)',
        }}
        aria-label="اطلب سبحة إيلاف الذكية"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, rgba(36,172,181,0.55) 0%, rgba(31,150,158,0.35) 38%, rgba(19,56,64,0.78) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(36,172,181,0.45) 0%, transparent 55%)',
          }}
        />
        <div className="relative z-[1] p-5 flex flex-col gap-3 min-h-[168px] justify-between">
          <div>
            <span
              className="inline-flex items-center text-[9px] font-black px-2.5 py-1 rounded-full mb-2.5"
              style={{ background: 'rgba(36,172,181,0.35)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}
            >
              ✦ PRO
            </span>
            <p
              className="font-black text-[17px] leading-snug text-white mb-1.5"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              سبحة إيلاف الذكية
            </p>
            <p className="text-[12px] leading-relaxed text-white/90 font-semibold">
              اطلب الآن لتفعيل باقة برو والاستمتاع بتجربة إيمانية حقيقية
            </p>
          </div>
          <div className="flex items-center">
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-black px-4 py-2 rounded-full"
              style={{ background: '#fff', color: '#24ACB5' }}
            >
              اطلب الآن
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#24ACB5" style={{ transform: 'scaleX(-1)' }}>
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
              </svg>
            </span>
          </div>
        </div>
      </button>

      {/* Daily checklist */}
      <div className="elaf-card p-4">
        <p className="font-bold text-[13px] mb-3" style={{ color: state.theme.colorMode === 'dark' ? '#F1F9FB' : '#133840' }}>متابعة يومك</p>
        <p className="text-[10px] mb-2 font-semibold" style={{ color: '#7E9DA3' }}>الصلوات الخمس</p>
        <div className="flex gap-2 mb-3">
          {state.prayers.filter((_, i) => i !== 1).map((p, i) => (
            <button key={p.name} onClick={() => {
              const n = [...prayerDone]; n[i] = !n[i]; setPrayerDone(n)
            }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
              style={{
                background: prayerDone[i] ? '#EAF9FC' : state.theme.colorMode === 'dark' ? '#0F262C' : '#F8FCFD',
                border: `1px solid ${prayerDone[i] ? state.theme.primaryColor : '#CDEEF5'}`,
              }}>
              <PrayerIcon id={p.id || p.name} size={16} color="#24ACB5" />
              <span className="text-[9px] font-semibold" style={{ color: prayerDone[i] ? state.theme.primaryColor : '#7E9DA3' }}>{p.name}</span>
              {prayerDone[i] && <span style={{ color: '#2BB673', fontSize: 11 }}>✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[{ k: 'morning' as const, label: 'أذكار الصباح' }, { k: 'evening' as const, label: 'أذكار المساء' }]
            .map(({ k, label }) => (
              <button key={k} onClick={() => setAthkarDone(d => ({ ...d, [k]: !d[k] }))}
                className="flex-1 flex items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: athkarDone[k] ? '#EAF9FC' : '#F8FCFD',
                  border: `1px solid ${athkarDone[k] ? '#24ACB5' : '#CDEEF5'}`,
                }}>
                <span style={{ color: '#24ACB5' }}>{k === 'morning' ? <IconSunToggle size={14} color="#24ACB5" /> : <IconMoonToggle size={14} color="#24ACB5" />}</span>
                <span className="text-[10px] font-semibold" style={{ color: athkarDone[k] ? '#24ACB5' : '#3A5C64' }}>{label}</span>
                {athkarDone[k] && <span style={{ color: '#2BB673', marginRight: 'auto', fontSize: 12 }}>✓</span>}
              </button>
            ))}
        </div>

        {/* الورد القراني — Quran bookmark */}
        <div
          className="w-full mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
          style={{
            background: wirdDone ? '#EAF9FC' : '#F8FCFD',
            border: `1px solid ${wirdDone ? '#24ACB5' : '#CDEEF5'}`,
          }}
        >
          <button
            type="button"
            onClick={openWird}
            className="flex-1 min-w-0 flex items-center gap-2.5 text-right"
          >
            <span className="flex-shrink-0" style={{ color: '#24ACB5' }}>
              <IconQuranBook size={16} color="#24ACB5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold" style={{ color: wirdDone ? '#24ACB5' : '#3A5C64' }}>
                الورد القراني
              </p>
              <p className="text-[9px] mt-0.5 truncate" style={{ color: '#7E9DA3' }}>
                {wirdBookmark
                  ? `سورة ${wirdBookmark.surahName} · صفحة ${wirdBookmark.page}`
                  : 'افتح المصحف لحفظ علامتك'}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={toggleWirdDone}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: wirdDone ? '#2BB673' : '#fff',
              border: `1px solid ${wirdDone ? '#2BB673' : '#CDEEF5'}`,
              color: wirdDone ? '#fff' : '#7E9DA3',
              fontSize: 12,
            }}
            aria-label={wirdDone ? 'إلغاء إكمال الورد' : 'تم الورد كمكتمل'}
          >
            {wirdDone ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Live streaming — under متابعة يومك */}
      <button
        type="button"
        onClick={() => setActiveTab('live')}
        className="w-full overflow-hidden relative active:scale-[0.99] transition-transform rounded-[28px] text-right"
        style={{ height: 220, minHeight: 220 }}
        aria-label="بث مباشر"
      >
        <img
          src="/live/live-hero-kaaba.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.78) 100%)',
          }}
        />
        <div
          className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" style={{ boxShadow: '0 0 8px #EF4444' }} />
          Live
        </div>
        <div className="relative z-10 h-full flex flex-col justify-end px-5 pt-6 pb-6">
          <p className="text-[20px] font-black text-white leading-snug" style={{ fontFamily: 'Cairo, sans-serif' }}>
            بث مباشر من الحرمين
          </p>
          <p className="text-[12px] text-white/85 mt-2">تأملات · مناسك · خطب · تلاوات</p>
          <span className="mt-3 inline-flex items-center gap-1.5 self-start text-[11px] font-bold text-white/95">
            <IconLiveBroadcast size={14} color="#fff" />
            اكتشف المزيد
          </span>
        </div>
      </button>

      {/* إيلاف AI — PRO feature under بث مباشر */}
      <button
        type="button"
        onClick={() => {
          if (!activePro) {
            onActivatePro()
            return
          }
          onOpenElafAi()
        }}
        className="w-full overflow-hidden relative active:scale-[0.99] transition-transform rounded-[28px] text-right"
        style={{
          background: 'linear-gradient(135deg, #133840 0%, #1A4A52 42%, #24ACB5 100%)',
          boxShadow: '0 12px 28px -8px rgba(19,56,64,0.45)',
          minHeight: 120,
        }}
        aria-label="إيلاف AI"
      >
        <img
          src="/ai/elaf-ai-mascot.png"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: -4,
            bottom: -6,
            height: 128,
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
          }}
        />
        <div
          className="relative z-10 flex flex-col justify-center items-end gap-1.5 py-4"
          style={{ paddingRight: 18, paddingLeft: '38%', maxWidth: '100%' }}
        >
          <div className="flex items-center justify-end gap-2 flex-nowrap w-full">
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#D4AF37', color: '#133840' }}
            >
              PRO
            </span>
            <p
              className="text-[16px] font-black text-white whitespace-nowrap text-right"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              اسأل إيلاف AI
            </p>
          </div>
          <p className="text-[11px] text-white/85 whitespace-nowrap overflow-hidden text-ellipsis text-right w-full">
            مساعد إسلامي ذكي · أسئلة شائعة
          </p>
          <p className="text-[11px] font-bold text-white whitespace-nowrap text-right w-full">
            {activePro ? 'ابدأ المحادثة ←' : 'فعّل PRO بلمس السبحة ←'}
          </p>
        </div>
      </button>
    </div>
  )
}

// ─── MISBAHA ──────────────────────────────────────────────────────────────────
function MisbahaScreen({
  isPro,
  user,
  onActivatePro,
  onRequireLogin: _onRequireLogin,
  onProActivated: _onProActivated,
}: {
  isPro?: boolean
  user: UserProfile | null
  onActivatePro: () => void
  onRequireLogin: (hint?: { email?: string; message?: string }) => void
  onProActivated: () => void
}) {
  const { state, playSound } = useSimulator()
  const activePro = isPro !== undefined ? isPro : state.isPro
  const dhikrOptions = state.dhikrOptions
  const [dhikrIdx, setDhikrIdx] = useState(0)
  const [count, setCount] = useState(0)
  const [pop, setPop] = useState(false)
  const [done, setDone] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [listenOn, setListenOn] = useState(false)
  const [listenStatus, setListenStatus] = useState<TasmeeStatus>('idle')
  const [listenHint, setListenHint] = useState('')
  const [sessionTotal, setSessionTotal] = useState(0)
  const displayed = useCountUp(count)
  const currentOption = dhikrOptions[dhikrIdx] || dhikrOptions[0]
  const target = currentOption.total
  const progress = Math.min(count / target, 1)

  const targetRef = useRef(target)
  const dhikrIdxRef = useRef(dhikrIdx)
  const voiceOnRef = useRef(voiceOn)
  const doneRef = useRef(done)
  const listenSessionRef = useRef<TasmeeSession | null>(null)
  targetRef.current = target
  dhikrIdxRef.current = dhikrIdx
  voiceOnRef.current = voiceOn
  doneRef.current = done

  const applyTap = useCallback((withVoice: boolean) => {
    if (doneRef.current) return
    playSound('dhikr')
    if (withVoice && voiceOnRef.current && !listenSessionRef.current) {
      const option = dhikrOptions[dhikrIdxRef.current]
      if (option?.id) {
        void AzkarVoice.play(option.id, { interrupt: false })
      }
    }
    setCount((c) => {
      const n = c + 1
      if (n >= targetRef.current) {
        playSound('celebrate')
        setDone(true)
        return targetRef.current
      }
      return n
    })
    setSessionTotal((t) => t + 1)
    setPop(true)
    setTimeout(() => setPop(false), 180)
  }, [dhikrOptions, playSound])

  // Background NFC: if already paired, taps still count (no status card)
  const onNfcTap = useCallback((_tag: NfcTagData, sebha: SebhaData) => {
    if (!activePro) return
    if (sebha.isPaired && sebha.userId && user?.id && sebha.userId === user.id) {
      if (!doneRef.current) applyTap(true)
    }
  }, [activePro, user?.id, applyTap])

  const [nfcState] = useNfc({
    autoStart: true,
    tapDebounceMs: 700,
    onTap: (tag, sebha) => onNfcTap(tag, sebha),
  })

  // Mic listen → auto-count (PRO)
  useEffect(() => {
    listenSessionRef.current?.stop()
    listenSessionRef.current = null

    if (!activePro || !listenOn || done) {
      setListenStatus('idle')
      setListenHint('')
      return
    }

    if (!isSpeechRecognitionSupported()) {
      setListenStatus('unsupported')
      setListenHint('هذا الجهاز لا يدعم التعرف على الصوت')
      setListenOn(false)
      return
    }

    let cancelled = false
    const targetText = currentOption.text

    void (async () => {
      setListenStatus('requesting')
      setListenHint('جارٍ تفعيل الميكروفون…')
      const ok = await requestMicrophoneAccess()
      if (cancelled) return
      if (!ok) {
        setListenStatus('denied')
        setListenHint('اسمح بالميكروفون للعدّ التلقائي بالصوت')
        setListenOn(false)
        return
      }

      AzkarVoice.stop()
      const session = startDhikrListen({
        targetText,
        threshold: 0.68,
        onMatch: () => {
          if (doneRef.current) return
          applyTap(false)
        },
        onStatus: (status, detail) => {
          if (cancelled) return
          setListenStatus(status)
          if (status === 'listening') {
            setListenHint(
              detail?.transcript
                ? `سمعت: ${detail.transcript}`
                : 'قل الذكر — العدّ تلقائي'
            )
          } else if (status === 'correct') {
            setListenHint('✓ تم العدّ')
          } else if (status === 'denied') {
            setListenHint('تم رفض إذن الميكروفون')
            setListenOn(false)
          } else if (status === 'unsupported') {
            setListenHint('التعرف على الصوت غير متاح')
            setListenOn(false)
          } else if (status === 'error') {
            setListenHint('تعذر الاستماع — أعد المحاولة')
          }
        },
      })
      if (cancelled) {
        session.stop()
        return
      }
      listenSessionRef.current = session
    })()

    return () => {
      cancelled = true
      listenSessionRef.current?.stop()
      listenSessionRef.current = null
    }
  }, [activePro, listenOn, done, currentOption.text, applyTap])

  const tap = useCallback(() => {
    applyTap(true)
  }, [applyTap])

  const reset = () => {
    setCount(0)
    setDone(false)
    AzkarVoice.stop()
  }

  const selectDhikr = (i: number) => {
    setDhikrIdx(i)
    setCount(0)
    setDone(false)
    AzkarVoice.stop()
    const option = dhikrOptions[i]
    if (voiceOn && option?.id && !listenOn) {
      void AzkarVoice.play(option.id, { interrupt: true })
    }
  }

  const toggleListen = () => {
    if (!activePro) {
      onActivatePro()
      return
    }
    setListenOn((v) => !v)
  }

  const isListening =
    listenOn && (listenStatus === 'listening' || listenStatus === 'requesting' || listenStatus === 'correct')

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
            السبحة
          </h1>
          <p className="text-[11px]" style={{ color: '#7E9DA3' }}>أذكارك اليومية — عدّ بلمسة أو بالصوت</p>
        </div>
        {activePro ? (
          <span className="pro-badge">✦ PRO</span>
        ) : (
          <button
            type="button"
            onClick={onActivatePro}
            className="pro-badge"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            فعّل PRO
          </button>
        )}
      </div>

      {/* Dhikr selector — full text */}
      <div className="elaf-card p-3">
        <div className="flex items-center justify-between mb-2 gap-2">
          <p className="text-[10px] font-bold" style={{ color: '#7E9DA3' }}>اختر الذكر</p>
          <button
            type="button"
            onClick={() => setVoiceOn((v) => !v)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: voiceOn ? '#EAF9FC' : '#F8FCFD',
              color: voiceOn ? '#24ACB5' : '#7E9DA3',
              border: `1px solid ${voiceOn ? '#24ACB5' : '#CDEEF5'}`,
            }}
          >
            {voiceOn ? (
              <span className="inline-flex items-center gap-1">
                <IconSpeakerSound size={12} /> صوت مفعّل
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <IconSpeakerMute size={12} /> صوت متوقف
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {dhikrOptions.map((d, i) => (
            <button
              key={d.id || i}
              type="button"
              onClick={() => selectDhikr(i)}
              className="w-full text-right px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all leading-relaxed"
              style={{
                background: dhikrIdx === i ? '#24ACB5' : '#EAF9FC',
                color: dhikrIdx === i ? '#fff' : '#3A5C64',
                border: `1px solid ${dhikrIdx === i ? '#24ACB5' : '#CDEEF5'}`,
              }}
            >
              <span className="block whitespace-normal break-words">
                {d.id === 'salawat' ? (
                  <>اللَّهُمَّ صَلِّ عَلَى <ProphetName name="مُحَمَّدٍ" /></>
                ) : (
                  d.text
                )}
              </span>
              <span
                className="block text-[10px] mt-1 font-bold opacity-80"
                style={{ color: dhikrIdx === i ? 'rgba(255,255,255,0.85)' : '#7E9DA3' }}
              >
                الهدف: {d.total}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="elaf-card p-6 flex flex-col items-center gap-4">
        <p className="text-center font-bold text-[15px] leading-relaxed px-1" style={{ color: '#133840' }}>
          {currentOption.id === 'salawat' ? (
            <>اللَّهُمَّ صَلِّ عَلَى <ProphetName name="مُحَمَّدٍ" /></>
          ) : (
            currentOption.text
          )}
        </p>

        <button
          type="button"
          onClick={toggleListen}
          className="px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
          style={{
            background: isListening ? '#E8F8F0' : activePro ? '#EAF9FC' : '#F8F5E8',
            color: isListening ? '#166534' : activePro ? '#24ACB5' : '#92400E',
            border: `1px solid ${isListening ? '#2BB673' : activePro ? '#24ACB5' : '#E8C56A'}`,
          }}
        >
          <IconMicrophoneReciter
            size={14}
            color={isListening ? '#166534' : activePro ? '#24ACB5' : '#92400E'}
          />
          <span>
            {!activePro
              ? 'عدّ بالصوت — PRO'
              : isListening
                ? 'الميكروفون يستمع…'
                : 'عدّ بالصوت'}
          </span>
        </button>
        {listenHint && listenOn && activePro && (
          <p className="text-[10px] font-semibold text-center" style={{ color: isListening ? '#166534' : '#7E9DA3' }}>
            {listenHint}
          </p>
        )}

        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="#EAF9FC" strokeWidth="8" />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={done ? '#2BB673' : '#24ACB5'}
              strokeWidth="8"
              strokeDasharray="553"
              strokeDashoffset={553 * (1 - progress)}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
            />
          </svg>
          <button
            type="button"
            onClick={tap}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full active:scale-95 transition-transform select-none"
            style={{ cursor: 'pointer' }}
          >
            <span
              className={count > 0 && !done ? 'animate-heart-beat' : ''}
              style={{
                display: 'inline-flex',
                marginBottom: 2,
                transform: pop ? 'scale(1.22)' : 'scale(1)',
                transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                filter: done
                  ? 'drop-shadow(0 4px 10px rgba(220,45,55,0.35))'
                  : progress > 0.35
                    ? `drop-shadow(0 2px 8px rgba(220,45,55,${0.15 + progress * 0.35}))`
                    : 'none',
              }}
              aria-hidden
            >
              <ZikrHeart size={42} color={lerpHeartColor(progress)} />
            </span>
            <span
              className="text-5xl font-black tabular-nums"
              style={{
                color: done ? '#2BB673' : '#133840',
                fontFamily: 'Cairo, sans-serif',
                transform: pop ? 'scale(1.18)' : 'scale(1)',
                transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), color 0.3s',
              }}
            >
              {displayed}
            </span>
            <span className="text-[12px] mt-1" style={{ color: '#7E9DA3' }}>
              من {target}
            </span>
            {done && (
              <span className="text-[11px] mt-1 font-bold" style={{ color: '#2BB673' }}>
                ✓ اكتمل
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2 rounded-full text-[12px] font-semibold transition-all"
            style={{ background: '#F8FCFD', color: '#3A5C64', border: '1px solid #CDEEF5' }}
          >
            إعادة
          </button>
          <button type="button" onClick={tap} className="elaf-btn-primary px-6 py-2 text-[13px]">
            نقر +١
          </button>
        </div>
      </div>

      {activePro ? (
        <div className="elaf-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[13px]" style={{ color: '#133840' }}>جلسة اليوم</p>
            <span className="pro-badge">PRO</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'إجمالي الجلسة', val: String(sessionTotal) },
              { label: 'الذكر الحالي', val: String(count) },
              { label: 'المتبقي', val: String(Math.max(0, target - count)) },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="text-center p-3 rounded-xl"
                style={{ background: '#EAF9FC', border: '1px solid #CDEEF5' }}
              >
                <p className="font-black text-lg mt-1" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
                  {val}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: '#7E9DA3' }}>{label}</p>
              </div>
            ))}
          </div>
          {nfcState.sebhaData?.isPaired && (
            <p className="text-[10px] mt-3 text-center" style={{ color: '#7E9DA3' }}>
              سبحة إيلاف نشطة — المسّها للعدّ أيضاً
            </p>
          )}
        </div>
      ) : (
        <div className="elaf-card p-4 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ background: 'linear-gradient(135deg, #D4AF37, transparent)' }}
          />
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 28, color: '#D4AF37' }}>
              <IconSparkle size={28} color="#D4AF37" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px]" style={{ color: '#133840' }}>مزايا PRO للسبحة</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#7E9DA3' }}>
                عدّ بالصوت · تحليلات الجلسة · لمس السبحة
              </p>
            </div>
            <button
              type="button"
              onClick={onActivatePro}
              className="elaf-btn-primary px-4 py-1.5 text-[11px] flex-shrink-0"
            >
              فعّل PRO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── QURAN ────────────────────────────────────────────────────────────────────
function QuranScreen({
  isPro,
  onFullscreenChange,
}: {
  isPro: boolean
  onFullscreenChange?: (fullscreen: boolean) => void
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MushafScreen isPro={isPro} onFullscreenChange={onFullscreenChange} />
    </div>
  )
}

// ─── ATHKAR ──────────────────────────────────────────────────────────────────
function AthkarScreen() {
  const { playSound } = useSimulator()
  const [cat, setCat] = useState(DEFAULT_ATHKAR_CATEGORY)
  const [athkar, setAthkar] = useState(() => buildAthkarData())
  const [celebrating, setCelebrating] = useState<number | null>(null)
  const [voiceOn, setVoiceOn] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [catQuery, setCatQuery] = useState('')

  const catRef = useRef(cat)
  const athkarRef = useRef(athkar)
  const voiceOnRef = useRef(voiceOn)
  const activeIdxRef = useRef(activeIdx)
  catRef.current = cat
  athkarRef.current = athkar
  voiceOnRef.current = voiceOn
  activeIdxRef.current = activeIdx

  const filteredCats = useMemo(() => {
    const q = catQuery.trim()
    if (!q) return AZKAR_CATEGORIES
    return AZKAR_CATEGORIES.filter((c) => c.label.includes(q))
  }, [catQuery])

  const current = athkar[cat] ?? []
  const totalDone = current.filter((a) => a.count >= a.total).length

  const findNextIncomplete = useCallback((items: AthkarItem[], from = 0) => {
    for (let i = from; i < items.length; i++) {
      if (items[i].count < items[i].total) return i
    }
    for (let i = 0; i < from; i++) {
      if (items[i].count < items[i].total) return i
    }
    return -1
  }, [])

  const tap = useCallback((idx: number, playVoice = true) => {
    const category = catRef.current
    const items = athkarRef.current[category]
    const item = items?.[idx]
    if (!item || item.count >= item.total) return

    playSound('dhikr')
    if (playVoice && voiceOnRef.current && item.audioKey) {
      void AzkarVoice.play(item.audioKey, { interrupt: true })
    }

    const willComplete = item.count + 1 >= item.total

    setAthkar((prev) => {
      const nextItems = [...(prev[category] || [])]
      const next = { ...nextItems[idx] }
      if (next.count < next.total) {
        next.count++
      }
      nextItems[idx] = next
      return { ...prev, [category]: nextItems }
    })

    setActiveIdx(idx)

    if (willComplete) {
      setCelebrating(idx)
      setTimeout(() => setCelebrating(null), 1200)
      playSound('celebrate')
      const projected = items.map((it, i) =>
        i === idx ? { ...it, count: it.total } : it
      )
      const advanced = findNextIncomplete(projected, idx + 1)
      if (advanced >= 0) setActiveIdx(advanced)
    }
  }, [findNextIncomplete, playSound])

  const onNfcTap = useCallback(() => {
    const items = athkarRef.current[catRef.current] || []
    let idx = activeIdxRef.current
    if (idx < 0 || !items[idx] || items[idx].count >= items[idx].total) {
      idx = findNextIncomplete(items, 0)
    }
    if (idx < 0) return
    tap(idx, true)
  }, [findNextIncomplete, tap])

  const [nfcState, nfcActions] = useNfc({
    autoStart: true,
    tapDebounceMs: 800,
    onTap: () => onNfcTap(),
  })

  useEffect(() => {
    if (!nfcState.isScanning && nfcState.isNative) {
      void nfcActions.startScanning()
    }
  }, [nfcState.isScanning, nfcState.isNative, nfcActions])

  useEffect(() => {
    const items = athkar[cat] || []
    const idx = findNextIncomplete(items, 0)
    setActiveIdx(idx < 0 ? 0 : idx)
    AzkarVoice.stop()
  }, [cat, findNextIncomplete]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetCat = () => {
    AzkarVoice.stop()
    setAthkar((prev) => ({
      ...prev,
      [cat]: (prev[cat] || []).map((a) => ({ ...a, count: 0 })),
    }))
    setActiveIdx(0)
  }

  const playItemVoice = (idx: number) => {
    const item = current[idx]
    if (item?.audioKey) void AzkarVoice.play(item.audioKey, { interrupt: true })
  }

  const selectCat = (id: string) => {
    setCat(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
            الأذكار والأدعية
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: '#7E9DA3' }}>
            {AZKAR_CATEGORIES.length} تصنيفاً · {Object.values(athkar).reduce((n, list) => n + list.length, 0)} ذكراً
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceOn((v) => !v)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-full"
            style={{
              background: voiceOn ? '#EAF9FC' : '#F8FCFD',
              color: voiceOn ? '#24ACB5' : '#7E9DA3',
              border: `1px solid ${voiceOn ? '#24ACB5' : '#CDEEF5'}`,
            }}
          >
            {voiceOn ? <IconSpeakerSound size={14} /> : <IconSpeakerMute size={14} />}
          </button>
          <button
            type="button"
            onClick={resetCat}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: '#F8FCFD', color: '#7E9DA3', border: '1px solid #CDEEF5' }}
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* NFC auto banner */}
      <div
        className="elaf-card p-3 flex items-center gap-3"
        style={{ borderColor: nfcState.isScanning || !nfcState.isNative ? '#24ACB5' : '#CDEEF5' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #133840, #24ACB5)' }}
        >
          <IcoNfc />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold" style={{ color: '#133840' }}>
            عدّ تلقائي بالسبحة — صوت الذكر
          </p>
          <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
            {nfcState.isNative
              ? nfcState.isScanning
                ? 'يستمع الآن — المسّ سبحة إيلاف للعدّ مع الصوت'
                : 'جاري تفعيل الاستماع…'
              : 'وضع الويب — استخدم محاكاة النقرة'}
          </p>
        </div>
        {!nfcState.isNative && (
          <button
            type="button"
            onClick={() => nfcActions.simulateTap()}
            className="elaf-btn-primary px-3 py-1.5 text-[10px] flex-shrink-0"
          >
            لمسة سبحة
          </button>
        )}
      </div>

      {/* Search categories */}
      <div className="elaf-card p-3">
        <input
          type="search"
          value={catQuery}
          onChange={(e) => setCatQuery(e.target.value)}
          placeholder="ابحث عن تصنيف…"
          className="w-full text-right text-[13px] px-3 py-2 rounded-xl outline-none"
          style={{
            background: '#F8FCFD',
            color: '#133840',
            border: '1px solid #CDEEF5',
            fontFamily: 'Cairo, sans-serif',
          }}
        />
        <div
          className="flex gap-2 mt-3 overflow-x-auto pb-1"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}
        >
          {filteredCats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCat(c.id)}
              className="flex-shrink-0 px-3 py-2 rounded-2xl text-[11px] font-bold transition-all whitespace-nowrap"
              style={{
                background: cat === c.id ? '#24ACB5' : '#EAF9FC',
                color: cat === c.id ? '#fff' : '#3A5C64',
                border: `1px solid ${cat === c.id ? '#24ACB5' : '#CDEEF5'}`,
              }}
            >
              {c.label}
              <span
                className="mr-1.5 opacity-80 text-[10px] font-semibold"
                style={{ color: cat === c.id ? 'rgba(255,255,255,0.85)' : '#7E9DA3' }}
              >
                ({c.count})
              </span>
            </button>
          ))}
          {filteredCats.length === 0 && (
            <p className="text-[11px] py-2" style={{ color: '#7E9DA3' }}>لا نتائج</p>
          )}
        </div>
      </div>

      <p className="text-[13px] font-bold text-right" style={{ color: '#133840' }}>
        {cat}
      </p>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold" style={{ color: '#7E9DA3' }}>
          {totalDone} من {current.length} أذكار مكتملة
        </p>
        <div className="flex-1 mx-3 h-1.5 rounded-full overflow-hidden" style={{ background: '#EAF9FC' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${current.length ? (totalDone / current.length) * 100 : 0}%`,
              background: '#24ACB5',
            }}
          />
        </div>
        <span className="text-[11px] font-black" style={{ color: '#24ACB5' }}>
          {current.length ? Math.round((totalDone / current.length) * 100) : 0}%
        </span>
      </div>

      {/* Athkar listing */}
      <div className="flex flex-col gap-3">
        {current.map((item, i) => {
          const done = item.count >= item.total
          const progress = Math.min(item.count / item.total, 1)
          const isActive = i === activeIdx && !done
          return (
            <div
              key={`${cat}-${i}`}
              className="elaf-card p-4 transition-all"
              style={{
                background: done ? 'linear-gradient(135deg, #EAF9FC, #D8F3F8)' : '#fff',
                border: `1.5px solid ${done ? '#24ACB5' : isActive ? '#F59E0B' : celebrating === i ? '#2BB673' : '#CDEEF5'}`,
                boxShadow: isActive ? '0 0 0 3px rgba(245,158,11,0.15)' : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p
                  className="text-[15px] font-bold leading-loose text-right flex-1 whitespace-pre-line break-words"
                  style={{ color: done ? '#1F969E' : '#133840', fontFamily: 'Cairo, sans-serif' }}
                >
                  {item.text}
                </p>
                <button
                  type="button"
                  onClick={() => playItemVoice(i)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#EAF9FC', color: '#24ACB5', border: '1px solid #CDEEF5' }}
                  title="تشغيل الصوت"
                >
                  <IconSpeakerSound size={14} color="#24ACB5" />
                </button>
              </div>
              {item.description ? (
                <p className="text-[11px] mb-2 leading-relaxed text-right" style={{ color: '#7E9DA3' }}>
                  {item.description}
                </p>
              ) : null}
              {item.reference ? (
                <p className="text-[10px] mb-2 text-right font-semibold" style={{ color: '#24ACB5' }}>
                  {item.reference}
                </p>
              ) : null}
              {isActive && (
                <p className="text-[10px] font-semibold mb-2" style={{ color: '#F59E0B' }}>
                  ← الذكر النشط مع السبحة
                </p>
              )}
              <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: '#EAF9FC' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%`, background: done ? '#2BB673' : '#24ACB5' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => tap(i, true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95"
                  style={{
                    background: done ? '#2BB673' : '#24ACB5',
                    color: '#fff',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                  disabled={done}
                >
                  <span className="text-[13px] font-bold">{done ? '✓ اكتمل' : '+١ ذكر'}</span>
                </button>
                <div className="text-left ltr">
                  <span
                    className="text-xl font-black tabular-nums"
                    style={{ color: done ? '#2BB673' : '#24ACB5', fontFamily: 'Cairo, sans-serif' }}
                  >
                    {item.count}
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: '#7E9DA3' }}>
                    {' '}
                    / {item.total}
                  </span>
                </div>
              </div>
              {celebrating === i && (
                <div className="mt-2 text-center">
                  <p className="text-[12px] font-bold" style={{ color: '#2BB673' }}>
                    <IconSparkle size={12} color="#2BB673" /> أحسنت! اكتمل الذكر
                  </p>
                </div>
              )}
            </div>
          )
        })}
        {current.length === 0 && (
          <div className="elaf-card p-6 text-center">
            <p className="text-[13px]" style={{ color: '#7E9DA3' }}>لا توجد أذكار في هذا التصنيف</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PRO ACTIVATION MODAL ─────────────────────────────────────────────────────
function ProModal({
  user,
  onClose,
  onActivate,
  onRequireLogin,
  onNewTagReadyForSignup,
  initialTagUid,
}: {
  user: UserProfile | null
  onClose: () => void
  onActivate: () => void
  onRequireLogin: (hint?: { email?: string; message?: string }) => void
  /** New/unowned tag scanned while logged out → open signup */
  onNewTagReadyForSignup: (tagUid: string) => void
  /** Tag UID from Android NFC launch intent (pairs without a second tap) */
  initialTagUid?: string | null
}) {
  const [scanning, setScanning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagUid, setTagUid] = useState<string | null>(null)
  const [writeHint, setWriteHint] = useState<string | null>(null)
  const handledRef = useRef(false)

  const [nfcState, nfcActions] = useNfc({
    autoStart: false,
    tapDebounceMs: 900,
    onTap: (tag, sebha) => {
      if (handledRef.current) return
      void (async () => {
        handledRef.current = true
        setScanning(true)
        setError(null)
        setWriteHint(null)
        const uid = tag.serialNumber || tag.id
        setTagUid(uid)

        // Logged out: new tag → signup; owned tag → login to restore
        if (!user) {
          try {
            const existing = await lookupTag(uid)
            if (!existing) {
              setScanning(false)
              onNewTagReadyForSignup(uid)
              return
            }
            handledRef.current = false
            setScanning(false)
            onRequireLogin({
              email: existing.userEmail || undefined,
              message: 'هذه السبحة مرتبطة بحساب — سجّل الدخول لاستعادة مزاياك',
            })
          } catch (e) {
            handledRef.current = false
            setScanning(false)
            setError(e instanceof Error ? e.message : 'تعذّر التعرف على السبحة')
          }
          return
        }

        let result
        try {
          result = await claimOrRestoreTag({
            tagUid: uid,
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            totalDhikr: sebha.totalDhikr,
            lastDhikrText: sebha.lastDhikrText,
          })
        } catch (e) {
          handledRef.current = false
          setScanning(false)
          setError(e instanceof Error ? e.message : 'تعذّر الربط، حاول مرة أخرى')
          return
        }

        if (!result.ok) {
          handledRef.current = false
          setScanning(false)
          setError(result.message)
          return
        }

        persistSebha(result.sebha)
        setScanning(false)
        setSuccess(true)
        onActivate()
        // First-time claim from logged-in scan
        if (!result.restored) {
          window.dispatchEvent(new CustomEvent('elaf-pro-welcome'))
        }

        void (async () => {
          try {
            const wrote = await Promise.race([
              NfcService.writeTag(result.sebha),
              new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 2500)),
            ])
            if (!wrote) {
              setWriteHint('تم الربط ✓ — المسّ سبحة إيلاف مرة أخرى لاحقاً لإكمال الإعداد')
            }
          } catch {
            setWriteHint('تم الربط ✓ — يمكنك لمس السبحة لاحقاً لإكمال الإعداد')
          }
        })()

        window.setTimeout(() => onClose(), 1800)
      })()
    },
  })

  const startScan = async () => {
    setError(null)
    handledRef.current = false
    setScanning(true)
    if (nfcState.isNative) {
      const ok = await nfcActions.startScanning({ forceRestart: true })
      if (!ok) {
        setScanning(false)
        setError('تعذر بدء اللمس — فعّل خاصية اللمس القريب من إعدادات الهاتف')
      }
    } else {
      window.setTimeout(() => nfcActions.simulateTag(), 600)
    }
  }

  // Auto-start scanning when modal opens (login not required)
  useEffect(() => {
    if (nfcState.isNative && !success) {
      void startScan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If this account already claimed a tag in Firestore, unlock PRO immediately
  useEffect(() => {
    if (!user || success) return
    let cancelled = false
    void (async () => {
      try {
        const cloud = await hydratePairingAfterLogin(user.id)
        if (cancelled || !cloud?.isPro) return
        if (cloud.sebha) persistSebha(cloud.sebha)
        setTagUid(cloud.sebha?.serial || null)
        handledRef.current = true
        setScanning(false)
        setSuccess(true)
        onActivate()
        window.setTimeout(() => onClose(), 1400)
      } catch {
        /* ignore — fall through to normal scan */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // If Android opened the app via NFC intent, pair using that UID immediately
  useEffect(() => {
    if (!initialTagUid || success) return
    const t = window.setTimeout(() => {
      NfcService.emitIntentTag(initialTagUid)
    }, 400)
    return () => window.clearTimeout(t)
  }, [initialTagUid, success])

  return (
    <div className="fixed inset-0 z-[100] flex items-end" style={{ background: 'rgba(13,34,39,0.72)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full rounded-t-3xl p-6 pb-10 slide-up"
        style={{ background: '#fff', border: '1px solid #CDEEF5' }}>
        {success ? (
          <div className="text-center py-6">
            <div className="mb-4 flex justify-center"><IconSparkle size={56} color="#D4AF37" /></div>
            <p className="text-xl font-black mb-2" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
              مبروك!
            </p>
            <p className="font-bold" style={{ color: '#24ACB5' }}>
              تم تفعيل باقة إيلاف PRO وربط سبحتك بحسابك
            </p>
            {writeHint && (
              <p className="text-[11px] mt-2 px-2" style={{ color: '#B45309' }}>{writeHint}</p>
            )}
            <p className="text-[12px] mt-2" style={{ color: '#7E9DA3' }}>بعد تسجيل الخروج، ادخل بنفس الحساب لاستعادة مزاياك</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
                {user ? 'تفعيل باقة PRO' : 'المس سبحة إيلاف للتسجيل'}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#EAF9FC', color: '#7E9DA3' }}>✕</button>
            </div>

            <div className="text-center py-6">
              <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
                {scanning && [0, 1, 2].map(i => (
                  <div key={i} className="absolute rounded-full"
                    style={{
                      width: `${112 + i * 28}px`, height: `${112 + i * 28}px`,
                      border: '2px solid #24ACB5',
                      animation: `nfc-wave ${1.4 + i * 0.35}s ease-out ${i * 0.35}s infinite`,
                    }} />
                ))}
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: scanning ? 'linear-gradient(135deg, #133840, #24ACB5)' : 'linear-gradient(135deg, #EAF9FC, #CDEEF5)',
                    border: `2px solid ${scanning ? '#24ACB5' : '#CDEEF5'}`,
                    transition: 'all 0.3s',
                  }}>
                  <span style={{ color: scanning ? '#fff' : '#24ACB5' }}>
                    <IcoNfc />
                  </span>
                </div>
              </div>

              {scanning ? (
                <>
                  <p className="font-bold" style={{ color: '#24ACB5' }}>بانتظار سبحة إيلاف…</p>
                  <p className="text-[12px] mt-2 px-2 leading-relaxed" style={{ color: '#7E9DA3' }}>
                    ارفع السبحة ثم المسّها من جديد على ظهر الهاتف
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[15px] mb-1" style={{ color: '#133840' }}>
                    {user ? 'المس سبحة إيلاف لربطها بحسابك' : 'المس سبحة إيلاف لإنشاء حسابك'}
                  </p>
                  <p className="text-[12px]" style={{ color: '#7E9DA3' }}>
                    {user
                      ? `سيتم الربط مع: ${user.email}`
                      : 'بعد لمس السبحة ستظهر شاشة إنشاء الحساب وتُفعَّل كل المزايا'}
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl text-[11px] font-semibold text-center"
                style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <div className="space-y-3 mb-5">
              {[
                { t: 'إنشاء حساب جديد يبدأ بلمس سبحة إيلاف', Icon: IconMisbaha },
                { t: 'سبحتك ترتبط بحسابك مرة واحدة فقط', Icon: IconMisbaha },
                { t: 'بعد الربط تُفعَّل كل مزايا PRO تلقائياً', Icon: IconSparkle },
                { t: 'بعد الخروج، ادخل بنفس الحساب لاستعادة مزاياك', Icon: IconMicrophoneReciter },
              ].map(({ t, Icon }) => (
                <div key={t} className="flex items-center gap-2">
                  <Icon size={14} color="#24ACB5" />
                  <p className="text-[12px]" style={{ color: '#3A5C64' }}>{t}</p>
                </div>
              ))}
            </div>

            <button onClick={() => void startScan()} className="elaf-btn-primary w-full py-3.5 text-[14px]" disabled={scanning}>
              {scanning ? 'بانتظار سبحة إيلاف…' : 'المس سبحة إيلاف الآن'}
            </button>

            {!user && (
              <button
                type="button"
                onClick={() => onRequireLogin({ message: 'سجّل الدخول إن كان لديك حساب مرتبط بسبحة إيلاف' })}
                className="mt-3 w-full py-3 rounded-2xl text-[13px] font-bold"
                style={{ background: '#EAF9FC', color: '#24ACB5', border: '1px solid #CDEEF5' }}
              >
                لدي حساب مسبقاً — تسجيل الدخول
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── APP SHELL & ROOT ─────────────────────────────────────────────────────────
function AppShell() {
  const { state, setActiveTab, setShowProModal, setIsPro, updatePrayers, updateBrand } = useSimulator()
  const location = useLocationPrayerTimes(state.calculationMethod)
  const adhan = useAdhanScheduler(state.prayers)
  useEveningAzkarScheduler(state.prayers)
  useMorningAzkarScheduler(state.prayers)
  const azkarNotify = useAzkarNotifyScheduler()
  const prayerWidget = usePrayerWidget(state.prayers)
  const auth = useAuth()
  const [pendingAzkarAudioId, setPendingAzkarAudioId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [authGate, setAuthGate] = useState<'profile' | 'order' | 'pro' | null>(null)
  const [authNfcHint, setAuthNfcHint] = useState<{ email?: string; message?: string } | null>(null)
  const [pendingClaimTagUid, setPendingClaimTagUid] = useState<string | null>(() => getPendingNfcClaim())
  const [pendingOrder, setPendingOrder] = useState<{ id: string; name: string } | null>(null)
  const [nfcLaunchUid, setNfcLaunchUid] = useState<string | null>(null)
  const [orderNotice, setOrderNotice] = useState<string | null>(null)
  const [locModalDismissed, setLocModalDismissed] = useState(false)
  const [locBusy, setLocBusy] = useState(false)
  const [locBootstrapped, setLocBootstrapped] = useState(false)
  const [mushafFullscreen, setMushafFullscreen] = useState(false)
  const [showQibla, setShowQibla] = useState(false)
  const [showElafAi, setShowElafAi] = useState(false)
  const [showMisbahaShop, setShowMisbahaShop] = useState(false)
  const [showProWelcome, setShowProWelcome] = useState(false)
  const [showMosqueConsent, setShowMosqueConsent] = useState(false)
  const [mosqueConsentDismissed, setMosqueConsentDismissed] = useState(false)
  const lastLocationSyncRef = useRef<string | null>(null)
  const hydratedUidRef = useRef<string | null>(null)

  // Leave fullscreen mushaf when switching tabs
  useEffect(() => {
    if (state.activeTab !== 'quran') setMushafFullscreen(false)
  }, [state.activeTab])

  useEffect(() => {
    if (state.activeTab !== 'home') setShowQibla(false)
  }, [state.activeTab])

  // Morning / evening azkar notification → open Live media player
  useEffect(() => {
    const openAudio = (id: string) => {
      setPendingAzkarAudioId(id)
      setActiveTab('live')
    }
    const onEvening = () => openAudio(EVENING_AZKAR_AUDIO.id)
    const onMorning = () => openAudio(MORNING_AZKAR_AUDIO.id)
    window.addEventListener(EVENING_AZKAR_OPEN_EVENT, onEvening)
    window.addEventListener(MORNING_AZKAR_OPEN_EVENT, onMorning)
    return () => {
      window.removeEventListener(EVENING_AZKAR_OPEN_EVENT, onEvening)
      window.removeEventListener(MORNING_AZKAR_OPEN_EVENT, onMorning)
    }
  }, [setActiveTab])

  // Welcome after first-time sebha claim (from ProModal while already logged in)
  useEffect(() => {
    const onWelcome = () => setShowProWelcome(true)
    window.addEventListener('elaf-pro-welcome', onWelcome)
    return () => window.removeEventListener('elaf-pro-welcome', onWelcome)
  }, [])

  // Restore PRO + pairing from Firebase after login
  useEffect(() => {
    if (!auth.user) {
      hydratedUidRef.current = null
      return
    }
    if (hydratedUidRef.current === auth.user.id) return
    hydratedUidRef.current = auth.user.id
    void (async () => {
      const cloud = await hydratePairingAfterLogin(auth.user!.id)
      if (!cloud) return
      if (cloud.isPro) {
        setIsPro(true)
        if (cloud.sebha) persistSebha(cloud.sebha)
      }
    })()
  }, [auth.user, setIsPro])

  // Clear local PRO when logged out (cloud claim stays for next login)
  useEffect(() => {
    if (auth.loading) return
    if (!auth.user) {
      const local = loadSebhaPairing()
      if (local?.isPaired) clearSebhaPairing()
      if (state.isPro) setIsPro(false)
    }
  }, [auth.user, auth.loading, state.isPro, setIsPro])

  // Ask for location permission on app open and load prayer times
  useEffect(() => {
    void location.refresh({ forcePermission: true }).finally(() => {
      setLocBootstrapped(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!location.prayers) return
    updatePrayers(location.prayers)
    if (location.cityLabel) {
      updateBrand({ cityName: location.cityLabel })
    }
  }, [location.prayers, location.cityLabel, updatePrayers, updateBrand])

  // Ask once (after GPS ready) to share approx location for nearby mosques
  useEffect(() => {
    if (!auth.user || !location.coords || location.loading) return
    if (hasLocationShareConsent() || mosqueConsentDismissed) return
    if (Capacitor.isNativePlatform() && location.permission !== 'granted') return
    setShowMosqueConsent(true)
  }, [auth.user, location.coords, location.loading, location.permission, mosqueConsentDismissed])

  // Sync consented location → Firestore (for /dashboard + future mosques)
  useEffect(() => {
    if (!auth.user || !location.coords || !hasLocationShareConsent()) return
    const key = `${auth.user.id}:${location.coords.latitude.toFixed(2)},${location.coords.longitude.toFixed(2)}`
    if (lastLocationSyncRef.current === key) return
    lastLocationSyncRef.current = key
    void syncUserLocationForMosques({
      userId: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      cityLabel: location.cityLabel || state.cityName,
    })
  }, [auth.user, location.coords, location.cityLabel, state.cityName])

  // Force popup until OS location permission is granted (native only)
  const isNativeApp = Capacitor.isNativePlatform()
  const needsLocation =
    isNativeApp &&
    locBootstrapped &&
    !locModalDismissed &&
    !location.loading &&
    !locBusy &&
    location.permission !== 'granted'

  // Re-check when returning from system settings
  useEffect(() => {
    let remove: (() => void) | undefined
    ;(async () => {
      try {
        if (!Capacitor.isNativePlatform()) return
        const { App } = await import('@capacitor/app')
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) return
          void (async () => {
            await location.refresh({ forcePermission: true })
            const p = await LocationService.checkPermission()
            if (p !== 'granted') setLocModalDismissed(false)
            else setLocModalDismissed(true)
          })()
        })
        remove = () => {
          void handle.remove()
        }
      } catch {
        /* ignore */
      }
    })()
    return () => remove?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open the misbaha (PRO) screen when the app is launched/resumed by an NFC tap.
  useEffect(() => {
    let remove: (() => void) | undefined
    const checkNfcLaunch = async () => {
      const result = await consumeNfcLaunch()
      if (!result.launched) return
      if (result.tagUid) setNfcLaunchUid(result.tagUid)
      setShowProModal(true)
    }
    // Cold start
    void checkNfcLaunch()
    // Warm resume (tag tapped while app is in background)
    ;(async () => {
      try {
        if (!Capacitor.isNativePlatform()) return
        const { App } = await import('@capacitor/app')
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) void checkNfcLaunch()
        })
        remove = () => {
          void handle.remove()
        }
      } catch {
        /* ignore */
      }
    })()
    return () => remove?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enableLocation = async () => {
    // Hide our overlay first so the Google Play location dialog is visible
    setLocModalDismissed(true)
    setLocBusy(true)
    try {
      const ok = await LocationService.connectLocation()
      if (ok) {
        await location.refresh({ forcePermission: true })
        setLocModalDismissed(true)
      } else {
        // User cancelled the system popup — show our modal again
        setLocModalDismissed(false)
      }
    } catch (err) {
      console.warn('[Location] enable failed', err)
      setLocModalDismissed(false)
    } finally {
      setLocBusy(false)
    }
  }

  // After successful login/signup, continue the interrupted action
  useEffect(() => {
    if (!auth.user || !authGate) return

    const pending = pendingClaimTagUid || getPendingNfcClaim()
    if (pending && authGate === 'pro') {
      let cancelled = false
      void (async () => {
        try {
          const result = await claimOrRestoreTag({
            tagUid: pending,
            userId: auth.user!.id,
            userEmail: auth.user!.email,
            userName: auth.user!.name,
            phone: auth.user!.phone,
            city: auth.user!.city,
          })
          if (cancelled) return
          if (result.ok) {
            persistSebha(result.sebha)
            setIsPro(true)
            clearPendingNfcClaim()
            setPendingClaimTagUid(null)
            setAuthGate(null)
            setAuthNfcHint(null)
            // Welcome only for first-time claim (not restore)
            if (!result.restored) setShowProWelcome(true)
            return
          }
        } catch {
          /* fall through to ProModal */
        }
        if (cancelled) return
        setShowProModal(true)
        setAuthGate(null)
        setAuthNfcHint(null)
      })()
      return () => {
        cancelled = true
      }
    }

    if (authGate === 'profile') {
      setShowProfile(true)
      setAuthGate(null)
      setAuthNfcHint(null)
      return
    }
    if (authGate === 'pro') {
      if (state.isPro) {
        setAuthGate(null)
        setAuthNfcHint(null)
        return
      }
      setShowProModal(true)
      setAuthGate(null)
      setAuthNfcHint(null)
      return
    }
    if (authGate === 'order' && pendingOrder) {
      const product = ELAF_PRODUCTS.find((p) => p.id === pendingOrder.id)
      addOrder(auth.user.id, {
        productId: pendingOrder.id,
        productName: pendingOrder.name,
        price: product?.price,
      })
      setOrderNotice(pendingOrder.name)
      setPendingOrder(null)
      setAuthGate(null)
      setAuthNfcHint(null)
    }
  }, [auth.user, authGate, pendingOrder, setShowProModal, state.isPro, pendingClaimTagUid, setIsPro])

  const openProfile = () => {
    if (auth.user) {
      setShowProfile(true)
      return
    }
    setAuthNfcHint(null)
    setAuthGate('profile')
  }

  const requireProLogin = (hint?: { email?: string; message?: string }) => {
    setAuthNfcHint(hint || null)
    setAuthGate('pro')
  }

  /** Always open NFC scan first — signup only after a new tag */
  const openProFlow = () => {
    setShowProModal(true)
  }

  const handleNewTagReadyForSignup = (tagUid: string) => {
    const saved = setPendingNfcClaim(tagUid)
    if (!saved) return
    setPendingClaimTagUid(saved)
    setShowProModal(false)
    setNfcLaunchUid(null)
    setAuthNfcHint({ message: 'تم التعرف على سبحتك — أنشئ حسابك لتفعيل المزايا' })
    setAuthGate('pro')
  }

  const signupWithNfcClaim = async (data: {
    name: string
    email: string
    password: string
    phone?: string
    city?: string
  }) => {
    const tagUid = pendingClaimTagUid || getPendingNfcClaim()
    if (!tagUid) return false

    const ok = await auth.signup(data)
    if (!ok) return false

    try {
      const { firebaseAuth } = await import('./services/firebase')
      const fbUser = firebaseAuth.currentUser
      if (!fbUser) return false

      // Brief wait so Auth token is fully ready for Firestore rules
      await fbUser.getIdToken(true)

      const result = await claimOrRestoreTag({
        tagUid,
        userId: fbUser.uid,
        userEmail: data.email.trim().toLowerCase(),
        userName: data.name.trim(),
        phone: data.phone,
        city: data.city,
      })
      if (!result.ok) {
        // Account created — keep pending tag so user can retry from PRO modal
        setShowProModal(true)
        setAuthGate(null)
        return true
      }

      persistSebha(result.sebha)
      setIsPro(true)
      clearPendingNfcClaim()
      setPendingClaimTagUid(null)
      setAuthGate(null)
      setAuthNfcHint(null)
      setShowProWelcome(true)
      return true
    } catch {
      setShowProModal(true)
      setAuthGate(null)
      return true
    }
  }

  const placeOrder = (id: string, name: string) => {
    if (auth.user) {
      const product = ELAF_PRODUCTS.find((p) => p.id === id)
      addOrder(auth.user.id, {
        productId: id,
        productName: name,
        price: product?.price,
      })
      setOrderNotice(name)
      return
    }
    setPendingOrder({ id, name })
    setAuthNfcHint(null)
    setAuthGate('order')
  }

  return (
    <div
      className="w-full h-screen flex justify-center overflow-hidden"
      style={{ background: '#0A1B20' }}
    >
      <div
        className="w-full max-w-[430px] h-full flex flex-col overflow-hidden select-none relative shadow-2xl"
        style={{
          background: state.theme.colorMode === 'dark' ? '#0A1B20' : '#F8FCFD',
          fontFamily: 'Cairo, IBM Plex Sans Arabic, sans-serif',
          direction: 'rtl',
          fontSize: `${state.theme.fontScale}rem`,
        }}
      >
        {showProfile && auth.user ? (
          <ProfileScreen
            user={auth.user}
            adhan={adhan}
            azkarNotify={azkarNotify}
            prayerWidget={prayerWidget}
            onBack={() => setShowProfile(false)}
            onSave={auth.updateProfile}
            onLogout={() => {
              setShowProfile(false)
              setIsPro(false)
              clearSebhaPairing()
              void auth.logout()
            }}
            error={auth.error}
            onClearError={auth.clearError}
          />
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto flex flex-col relative"
              style={{ overscrollBehavior: 'contain' }}
            >
              {state.activeTab === 'live' && (
                <LiveStreamScreen
                  pendingAudioId={pendingAzkarAudioId}
                  onPendingAudioConsumed={() => setPendingAzkarAudioId(null)}
                />
              )}
              {state.activeTab === 'home' && (
                <HomeScreen
                  isPro={state.isPro}
                  onActivatePro={openProFlow}
                  onOpenElafAi={() => setShowElafAi(true)}
                  adhan={adhan}
                  userName={auth.user?.name}
                  userInitials={auth.user?.avatarInitials}
                  userPhotoURL={auth.user?.photoURL}
                  onOpenProfile={openProfile}
                  onOpenMisbahaShop={() => setShowMisbahaShop(true)}
                  locationLoading={location.loading}
                  onRefreshLocationTimes={() => {
                    setActiveTab('prayer')
                    void location.refresh({ forcePermission: true, forceFresh: true })
                  }}
                />
              )}
              {state.activeTab === 'misbaha' && (
                <MisbahaScreen
                  isPro={state.isPro}
                  user={auth.user}
                  onActivatePro={openProFlow}
                  onRequireLogin={requireProLogin}
                  onProActivated={() => setIsPro(true)}
                />
              )}
              {state.activeTab === 'prayer' && <PrayerScreen />}
              {state.activeTab === 'quran' && (
                <QuranScreen isPro={state.isPro} onFullscreenChange={setMushafFullscreen} />
              )}
              {state.activeTab === 'athkar' && <AthkarScreen />}
            </div>

            {!mushafFullscreen && (
              <div className="flex-shrink-0">
                <TabBar active={state.activeTab} onChange={(t) => setActiveTab(t)} />
              </div>
            )}

            {/* Floating Qibla — home only (glass, right side) */}
            {state.activeTab === 'home' && !showQibla && (
              <button
                type="button"
                onClick={() => setShowQibla(true)}
                className="absolute z-[60] w-14 h-14 rounded-full flex flex-col items-center justify-center active:scale-95 transition-transform"
                style={{
                  bottom: mushafFullscreen ? 24 : 96,
                  right: 16,
                  left: 'auto',
                  background: 'rgba(255, 255, 255, 0.22)',
                  backdropFilter: 'blur(14px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
                  boxShadow: '0 8px 24px -6px rgba(19,56,64,0.28)',
                  border: '1.5px solid rgba(255,255,255,0.45)',
                }}
                aria-label="اتجاه القبلة"
              >
                <IconKaaba size={22} color="#133840" />
                <span className="text-[8px] font-black leading-none mt-0.5" style={{ color: '#133840' }}>
                  القبلة
                </span>
              </button>
            )}

            <QiblaOverlay open={showQibla} onClose={() => setShowQibla(false)} />

            {showElafAi && (
              <ElafAiScreen
                isPro={state.isPro}
                onActivatePro={() => {
                  setShowElafAi(false)
                  openProFlow()
                }}
                onBack={() => setShowElafAi(false)}
              />
            )}

            {showMisbahaShop && (
              <MisbahaOrderScreen
                user={auth.user}
                onBack={() => setShowMisbahaShop(false)}
                onOrdered={(productName) => {
                  setShowMisbahaShop(false)
                  setOrderNotice(productName)
                }}
              />
            )}

            {showProWelcome && (
              <ProWelcomeOverlay
                userName={auth.user?.name}
                onClose={() => {
                  setShowProWelcome(false)
                  setActiveTab('misbaha')
                }}
              />
            )}
          </>
        )}

        {authGate && (
          <div className="absolute inset-0 z-[80]">
            <AuthScreen
              onLogin={auth.login}
              onSignup={signupWithNfcClaim}
              error={auth.error}
              onClearError={auth.clearError}
              busy={auth.busy}
              initialEmail={authNfcHint?.email}
              initialMode={pendingClaimTagUid ? 'signup' : 'login'}
              allowSignup={Boolean(pendingClaimTagUid)}
              pendingTagUid={pendingClaimTagUid}
              onRequestNfcScan={() => {
                setAuthGate(null)
                setAuthNfcHint(null)
                setShowProModal(true)
              }}
              onClose={() => {
                setAuthGate(null)
                setPendingOrder(null)
                setAuthNfcHint(null)
                auth.clearError()
              }}
              title={
                pendingClaimTagUid
                  ? 'أنشئ حسابك لربط سبحة إيلاف'
                  : authGate === 'order'
                    ? 'سجّل الدخول لإتمام الطلب'
                    : authGate === 'pro'
                      ? 'سجّل الدخول أو المس سبحة إيلاف'
                      : 'تسجيل الدخول'
              }
            />
          </div>
        )}

        <LocationForceModal
          open={needsLocation && !authGate && !showProfile}
          busy={locBusy || location.loading}
          onTurnOn={() => void enableLocation()}
          onDismiss={() => setLocModalDismissed(true)}
          onManageSettings={() => void LocationService.openSettings('location')}
        />

        {showMosqueConsent && auth.user && !authGate && !showProfile && !needsLocation ? (
          <MosqueLocationConsentBanner
            onAccepted={() => {
              setShowMosqueConsent(false)
              if (location.coords && auth.user) {
                lastLocationSyncRef.current = null
                void syncUserLocationForMosques({
                  userId: auth.user.id,
                  email: auth.user.email,
                  name: auth.user.name,
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  cityLabel: location.cityLabel || state.cityName,
                })
              }
            }}
            onDismiss={() => {
              setShowMosqueConsent(false)
              setMosqueConsentDismissed(true)
            }}
          />
        ) : null}

        {orderNotice && (
          <div className="absolute inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(10,27,32,0.45)' }}
            onClick={() => setOrderNotice(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl p-5"
              style={{ background: '#fff', border: '1px solid #CDEEF5' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-black text-[15px] mb-1" style={{ color: '#133840' }}>تم استلام طلبك</p>
              <p className="text-[12px] mb-4" style={{ color: '#7E9DA3' }}>
                سنراجع طلب «{orderNotice}» ونتواصل معك قريباً.
              </p>
              <button
                className="w-full py-3 rounded-2xl text-[13px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #24ACB5, #1F969E)' }}
                onClick={() => setOrderNotice(null)}
              >
                حسناً
              </button>
            </div>
          </div>
        )}

        {state.showProModal && (
          <ProModal
            user={auth.user}
            initialTagUid={nfcLaunchUid}
            onClose={() => {
              setShowProModal(false)
              setNfcLaunchUid(null)
            }}
            onActivate={() => setIsPro(true)}
            onNewTagReadyForSignup={handleNewTagReadyForSignup}
            onRequireLogin={(hint) => {
              setShowProModal(false)
              requireProLogin(hint || { message: 'سجّل الدخول لاستعادة حسابك المرتبط بسبحة إيلاف' })
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <SimulatorProvider>
      <div className="relative w-full h-full">
        <AppShell />
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </div>
    </SimulatorProvider>
  )
}


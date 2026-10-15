import { useEffect, useMemo, useRef, useState } from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import { useLocationPrayerTimes } from '../../hooks/useLocationPrayerTimes'
import { getNextPrayerIndex } from '../../services/PrayerTimesService'
import {
  IconCompassRose,
  IconLocationPin,
  IconSpeakerMute,
  IconSpeakerSound,
  PrayerIcon,
} from '../icons/IslamicIcons'
import { PrayerArcGauge } from './PrayerArcGauge'
import { QiblaCompass } from './QiblaCompass'

const MUTED_KEY = 'elaf-muted-prayers'

function loadMuted(): Set<string> {
  try {
    const raw = localStorage.getItem(MUTED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveMuted(ids: Set<string>) {
  localStorage.setItem(MUTED_KEY, JSON.stringify([...ids]))
}

function parseAt(timeStr: string, base: Date, dayOffset = 0): Date {
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  const d = new Date(base)
  d.setHours(h || 0, m || 0, 0, 0)
  if (dayOffset) d.setDate(d.getDate() + dayOffset)
  return d
}

function formatClock(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatPrayerTime(time: string) {
  const [h, m] = (time || '00:00').split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return formatClock(d)
}

function getProgressToNext(
  prayers: { time: string }[],
  nextIdx: number,
  now: Date
): { progress: number; remainingLabel: string } {
  const next = prayers[nextIdx] || prayers[0]
  const prev = prayers[nextIdx === 0 ? prayers.length - 1 : nextIdx - 1]

  let target = parseAt(next?.time || '00:00', now)
  if (target.getTime() <= now.getTime()) {
    target = parseAt(next?.time || '00:00', now, 1)
  }

  let prevAt = parseAt(prev?.time || '00:00', now)
  if (nextIdx === 0) prevAt = parseAt(prev?.time || '00:00', now, -1)
  else if (prevAt.getTime() > now.getTime()) prevAt = parseAt(prev?.time || '00:00', now, -1)

  const span = Math.max(1, target.getTime() - prevAt.getTime())
  const elapsed = Math.min(span, Math.max(0, now.getTime() - prevAt.getTime()))
  const progress = Math.min(1, elapsed / span)

  const diffSec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
  const h = Math.floor(diffSec / 3600)
  const m = Math.floor((diffSec % 3600) / 60)
  const s = diffSec % 60
  const remainingLabel =
    h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return { progress, remainingLabel }
}

function endTimeFor(prayers: { id: string; time: string }[], index: number): string {
  const list = prayers.filter((p) => p.id !== 'sunrise')
  const idx = list.findIndex((p) => p.id === prayers[index]?.id)
  if (idx < 0) return prayers[index]?.time || ''
  const next = list[(idx + 1) % list.length]
  return next?.time || prayers[index]?.time || ''
}

export function PrayerScreen() {
  const { state, updatePrayers, updateBrand, setActiveTab } = useSimulator()
  const [view, setView] = useState<'times' | 'qibla'>('times')
  const location = useLocationPrayerTimes(state.calculationMethod)
  const [now, setNow] = useState(() => new Date())
  const [scrub, setScrub] = useState<number | null>(null)
  const [muted, setMuted] = useState<Set<string>>(() => loadMuted())
  const scrubTimer = useRef<number | null>(null)

  const onScrubProgress = (t: number) => {
    setScrub(t)
    if (scrubTimer.current) window.clearTimeout(scrubTimer.current)
    scrubTimer.current = window.setTimeout(() => setScrub(null), 1200)
  }

  const prayers = location.prayers ?? state.prayers
  const cityLabel = location.cityLabel ?? state.cityName
  const compassAngle = location.qiblaBearing ?? 127

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!location.prayers) return
    updatePrayers(location.prayers)
    if (location.cityLabel) {
      updateBrand({ cityName: location.cityLabel })
    }
  }, [location.prayers, location.cityLabel, updatePrayers, updateBrand])

  useEffect(() => {
    if (!location.coords && !location.loading) {
      void location.refresh({ forcePermission: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nextIndex = getNextPrayerIndex(prayers, now)
  const nextPrayer = prayers[nextIndex] || prayers[0]
  const { progress, remainingLabel } = useMemo(
    () => getProgressToNext(prayers, nextIndex, now),
    [prayers, nextIndex, now]
  )
  const displayProgress = scrub ?? progress

  const listPrayers = prayers.filter((p) => p.id !== 'sunrise')

  const toggleMute = (id: string) => {
    setMuted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveMuted(next)
      return next
    })
  }

  if (view === 'qibla') {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-4 pb-6 gap-4" style={{ background: '#F8FCFD' }}>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setView('times')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#EAF9FC', border: '1px solid #CDEEF5' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#133840">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-black" style={{ color: '#133840' }}>
              اتجاه القبلة
            </h1>
            <p className="text-[11px]" style={{ color: '#7E9DA3' }}>
              وجّه الجهاز أفقياً حتى تتوافق العلامة مع السهم
            </p>
          </div>
        </div>

        <div className="elaf-card p-6 w-full">
          {location.error && (
            <p className="text-[11px] font-semibold text-center mb-3" style={{ color: '#B45309' }}>
              {location.error}
            </p>
          )}
          <QiblaCompass
            qiblaBearing={compassAngle}
            cityLabel={cityLabel}
            enabled={view === 'qibla'}
          />
          <button
            type="button"
            onClick={() => void location.refresh({ forcePermission: true, forceFresh: true })}
            disabled={location.loading}
            className="mt-5 w-full py-2.5 rounded-full text-[12px] font-bold disabled:opacity-60"
            style={{ background: '#EAF9FC', color: '#24ACB5', border: '1px solid #CDEEF5' }}
          >
            {location.loading ? 'جاري التحديث…' : 'تحديث الموقع'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F5F7FA' }}>
      {/* Hero header — compact */}
      <div
        className="relative flex-shrink-0 pt-2 pb-4 px-4 overflow-hidden"
        style={{
          backgroundImage: 'url(/images/ky-mosque.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,70,120,0.35) 0%, rgba(15,50,90,0.25) 45%, rgba(10,40,70,0.55) 100%)',
          }}
        />

        <div className="relative z-[1] flex items-center justify-between">
          <button
            onClick={() => setActiveTab('home')}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.35)' }}
            aria-label="رجوع"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </button>
          <button
            onClick={() => void location.refresh({ forcePermission: true, forceFresh: true })}
            disabled={location.loading}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-white/90 max-w-[55%] disabled:opacity-60"
          >
            <IconLocationPin size={11} color="rgba(255,255,255,0.9)" />
            <span className="truncate">
              {location.loading ? 'جاري تحديث المواقيت…' : cityLabel}
            </span>
          </button>
          <button
            onClick={() => setView('qibla')}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.35)' }}
            aria-label="القبلة"
          >
            <IconCompassRose size={14} color="#fff" />
          </button>
        </div>

        <div className="relative z-[1] -mt-1">
          <PrayerArcGauge progress={displayProgress} onScrub={onScrubProgress} />
        </div>

        <div className="relative z-[1] text-center -mt-3 px-2 pb-1">
          <p
            className="text-[26px] font-black text-white leading-none tabular-nums tracking-tight"
            style={{ fontFamily: 'Cairo, sans-serif', direction: 'ltr' }}
          >
            {formatClock(now)}
          </p>
          <p className="text-[10px] font-semibold mt-1 text-white/90" style={{ direction: 'ltr' }}>
            متبقي {remainingLabel}
          </p>
        </div>
      </div>

      {/* Sheet — full-width prayer list */}
      <div
        className="relative flex-1 min-h-0 -mt-3 flex flex-col rounded-t-[24px] px-0 pt-3 pb-3 overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 -8px 30px rgba(15,60,100,0.12)' }}
      >
        {/* Green notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white flex items-center justify-center z-[2]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2BB673' }} />
        </div>

        {/* Next prayer bar — moved here so list gets more room */}
        <div
          className="flex-shrink-0 flex items-center gap-2.5 mx-0 px-4 py-2.5 mb-2 rounded-none mt-1"
          style={{ background: '#F3FBF7', borderTop: '1px solid #C6EBD7', borderBottom: '1px solid #C6EBD7' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#E8F8EF' }}
          >
            <PrayerIcon id={nextPrayer?.id || nextPrayer?.name || 'fajr'} size={20} color="#2BB673" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-bold" style={{ color: '#2BB673' }}>
              الصلاة القادمة
            </p>
            <p className="font-black text-[15px] leading-tight" style={{ color: '#133840' }}>
              {nextPrayer?.name || '—'}
            </p>
          </div>
          <p
            className="text-[16px] font-black tabular-nums flex-shrink-0"
            style={{ color: '#2BB673', direction: 'ltr', fontFamily: 'Cairo, sans-serif' }}
          >
            {nextPrayer ? formatPrayerTime(nextPrayer.time) : '--'}
          </p>
        </div>

        {location.error && (
          <div
            className="flex-shrink-0 mb-2 p-2 rounded-xl text-[11px] font-semibold text-center"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {location.error}
          </div>
        )}

        <div className="relative flex-1 min-h-0 flex flex-col px-0">
          <div
            className="absolute top-2 bottom-2 w-px border-r border-dashed pointer-events-none"
            style={{ right: 14, borderColor: '#C5D5DB' }}
          />

          <div className="flex flex-col gap-0 flex-1 min-h-0 h-full">
            {listPrayers.map((p) => {
              const fullIdx = prayers.findIndex((x) => x.id === p.id)
              const isNext = fullIdx === nextIndex
              const isMuted = muted.has(p.id)
              const end = endTimeFor(prayers, fullIdx)
              return (
                <div key={p.id} className="relative flex items-stretch gap-2 flex-1 min-h-[52px] w-full">
                  <div className="relative z-[1] w-[28px] flex-shrink-0 flex justify-center items-center">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: isNext ? '#2BB673' : '#A8C5CB',
                        boxShadow: isNext ? '0 0 0 4px rgba(43,182,115,0.2)' : 'none',
                      }}
                    />
                  </div>

                  <div
                    className="flex-1 flex items-center gap-2.5 px-3 rounded-none min-h-0 mr-0"
                    style={{
                      background: isNext ? '#F3FBF7' : '#FAFBFC',
                      borderTop: `1px solid ${isNext ? '#C6EBD7' : '#EEF2F4'}`,
                      borderBottom: `1px solid ${isNext ? '#C6EBD7' : '#EEF2F4'}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isNext ? '#E8F8EF' : '#F0F4F6' }}
                    >
                      <PrayerIcon id={p.id} size={20} color={isNext ? '#2BB673' : '#24ACB5'} />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-black text-[14px]" style={{ color: '#133840' }}>
                        {p.name}
                      </p>
                      <p className="text-[11px] mt-0.5 tabular-nums" style={{ color: '#7E9DA3', direction: 'ltr' }}>
                        {formatPrayerTime(p.time)} – {formatPrayerTime(end)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleMute(p.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isMuted ? '#F0F4F6' : '#E8F8EF',
                      }}
                      aria-label={isMuted ? 'تفعيل الأذان' : 'كتم الأذان'}
                    >
                      {isMuted ? (
                        <IconSpeakerMute size={16} color="#7E9DA3" />
                      ) : (
                        <IconSpeakerSound size={16} color="#2BB673" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

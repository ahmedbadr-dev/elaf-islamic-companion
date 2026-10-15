import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import { IconMoonToggle, IconQuranBook, IconSparkle } from '../icons/IslamicIcons'
import {
  LIVE_HERO_SLIDES,
  LIVE_SECTIONS,
  LIVE_TOPICS,
  type LiveStreamItem,
  type LiveStreamKind,
} from '../../data/liveStreams'
import { EVENING_AZKAR_AUDIO, EVENING_AZKAR_OPEN_EVENT } from '../../data/eveningAzkar'
import { MORNING_AZKAR_AUDIO, MORNING_AZKAR_OPEN_EVENT } from '../../data/morningAzkar'

function formatViewers(n?: number) {
  if (!n) return ''
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`
  return String(n)
}

function formatDuration(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function TopicIcon({ icon }: { icon: 'star' | 'hex' | 'moon' | 'book' }) {
  const size = 14
  if (icon === 'star') return <IconSparkle size={size} color="#133840" />
  if (icon === 'moon') return <IconMoonToggle size={size} color="#133840" />
  if (icon === 'book') return <IconQuranBook size={size} color="#133840" />
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#133840" strokeWidth="1.8">
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  )
}

function KindBadge({ kind }: { kind: LiveStreamKind }) {
  if (kind === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }}
        />
        Live
      </span>
    )
  }
  if (kind === 'audio') {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-full"
        style={{ background: 'rgba(36,172,181,0.85)', backdropFilter: 'blur(4px)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
      </span>
    )
  }
  if (kind === 'video') {
    return (
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-full"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    </span>
  )
}

function StreamCard({
  item,
  tall,
  onOpen,
}: {
  item: LiveStreamItem
  tall?: boolean
  onOpen: (item: LiveStreamItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="relative w-full overflow-hidden text-right active:scale-[0.99] transition-transform"
      style={{
        borderRadius: tall ? 22 : 18,
        height: tall ? 200 : 148,
        minWidth: tall ? undefined : 148,
        boxShadow: '0 10px 28px -12px rgba(19,56,64,0.28)',
      }}
    >
      <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background: tall
            ? 'linear-gradient(180deg, rgba(15,38,44,0.15) 20%, rgba(15,38,44,0.85) 100%)'
            : 'linear-gradient(180deg, rgba(15,38,44,0.1) 30%, rgba(15,38,44,0.88) 100%)',
        }}
      />
      <div className="absolute top-2.5 right-2.5 z-[1]">
        <KindBadge kind={item.kind} />
      </div>
      {tall && item.meta && item.kind !== 'live' && (
        <span
          className="absolute top-2.5 left-2.5 z-[1] px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
        >
          {item.meta}
        </span>
      )}
      <div className="absolute bottom-0 inset-x-0 p-3 z-[1]">
        <p className="text-[13px] font-black text-white leading-snug line-clamp-2">{item.title}</p>
        <p className="text-[10px] text-white/75 mt-1">
          {item.kind === 'live' && item.viewers
            ? `${formatViewers(item.viewers)} مشاهدة`
            : item.subtitle || item.channel}
        </p>
      </div>
    </button>
  )
}

function SectionRow({
  title,
  items,
  onOpen,
}: {
  title: string
  items: LiveStreamItem[]
  onOpen: (item: LiveStreamItem) => void
}) {
  return (
    <section className="mb-5">
      <p className="text-[13px] font-bold px-4 mb-2.5 text-right" style={{ color: '#133840' }}>
        {title}
      </p>
      <div className="flex gap-3 px-4 overflow-x-auto pb-1 live-scroll-x">
        {items.map((item) => (
          <div key={item.id} className="flex-shrink-0" style={{ width: 148 }}>
            <StreamCard item={item} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  )
}

function YoutubePlayerOverlay({ item, onClose }: { item: LiveStreamItem; onClose: () => void }) {
  const videoId = item.youtubeId
  const embedSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
    : null

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: '#0F262C' }}>
      <div className="relative z-10 flex items-center justify-between p-4 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          aria-label="إغلاق"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
        {item.kind === 'live' && <KindBadge kind="live" />}
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-3 pb-6 min-h-0">
        <div
          className="w-full overflow-hidden rounded-2xl bg-black flex-shrink-0"
          style={{ aspectRatio: '16 / 9' }}
        >
          {embedSrc ? (
            <iframe
              key={videoId}
              title={item.title}
              src={embedSrc}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
              لا يتوفر رابط البث
            </div>
          )}
        </div>

        <div className="mt-4 text-center px-2">
          <h2 className="text-lg font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {item.title}
          </h2>
          <p className="text-[13px] text-white/70">
            {item.kind === 'live'
              ? `بث مباشر${item.viewers ? ` · ${formatViewers(item.viewers)} مشاهد` : ''}`
              : item.meta}
          </p>
        </div>
      </div>
    </div>
  )
}

function AudioPlayerOverlay({
  item,
  autoplay,
  onClose,
}: {
  item: LiveStreamItem
  autoplay: boolean
  onClose: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = new Audio(item.audioSrc || '')
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onEnded = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    if (autoplay) {
      void audio.play().catch(() => setPlaying(false))
    }

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audioRef.current = null
    }
  }, [item.audioSrc, item.id, autoplay])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play().catch(() => undefined)
    else audio.pause()
  }

  const seek = (ratio: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = Math.max(0, Math.min(duration, ratio * duration))
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: '#0F262C' }}>
      <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(15,38,44,0.55) 0%, rgba(15,38,44,0.92) 100%)' }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            aria-label="إغلاق"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <KindBadge kind="audio" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(145deg, #24ACB5, #133840)',
              boxShadow: '0 16px 40px rgba(36,172,181,0.35)',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {item.title}
          </h2>
          <p className="text-[13px] text-white/75 mb-1">{item.subtitle || item.channel}</p>
          <p className="text-[11px] text-white/50">{item.meta}</p>

          <div className="w-full max-w-sm mt-8">
            <input
              type="range"
              min={0}
              max={1000}
              value={duration ? Math.round((current / duration) * 1000) : 0}
              onChange={(e) => seek(Number(e.target.value) / 1000)}
              className="w-full accent-[#24ACB5]"
            />
            <div className="flex justify-between text-[11px] text-white/60 mt-1 tabular-nums" dir="ltr">
              <span>{formatDuration(current)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggle}
            className="mt-6 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#24ACB5', boxShadow: '0 10px 28px rgba(36,172,181,0.45)' }}
            aria-label={playing ? 'إيقاف' : 'تشغيل'}
          >
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function LiveStreamScreen({
  pendingAudioId,
  onPendingAudioConsumed,
}: {
  pendingAudioId?: string | null
  onPendingAudioConsumed?: () => void
} = {}) {
  const { playSound, setActiveTab } = useSimulator()
  const [heroIdx, setHeroIdx] = useState(0)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [playing, setPlaying] = useState<LiveStreamItem | null>(null)
  const [autoplayAudio, setAutoplayAudio] = useState(false)

  const hero = LIVE_HERO_SLIDES[heroIdx]

  const openItem = (item: LiveStreamItem, opts?: { autoplay?: boolean }) => {
    playSound('click')
    setAutoplayAudio(Boolean(opts?.autoplay && item.kind === 'audio'))
    setPlaying(item)
  }

  // Open from morning/evening azkar notification (via AppShell pending prop or event)
  useEffect(() => {
    const resolveItem = (id: string): LiveStreamItem | null => {
      const fromSections = LIVE_SECTIONS.flatMap((s) => s.items).find((x) => x.id === id)
      if (fromSections) return fromSections
      if (id === EVENING_AZKAR_AUDIO.id) {
        return {
          id: EVENING_AZKAR_AUDIO.id,
          title: EVENING_AZKAR_AUDIO.title,
          subtitle: EVENING_AZKAR_AUDIO.subtitle,
          image: EVENING_AZKAR_AUDIO.image,
          kind: 'audio' as const,
          channel: 'إيلاف',
          meta: EVENING_AZKAR_AUDIO.body,
          audioSrc: EVENING_AZKAR_AUDIO.src,
        }
      }
      if (id === MORNING_AZKAR_AUDIO.id) {
        return {
          id: MORNING_AZKAR_AUDIO.id,
          title: MORNING_AZKAR_AUDIO.title,
          subtitle: MORNING_AZKAR_AUDIO.subtitle,
          image: MORNING_AZKAR_AUDIO.image,
          kind: 'audio' as const,
          channel: 'إيلاف',
          meta: MORNING_AZKAR_AUDIO.body,
          audioSrc: MORNING_AZKAR_AUDIO.src,
        }
      }
      return null
    }

    const openById = (id: string, autoplay = true) => {
      const item = resolveItem(id)
      if (!item) return
      setAutoplayAudio(autoplay)
      setPlaying(item)
      setActiveTopic('audio')
    }

    if (pendingAudioId) {
      openById(pendingAudioId, true)
      onPendingAudioConsumed?.()
    }

    const onEvening = (ev: Event) => {
      const detail = (ev as CustomEvent<{ autoplay?: boolean }>).detail
      openById(EVENING_AZKAR_AUDIO.id, detail?.autoplay !== false)
    }
    const onMorning = (ev: Event) => {
      const detail = (ev as CustomEvent<{ autoplay?: boolean }>).detail
      openById(MORNING_AZKAR_AUDIO.id, detail?.autoplay !== false)
    }
    window.addEventListener(EVENING_AZKAR_OPEN_EVENT, onEvening)
    window.addEventListener(MORNING_AZKAR_OPEN_EVENT, onMorning)
    return () => {
      window.removeEventListener(EVENING_AZKAR_OPEN_EVENT, onEvening)
      window.removeEventListener(MORNING_AZKAR_OPEN_EVENT, onMorning)
    }
  }, [pendingAudioId, onPendingAudioConsumed])

  const filteredSections = activeTopic
    ? LIVE_SECTIONS.filter((s) => {
        if (activeTopic === 'faith') return s.id === 'short-reflections'
        if (activeTopic === 'rituals') return s.id === 'hajj-guide' || s.id === 'umrah'
        if (activeTopic === 'ramadan') return s.id === 'ramadan'
        if (activeTopic === 'quran') return s.id === 'live-now' || s.id === 'short-reflections'
        if (activeTopic === 'audio') return s.id === 'audio-azkar'
        return true
      })
    : LIVE_SECTIONS

  return (
    <div
      className="flex flex-col h-full overflow-y-auto pb-4"
      style={{ background: 'linear-gradient(180deg, #FAF8F4 0%, #F5F9FA 100%)' }}
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            playSound('click')
            setActiveTab('home')
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#F0F4F5', color: '#133840' }}
          aria-label="رجوع"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 text-right">
          <h1 className="text-xl font-black" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
            بث مباشر
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: '#7E9DA3' }}>
            محتوى إيماني · أذكار صوتية · مناسك
          </p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <StreamCard item={hero} tall onOpen={(item) => openItem(item)} />
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {LIVE_HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                playSound('click')
                setHeroIdx(i)
              }}
              className="transition-all rounded-full"
              style={{
                width: heroIdx === i ? 20 : 6,
                height: 6,
                background: heroIdx === i ? '#133840' : '#CBD5E1',
              }}
              aria-label={`الشريحة ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[13px] font-bold px-4 mb-2.5 text-right" style={{ color: '#133840' }}>
          استكشف حسب الموضوع
        </p>
        <div className="flex gap-2 px-4 overflow-x-auto live-scroll-x pb-1">
          {LIVE_TOPICS.map((t) => {
            const on = activeTopic === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playSound('click')
                  setActiveTopic(on ? null : t.id)
                }}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-bold transition-all"
                style={{
                  background: on ? '#133840' : '#fff',
                  color: on ? '#fff' : '#133840',
                  border: `1px solid ${on ? '#133840' : '#E2E8EC'}`,
                  boxShadow: on ? 'none' : '0 2px 8px -2px rgba(19,56,64,0.08)',
                }}
              >
                <TopicIcon icon={t.icon} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredSections.map((section) => (
        <SectionRow
          key={section.id}
          title={section.title}
          items={section.items}
          onOpen={(item) => openItem(item, { autoplay: item.kind === 'audio' })}
        />
      ))}

      {playing?.kind === 'audio' ? (
        <AudioPlayerOverlay
          item={playing}
          autoplay={autoplayAudio}
          onClose={() => {
            setPlaying(null)
            setAutoplayAudio(false)
          }}
        />
      ) : playing?.youtubeId ? (
        <YoutubePlayerOverlay item={playing} onClose={() => setPlaying(null)} />
      ) : playing ? (
        <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: '#0F262C' }}>
          <img src={playing.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between p-4">
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
              {playing.kind === 'live' && <KindBadge kind="live" />}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {playing.title}
              </h2>
              <p className="text-[13px] text-white/70">{playing.meta}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
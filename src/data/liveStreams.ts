export type LiveStreamKind = 'live' | 'video' | 'article' | 'audio'

export type LiveStreamItem = {
  id: string
  title: string
  image: string
  kind: LiveStreamKind
  channel: string
  meta: string
  viewers?: number
  /** Local or remote audio URL (for kind === 'audio') */
  audioSrc?: string
  /** YouTube video / live ID (for kind === 'live' | 'video') */
  youtubeId?: string
  subtitle?: string
}

export type LiveStreamSection = {
  id: string
  title: string
  items: LiveStreamItem[]
}

export const LIVE_TOPICS = [
  { id: 'faith', label: 'لحظات إيمان', icon: 'star' as const },
  { id: 'rituals', label: 'مناسك', icon: 'hex' as const },
  { id: 'ramadan', label: 'رمضان', icon: 'moon' as const },
  { id: 'quran', label: 'قرآن', icon: 'book' as const },
  { id: 'audio', label: 'أذكار صوتية', icon: 'star' as const },
]

export const LIVE_HERO_SLIDES: LiveStreamItem[] = [
  {
    id: 'hero-arafa',
    title: 'يوم عرفة',
    image: '/live/live-hajj-arafa.png',
    kind: 'video',
    channel: 'إيلاف',
    meta: 'أعمال',
    youtubeId: 'oLUSUOjQeN8',
  },
  {
    id: 'hero-kaaba',
    title: 'المسجد الحرام — بث مباشر',
    image: '/live/live-hero-kaaba.png',
    kind: 'live',
    channel: 'إيلاف',
    meta: 'بث مباشر',
    viewers: 12400,
    youtubeId: 'eC4LfEVxvKg',
  },
  {
    id: 'hero-rawdah',
    title: 'الروضة الشريفة',
    image: '/live/live-hero-rawdah.png',
    kind: 'article',
    channel: 'إيلاف',
    meta: '٣ min read',
  },
]

export const LIVE_SECTIONS: LiveStreamSection[] = [
  {
    id: 'audio-azkar',
    title: 'وسائط صوتية — أذكار',
    items: [
      {
        id: 'morning_sabah',
        title: 'أذكار الصباح',
        subtitle: 'الشيخ مشاري راشد العفاسي',
        image: '/live/live-ref-fajr.png',
        kind: 'audio',
        channel: 'إيلاف',
        meta: 'بعد الفجر بساعة',
        audioSrc: '/audio/azkar/morning_sabah.mp3',
      },
      {
        id: 'evening_massa',
        title: 'أذكار المساء',
        subtitle: 'الشيخ مشاري راشد العفاسي',
        image: '/live/live-ref-fajr.png',
        kind: 'audio',
        channel: 'إيلاف',
        meta: 'قبل المغرب بـ ١٥ د',
        audioSrc: '/audio/azkar/evening_massa.mp3',
      },
    ],
  },
  {
    id: 'live-now',
    title: 'بث مباشر',
    items: [
      {
        id: 'live-haram',
        title: 'المسجد الحرام — بث مباشر',
        image: '/live/live-haram-khutbah.png',
        kind: 'live',
        channel: 'إيلاف',
        meta: 'Live',
        viewers: 8420,
        youtubeId: 'eC4LfEVxvKg',
      },
      {
        id: 'live-nabawi',
        title: 'المسجد النبوي — بث مباشر',
        image: '/live/live-nabawi-prayer.png',
        kind: 'live',
        channel: 'إيلاف',
        meta: 'Live',
        viewers: 5310,
        youtubeId: 'Rs7St51oDDc',
      },
      {
        id: 'live-quran',
        title: 'تلاوة مباشرة — جزء عمّ',
        image: '/live/live-quran-recitation.png',
        kind: 'live',
        channel: 'إيلاف',
        meta: 'Live',
        viewers: 2180,
      },
    ],
  },
  {
    id: 'short-reflections',
    title: 'تأملات قصيرة',
    items: [
      {
        id: 'ref-1',
        title: 'تأمل في سورة الفاتحة',
        image: '/live/live-ref-fatiha.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٤ min',
        youtubeId: 'SQAJgHdorFs',
      },
      {
        id: 'ref-2',
        title: 'لحظة خشوع قبل الفجر',
        image: '/live/live-ref-fajr.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٣ min',
        youtubeId: 'vqG5QjaI0pI',
      },
      {
        id: 'ref-3',
        title: 'من فضل الصبر',
        image: '/live/live-ref-sabr.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٥ min',
        youtubeId: 'ia1BmfjLf7k',
      },
    ],
  },
  {
    id: 'hajj-guide',
    title: 'دليلك في الحج',
    items: [
      {
        id: 'hajj-1',
        title: 'يوم التروية',
        image: '/live/live-hajj-tarwiyah.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٧ min',
        youtubeId: 'nXROxeAQECA',
      },
      {
        id: 'hajj-2',
        title: 'يوم عرفة',
        image: '/live/live-hajj-arafa.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٦ min',
        youtubeId: 'oLUSUOjQeN8',
      },
      {
        id: 'hajj-3',
        title: 'رمي الجمرات',
        image: '/live/live-hajj-jamarat.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٥ min',
      },
    ],
  },
  {
    id: 'umrah',
    title: 'رحلة العمرة',
    items: [
      {
        id: 'umrah-1',
        title: 'تعرّف على طريقة الإحرام للعمرة',
        image: '/live/live-umrah-ihram.png',
        kind: 'article',
        channel: 'إيلاف',
        meta: '٥ min read',
      },
      {
        id: 'umrah-2',
        title: 'الطواف — خطوة بخطوة',
        image: '/live/live-umrah-tawaf.png',
        kind: 'article',
        channel: 'إيلاف',
        meta: '٤ min read',
      },
    ],
  },
  {
    id: 'rawdah',
    title: 'الروضة الشريفة',
    items: [
      {
        id: 'rawdah-1',
        title: 'تعرّف على فضل الروضة الشريفة',
        image: '/live/live-rawdah-fadl.png',
        kind: 'article',
        channel: 'إيلاف',
        meta: '٣ min read',
      },
      {
        id: 'rawdah-2',
        title: 'آداب الزيارة',
        image: '/live/live-rawdah-adab.png',
        kind: 'article',
        channel: 'إيلاف',
        meta: '٤ min read',
      },
    ],
  },
  {
    id: 'ramadan',
    title: 'في رمضان',
    items: [
      {
        id: 'ram-1',
        title: 'استعد لرمضان',
        image: '/live/live-ramadan-prepare.png',
        kind: 'article',
        channel: 'إيلاف',
        meta: '٦ min read',
      },
      {
        id: 'ram-2',
        title: 'خيرية رمضان',
        image: '/live/live-ramadan-khayriya.png',
        kind: 'video',
        channel: 'إيلاف',
        meta: '٨ min',
      },
    ],
  },
]

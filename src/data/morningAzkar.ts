/** Morning azkar (أذكار الصباح) — Alafasy recording */

export const MORNING_AZKAR_AUDIO = {
  id: 'morning_sabah',
  key: 'morning_sabah',
  title: 'أذكار الصباح',
  subtitle: 'الشيخ مشاري راشد العفاسي',
  body: 'تُعرض بعد أذان الفجر بساعة',
  /** Bundled under public/ — served by Capacitor WebView */
  src: '/audio/azkar/morning_sabah.mp3',
  image: '/live/live-ref-fajr.png',
  /** Minutes after Fajr */
  minutesAfterFajr: 60,
} as const

export const MORNING_AZKAR_NOTIF_ID = 7311
export const MORNING_AZKAR_CHANNEL_ID = 'elaf_morning_azkar'
export const MORNING_AZKAR_FIRED_KEY = 'elaf-morning-azkar-fired'
export const MORNING_AZKAR_OPEN_EVENT = 'elaf-open-morning-azkar'

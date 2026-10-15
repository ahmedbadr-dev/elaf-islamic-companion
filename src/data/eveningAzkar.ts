/** Evening azkar (أذكار المساء) — full Alafasy recording */

export const EVENING_AZKAR_AUDIO = {
  id: 'evening_massa',
  key: 'evening_massa',
  title: 'أذكار المساء',
  subtitle: 'الشيخ مشاري راشد العفاسي',
  body: 'تُعرض قبل أذان المغرب بـ ١٥ دقيقة',
  /** Bundled under public/ — served by Capacitor WebView */
  src: '/audio/azkar/evening_massa.mp3',
  image: '/live/live-ref-fajr.png',
  /** Minutes before Maghrib */
  minutesBeforeMaghrib: 15,
} as const

export const EVENING_AZKAR_NOTIF_ID = 7301
export const EVENING_AZKAR_CHANNEL_ID = 'elaf_evening_azkar'
export const EVENING_AZKAR_FIRED_KEY = 'elaf-evening-azkar-fired'
export const EVENING_AZKAR_OPEN_EVENT = 'elaf-open-evening-azkar'

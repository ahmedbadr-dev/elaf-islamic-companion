/**
 * Azkar / dhikr voice map.
 *
 * Priority when resolving a key:
 * 1. Local file at /audio/azkar/{key}.mp3  (drop your own short recordings here)
 * 2. Hisn al-Muslim CDN (https://www.hisnmuslim.com/audio/ar/{id}.mp3)
 *
 * Hisn IDs are closest public recorded matches for each phrase.
 */

const HISN = (id: number) => `https://www.hisnmuslim.com/audio/ar/${id}.mp3`

/** Misbaha dhikr ids → audio */
export const MISBAHA_AUDIO: Record<string, string> = {
  subhanallah: HISN(91), // سبحان الله وبحمده
  alhamdulillah: HISN(106), // includes الحمد لله
  allahuakbar: HISN(106), // includes الله أكبر
  lailaha: HISN(92), // لا إله إلا الله وحده…
  salawat: HISN(98), // اللهم صل وسلم على نبينا محمد
}

/** Athkar screen keys → audio */
export const ATHKAR_AUDIO: Record<string, string> = {
  // morning
  'morning-0': HISN(75), // أعوذ بالله… / آية الكرسي
  'morning-1': HISN(94), // سبحان الله وبحمده عدد خلقه…
  'morning-2': HISN(92), // لا إله إلا الله وحده…
  'morning-3': HISN(79), // اللهم أنت ربي…
  'morning-4': HISN(86), // بسم الله الذي لا يضر…

  // evening
  'evening-0': HISN(77), // أمسينا وأمسى الملك لله
  'evening-1': HISN(91), // سبحان الله وبحمده
  'evening-2': HISN(78), // اللهم بك أمسينا…
  'evening-3': HISN(82), // اللهم عافني في بدني…

  // post-prayer
  'post-prayer-0': HISN(69), // سبحان الله / الحمد / الله أكبر block
  'post-prayer-1': HISN(69),
  'post-prayer-2': HISN(69),
  'post-prayer-3': HISN(67), // لا إله إلا الله وحده…

  // sleep
  'sleep-0': HISN(105), // باسمك اللهم أموت وأحيا
  'sleep-1': HISN(104), // اللهم قني عذابك…
  'sleep-2': HISN(100), // آية الكرسي
}

export function resolveAzkarAudioUrl(key: string): string | null {
  const local = `/audio/azkar/${key}.mp3`
  const cdn =
    MISBAHA_AUDIO[key] ??
    ATHKAR_AUDIO[key] ??
    null

  // Prefer CDN as default source; local override is checked at play-time
  // via AzkarVoiceService (HEAD/local first).
  return cdn ?? (key ? local : null)
}

export function localAzkarAudioUrl(key: string): string {
  return `/audio/azkar/${key}.mp3`
}

export function cdnAzkarAudioUrl(key: string): string | null {
  return MISBAHA_AUDIO[key] ?? ATHKAR_AUDIO[key] ?? null
}

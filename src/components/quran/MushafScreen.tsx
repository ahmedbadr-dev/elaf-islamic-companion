import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import { IconQuranBook, IconCopyDoc } from '../icons/IslamicIcons'
import { loadMushafTheme, saveMushafTheme, loadMushafBookmark, saveMushafBookmark, type MushafPaperTheme } from '../../services/UserPrefsService'
import {
  isSpeechRecognitionSupported,
  requestMicrophoneAccess,
  startPageTasmee,
  type TasmeeSession,
  type TasmeeStatus,
} from '../../services/TasmeeService'
import { isSebhaPaired, SEBHA_PAIRING_EVENT } from '../../hooks/useNfc'

// Quran Surahs metadata (all 114 surahs for quick jump)
export interface SurahMeta {
  number: number
  name: string
  nameEn: string
  page: number
  verses: number
  type: 'مكية' | 'مدنية'
}

export const SURAH_LIST: SurahMeta[] = [
  { number: 1, name: 'الفاتحة', nameEn: 'Al-Fatihah', page: 1, verses: 7, type: 'مكية' },
  { number: 2, name: 'البقرة', nameEn: 'Al-Baqarah', page: 2, verses: 286, type: 'مدنية' },
  { number: 3, name: 'آل عمران', nameEn: 'Ali \'Imran', page: 50, verses: 200, type: 'مدنية' },
  { number: 4, name: 'النساء', nameEn: 'An-Nisa', page: 77, verses: 176, type: 'مدنية' },
  { number: 5, name: 'المائدة', nameEn: 'Al-Ma\'idah', page: 106, verses: 120, type: 'مدنية' },
  { number: 6, name: 'الأنعام', nameEn: 'Al-An\'am', page: 128, verses: 165, type: 'مكية' },
  { number: 7, name: 'الأعراف', nameEn: 'Al-A\'raf', page: 151, verses: 206, type: 'مكية' },
  { number: 8, name: 'الأنفال', nameEn: 'Al-Anfal', page: 177, verses: 75, type: 'مدنية' },
  { number: 9, name: 'التوبة', nameEn: 'At-Tawbah', page: 187, verses: 129, type: 'مدنية' },
  { number: 10, name: 'يونس', nameEn: 'Yunus', page: 208, verses: 109, type: 'مكية' },
  { number: 11, name: 'هود', nameEn: 'Hud', page: 221, verses: 123, type: 'مكية' },
  { number: 12, name: 'يوسف', nameEn: 'Yusuf', page: 235, verses: 111, type: 'مكية' },
  { number: 13, name: 'الرعد', nameEn: 'Ar-Ra\'d', page: 249, verses: 43, type: 'مدنية' },
  { number: 14, name: 'ابراهيم', nameEn: 'Ibrahim', page: 255, verses: 52, type: 'مكية' },
  { number: 15, name: 'الحجر', nameEn: 'Al-Hijr', page: 262, verses: 99, type: 'مكية' },
  { number: 16, name: 'النحل', nameEn: 'An-Nahl', page: 267, verses: 128, type: 'مكية' },
  { number: 17, name: 'الإسراء', nameEn: 'Al-Isra', page: 282, verses: 111, type: 'مكية' },
  { number: 18, name: 'الكهف', nameEn: 'Al-Kahf', page: 293, verses: 110, type: 'مكية' },
  { number: 19, name: 'مريم', nameEn: 'Maryam', page: 305, verses: 98, type: 'مكية' },
  { number: 20, name: 'طه', nameEn: 'Taha', page: 312, verses: 135, type: 'مكية' },
  { number: 21, name: 'الأنبياء', nameEn: 'Al-Anbya', page: 322, verses: 112, type: 'مكية' },
  { number: 22, name: 'الحج', nameEn: 'Al-Hajj', page: 332, verses: 78, type: 'مدنية' },
  { number: 23, name: 'المؤمنون', nameEn: 'Al-Mu\'minun', page: 342, verses: 118, type: 'مكية' },
  { number: 24, name: 'النور', nameEn: 'An-Nur', page: 350, verses: 64, type: 'مدنية' },
  { number: 25, name: 'الفرقان', nameEn: 'Al-Furqan', page: 359, verses: 77, type: 'مكية' },
  { number: 26, name: 'الشعراء', nameEn: 'Ash-Shu\'ara', page: 367, verses: 227, type: 'مكية' },
  { number: 27, name: 'النمل', nameEn: 'An-Naml', page: 377, verses: 93, type: 'مكية' },
  { number: 28, name: 'القصص', nameEn: 'Al-Qasas', page: 385, verses: 88, type: 'مكية' },
  { number: 29, name: 'العنكبوت', nameEn: 'Al-\'Ankabut', page: 396, verses: 69, type: 'مكية' },
  { number: 30, name: 'الروم', nameEn: 'Ar-Rum', page: 404, verses: 60, type: 'مكية' },
  { number: 31, name: 'لقمان', nameEn: 'Luqman', page: 411, verses: 34, type: 'مكية' },
  { number: 32, name: 'السجدة', nameEn: 'As-Sajdah', page: 415, verses: 30, type: 'مكية' },
  { number: 33, name: 'الأحزاب', nameEn: 'Al-Ahzab', page: 418, verses: 73, type: 'مدنية' },
  { number: 34, name: 'سبإ', nameEn: 'Saba', page: 428, verses: 54, type: 'مكية' },
  { number: 35, name: 'فاطر', nameEn: 'Fatir', page: 434, verses: 45, type: 'مكية' },
  { number: 36, name: 'يس', nameEn: 'Ya-Sin', page: 440, verses: 83, type: 'مكية' },
  { number: 37, name: 'الصافات', nameEn: 'As-Saffat', page: 446, verses: 182, type: 'مكية' },
  { number: 38, name: 'ص', nameEn: 'Sad', page: 453, verses: 88, type: 'مكية' },
  { number: 39, name: 'الزمر', nameEn: 'Az-Zumar', page: 458, verses: 75, type: 'مكية' },
  { number: 40, name: 'غافر', nameEn: 'Ghafir', page: 467, verses: 85, type: 'مكية' },
  { number: 41, name: 'فصلت', nameEn: 'Fussilat', page: 477, verses: 54, type: 'مكية' },
  { number: 42, name: 'الشورى', nameEn: 'Ash-Shuraa', page: 483, verses: 53, type: 'مكية' },
  { number: 43, name: 'الزخرف', nameEn: 'Az-Zukhruf', page: 489, verses: 89, type: 'مكية' },
  { number: 44, name: 'الدخان', nameEn: 'Ad-Dukhan', page: 496, verses: 59, type: 'مكية' },
  { number: 45, name: 'الجاثية', nameEn: 'Al-Jathiyah', page: 499, verses: 37, type: 'مكية' },
  { number: 46, name: 'الأحقاف', nameEn: 'Al-Ahqaf', page: 502, verses: 35, type: 'مكية' },
  { number: 47, name: 'محمد', nameEn: 'Muhammad', page: 507, verses: 38, type: 'مدنية' },
  { number: 48, name: 'الفتح', nameEn: 'Al-Fath', page: 511, verses: 29, type: 'مدنية' },
  { number: 49, name: 'الحجرات', nameEn: 'Al-Hujurat', page: 515, verses: 18, type: 'مدنية' },
  { number: 50, name: 'ق', nameEn: 'Qaf', page: 518, verses: 45, type: 'مكية' },
  { number: 51, name: 'الذاريات', nameEn: 'Adh-Dhariyat', page: 520, verses: 60, type: 'مكية' },
  { number: 52, name: 'الطور', nameEn: 'At-Tur', page: 523, verses: 49, type: 'مكية' },
  { number: 53, name: 'النجم', nameEn: 'An-Najm', page: 526, verses: 62, type: 'مكية' },
  { number: 54, name: 'القمر', nameEn: 'Al-Qamar', page: 528, verses: 55, type: 'مكية' },
  { number: 55, name: 'الرحمن', nameEn: 'Ar-Rahman', page: 531, verses: 78, type: 'مدنية' },
  { number: 56, name: 'الواقعة', nameEn: 'Al-Waqi\'ah', page: 534, verses: 96, type: 'مكية' },
  { number: 57, name: 'الحديد', nameEn: 'Al-Hadid', page: 537, verses: 29, type: 'مدنية' },
  { number: 58, name: 'المجادلة', nameEn: 'Al-Mujadila', page: 542, verses: 22, type: 'مدنية' },
  { number: 59, name: 'الحشر', nameEn: 'Al-Hashr', page: 545, verses: 24, type: 'مدنية' },
  { number: 60, name: 'الممتحنة', nameEn: 'Al-Mumtahanah', page: 549, verses: 13, type: 'مدنية' },
  { number: 61, name: 'الصف', nameEn: 'As-Saf', page: 551, verses: 14, type: 'مدنية' },
  { number: 62, name: 'الجمعة', nameEn: 'Al-Jumu\'ah', page: 553, verses: 11, type: 'مدنية' },
  { number: 63, name: 'المنافقون', nameEn: 'Al-Munafiqun', page: 554, verses: 11, type: 'مدنية' },
  { number: 64, name: 'التغابن', nameEn: 'At-Taghabun', page: 556, verses: 18, type: 'مدنية' },
  { number: 65, name: 'الطلاق', nameEn: 'At-Talaq', page: 558, verses: 12, type: 'مدنية' },
  { number: 66, name: 'التحريم', nameEn: 'At-Tahrim', page: 560, verses: 12, type: 'مدنية' },
  { number: 67, name: 'الملك', nameEn: 'Al-Mulk', page: 562, verses: 30, type: 'مكية' },
  { number: 68, name: 'القلم', nameEn: 'Al-Qalam', page: 564, verses: 52, type: 'مكية' },
  { number: 69, name: 'الحاقة', nameEn: 'Al-Haqqah', page: 566, verses: 52, type: 'مكية' },
  { number: 70, name: 'المعارج', nameEn: 'Al-Ma\'arij', page: 568, verses: 44, type: 'مكية' },
  { number: 71, name: 'نوح', nameEn: 'Nuh', page: 570, verses: 28, type: 'مكية' },
  { number: 72, name: 'الجن', nameEn: 'Al-Jinn', page: 572, verses: 28, type: 'مكية' },
  { number: 73, name: 'المزمل', nameEn: 'Al-Muzzammil', page: 574, verses: 20, type: 'مكية' },
  { number: 74, name: 'المدثر', nameEn: 'Al-Muddaththir', page: 575, verses: 56, type: 'مكية' },
  { number: 75, name: 'القيامة', nameEn: 'Al-Qiyamah', page: 577, verses: 40, type: 'مكية' },
  { number: 76, name: 'الانسان', nameEn: 'Al-Insan', page: 578, verses: 31, type: 'مدنية' },
  { number: 77, name: 'المرسلات', nameEn: 'Al-Mursalat', page: 580, verses: 50, type: 'مكية' },
  { number: 78, name: 'النبإ', nameEn: 'An-Naba', page: 582, verses: 40, type: 'مكية' },
  { number: 79, name: 'النازعات', nameEn: 'An-Nazi\'at', page: 583, verses: 46, type: 'مكية' },
  { number: 80, name: 'عبس', nameEn: '\'Abasa', page: 585, verses: 42, type: 'مكية' },
  { number: 81, name: 'التكوير', nameEn: 'At-Takwir', page: 586, verses: 29, type: 'مكية' },
  { number: 82, name: 'الإنفطار', nameEn: 'Al-Infitar', page: 587, verses: 19, type: 'مكية' },
  { number: 83, name: 'المطففين', nameEn: 'Al-Mutaffifin', page: 587, verses: 36, type: 'مكية' },
  { number: 84, name: 'الإنشقاق', nameEn: 'Al-Inshiqaq', page: 589, verses: 25, type: 'مكية' },
  { number: 85, name: 'البروج', nameEn: 'Al-Buruj', page: 590, verses: 22, type: 'مكية' },
  { number: 86, name: 'الطارق', nameEn: 'At-Tariq', page: 591, verses: 17, type: 'مكية' },
  { number: 87, name: 'الأعلى', nameEn: 'Al-A\'la', page: 591, verses: 19, type: 'مكية' },
  { number: 88, name: 'الغاشية', nameEn: 'Al-Ghashiyah', page: 592, verses: 26, type: 'مكية' },
  { number: 89, name: 'الفجر', nameEn: 'Al-Fajr', page: 593, verses: 30, type: 'مكية' },
  { number: 90, name: 'البلد', nameEn: 'Al-Balad', page: 594, verses: 20, type: 'مكية' },
  { number: 91, name: 'الشمس', nameEn: 'Ash-Shams', page: 595, verses: 15, type: 'مكية' },
  { number: 92, name: 'الليل', nameEn: 'Al-Layl', page: 595, verses: 21, type: 'مكية' },
  { number: 93, name: 'الضحى', nameEn: 'Ad-Duhaa', page: 596, verses: 11, type: 'مكية' },
  { number: 94, name: 'الشرح', nameEn: 'Ash-Sharh', page: 596, verses: 8, type: 'مكية' },
  { number: 95, name: 'التين', nameEn: 'At-Tin', page: 597, verses: 8, type: 'مكية' },
  { number: 96, name: 'العلق', nameEn: 'Al-\'Alaq', page: 597, verses: 19, type: 'مكية' },
  { number: 97, name: 'القدر', nameEn: 'Al-Qadr', page: 598, verses: 5, type: 'مكية' },
  { number: 98, name: 'البينة', nameEn: 'Al-Bayyinah', page: 598, verses: 8, type: 'مدنية' },
  { number: 99, name: 'الزلزلة', nameEn: 'Az-Zalzalah', page: 599, verses: 8, type: 'مدنية' },
  { number: 100, name: 'العاديات', nameEn: 'Al-\'Adiyat', page: 599, verses: 11, type: 'مكية' },
  { number: 101, name: 'القارعة', nameEn: 'Al-Qari\'ah', page: 600, verses: 11, type: 'مكية' },
  { number: 102, name: 'التكاثر', nameEn: 'At-Takathur', page: 600, verses: 8, type: 'مكية' },
  { number: 103, name: 'العصر', nameEn: 'Al-\'Asr', page: 601, verses: 3, type: 'مكية' },
  { number: 104, name: 'الهمزة', nameEn: 'Al-Humazah', page: 601, verses: 9, type: 'مكية' },
  { number: 105, name: 'الفيل', nameEn: 'Al-Fil', page: 601, verses: 5, type: 'مكية' },
  { number: 106, name: 'قريش', nameEn: 'Quraysh', page: 602, verses: 4, type: 'مكية' },
  { number: 107, name: 'الماعون', nameEn: 'Al-Ma\'un', page: 602, verses: 7, type: 'مكية' },
  { number: 108, name: 'الكوثر', nameEn: 'Al-Kawthar', page: 602, verses: 3, type: 'مكية' },
  { number: 109, name: 'الكافرون', nameEn: 'Al-Kafirun', page: 603, verses: 6, type: 'مكية' },
  { number: 110, name: 'النصر', nameEn: 'An-Nasr', page: 603, verses: 3, type: 'مدنية' },
  { number: 111, name: 'المسد', nameEn: 'Al-Masad', page: 603, verses: 5, type: 'مكية' },
  { number: 112, name: 'الإخلاص', nameEn: 'Al-Ikhlas', page: 604, verses: 4, type: 'مكية' },
  { number: 113, name: 'الفلق', nameEn: 'Al-Falaq', page: 604, verses: 5, type: 'مكية' },
  { number: 114, name: 'الناس', nameEn: 'An-Nas', page: 604, verses: 6, type: 'مكية' },
]

// Built-in fallback data for Page 1 (Al-Fatihah) in authentic Uthmanic script
const FALLBACK_PAGE_1 = {
  number: 1,
  ayahs: [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', numberInSurah: 1, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', numberInSurah: 2, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', numberInSurah: 3, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
    { number: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', numberInSurah: 4, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', numberInSurah: 5, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', numberInSurah: 6, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', numberInSurah: 7, juz: 1, hizbQuarter: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', numberOfAyahs: 7, revelationType: 'Meccan' } },
  ],
}

// Convert English numbers to Arabic-Indic digits
function toArabicDigits(n: number | string): string {
  const map: Record<string, string> = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
  }
  return n.toString().replace(/\d/g, (d) => map[d] || d)
}

/** Traditional mushaf ayah-end seal (khatam): 8-point star + number ring */
function AyahEndMarker({ number, color }: { number: number; color: string }) {
  return (
    <span className="ayah-end-marker" title={`آية ${number}`} style={{ color }}>
      <svg className="ayah-marker-shape" viewBox="0 0 64 64" aria-hidden>
        {/* Soft wash behind the seal */}
        <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.07" />

        {/* Outer pointed tips (8-point compass) */}
        <path
          fill="currentColor"
          opacity="0.22"
          d="M32 2 L36.2 16.5 L50.5 8.5 L42.5 22.2 L58.5 22 L45.5 30.5 L62 32 L45.5 33.5 L58.5 42 L42.5 41.8 L50.5 55.5 L36.2 47.5 L32 62 L27.8 47.5 L13.5 55.5 L21.5 41.8 L5.5 42 L18.5 33.5 L2 32 L18.5 30.5 L5.5 22 L21.5 22.2 L13.5 8.5 L27.8 16.5 Z"
        />

        {/* Twin squares → classic Islamic khatam */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinejoin="round"
          d="M32 10 L48 32 L32 54 L16 32 Z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinejoin="round"
          d="M16.5 16.5 L47.5 16.5 L47.5 47.5 L16.5 47.5 Z"
        />

        {/* Number disc */}
        <circle cx="32" cy="32" r="11.5" fill="currentColor" opacity="0.12" />
        <circle cx="32" cy="32" r="11.5" fill="none" stroke="currentColor" strokeWidth="1.45" />
        <circle cx="32" cy="32" r="9" fill="none" stroke="currentColor" strokeWidth="0.65" opacity="0.5" />
      </svg>
      <span className="ayah-marker-num">{toArabicDigits(number)}</span>
    </span>
  )
}

interface AyahData {
  number: number
  text: string
  numberInSurah: number
  juz: number
  hizbQuarter: number
  surah: {
    number: number
    name: string
    englishName: string
    numberOfAyahs: number
    revelationType: string
  }
}

interface PageData {
  number: number
  ayahs: AyahData[]
}

export function MushafScreen({
  isPro,
  onFullscreenChange,
}: {
  isPro?: boolean
  onFullscreenChange?: (fullscreen: boolean) => void
}) {
  const { playSound, setActiveTab } = useSimulator()
  const [currentPage, setCurrentPage] = useState<number>(() => loadMushafBookmark()?.page ?? 1)
  const [pageData, setPageData] = useState<PageData>(FALLBACK_PAGE_1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedAyah, setSelectedAyah] = useState<AyahData | null>(null)
  const [paperTheme, setPaperThemeState] = useState<MushafPaperTheme>(() => loadMushafTheme())
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(() => loadMushafBookmark()?.page ?? null)
  const [sebhaPaired, setSebhaPaired] = useState(() => isSebhaPaired())
  const [showTasmeeLock, setShowTasmeeLock] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /** تسميع = PRO + اقتران سبحة NFC */
  const canUseTasmee = Boolean(isPro && sebhaPaired)

  const setFullscreen = useCallback(
    (value: boolean) => {
      setIsFullscreen(value)
      onFullscreenChange?.(value)
    },
    [onFullscreenChange]
  )

  useEffect(() => {
    return () => {
      onFullscreenChange?.(false)
    }
  }, [onFullscreenChange])

  useEffect(() => {
    const sync = () => setSebhaPaired(isSebhaPaired())
    sync()
    window.addEventListener(SEBHA_PAIRING_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener(SEBHA_PAIRING_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const setPaperTheme = (theme: MushafPaperTheme) => {
    setPaperThemeState(theme)
    saveMushafTheme(theme)
  }

  useEffect(() => {
    const onPref = (e: Event) => {
      const detail = (e as CustomEvent<MushafPaperTheme>).detail
      if (detail) setPaperThemeState(detail)
    }
    window.addEventListener('elaf-mushaf-theme', onPref)
    return () => window.removeEventListener('elaf-mushaf-theme', onPref)
  }, [])

  const [showSurahModal, setShowSurahModal] = useState<boolean>(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)
  const [searchSurah, setSearchSurah] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [tasmeeStatus, setTasmeeStatus] = useState<TasmeeStatus>('idle')
  const [tasmeeTranscript, setTasmeeTranscript] = useState('')
  const [tasmeeTargetNum, setTasmeeTargetNum] = useState<number | null>(null)
  /** When true, page is in تسميع mode (ayahs hidden until revealed) */
  const [tasmeeMode, setTasmeeMode] = useState(false)
  /** Ayah numbers revealed after correct recitation */
  const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(() => new Set())
  const [tasmeeErrorMsg, setTasmeeErrorMsg] = useState('')
  const tasmeeSessionRef = useRef<TasmeeSession | null>(null)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
    }
  }, [])

  const playAyahAudio = useCallback((ayahGlobalNum: number) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahGlobalNum}.mp3`)
    audioRef.current = audio
    setIsPlayingAudio(true)
    audio.play().catch(() => setIsPlayingAudio(false))
    audio.onended = () => setIsPlayingAudio(false)
    audio.onerror = () => setIsPlayingAudio(false)
  }, [])

  const stopTasmee = useCallback((opts?: { keepError?: boolean }) => {
    tasmeeSessionRef.current?.stop()
    tasmeeSessionRef.current = null
    setTasmeeTargetNum(null)
    setTasmeeTranscript('')
    setTasmeeMode(false)
    setRevealedAyahs(new Set())
    if (!opts?.keepError) {
      setTasmeeStatus('idle')
      setTasmeeErrorMsg('')
    }
  }, [])

  // Stop تسميع when changing page
  useEffect(() => {
    stopTasmee()
  }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      tasmeeSessionRef.current?.stop()
    }
  }, [])

  const startPageTasmeeSession = useCallback(async () => {
    if (!canUseTasmee) {
      setShowTasmeeLock(true)
      playSound('click')
      return
    }

    stopAudio()
    tasmeeSessionRef.current?.stop()
    tasmeeSessionRef.current = null

    const ayahs = pageData.ayahs
    if (!ayahs.length) return

    // Always start from first ayah on the page; hide every ayah
    const startIndex = 0

    setTasmeeMode(true)
    setRevealedAyahs(new Set())
    setTasmeeErrorMsg('')
    setTasmeeStatus('requesting')
    setTasmeeTranscript('')
    setTasmeeTargetNum(ayahs[startIndex].number)
    setSelectedAyah(ayahs[startIndex])

    if (!isSpeechRecognitionSupported()) {
      setTasmeeStatus('unsupported')
      setTasmeeErrorMsg('التسميع غير مدعوم على هذا الجهاز')
      return
    }

    const ok = await requestMicrophoneAccess()
    if (!ok) {
      setTasmeeStatus('denied')
      setTasmeeErrorMsg('يلزم السماح بالميكروفون للتسميع')
      return
    }

    playSound('click')
    tasmeeSessionRef.current = startPageTasmee({
      ayahs: ayahs.map((a) => ({ number: a.number, text: a.text })),
      startIndex,
      threshold: 0.5,
      onAyahCorrect: (ayah) => {
        playSound('celebrate')
        setRevealedAyahs((prev) => {
          const next = new Set(prev)
          next.add(ayah.number)
          return next
        })
        setTasmeeTargetNum(ayah.number)
      },
      onStatus: (status, detail) => {
        setTasmeeStatus(status)
        if (detail?.transcript) setTasmeeTranscript(detail.transcript)
        if (detail?.ayahNumber != null) {
          setTasmeeTargetNum(detail.ayahNumber)
          const found = ayahs.find((a) => a.number === detail.ayahNumber)
          if (found) setSelectedAyah(found)
        }
        if (status === 'incorrect') {
          tasmeeSessionRef.current = null
          setTasmeeErrorMsg('هناك خطأ في التسميع — توقّف الاستماع. حاول مرة أخرى.')
          playSound('click')
        }
        if (status === 'complete') {
          tasmeeSessionRef.current = null
          setTasmeeErrorMsg('')
          window.setTimeout(() => {
            setTasmeeMode(false)
            setTasmeeStatus('idle')
            setTasmeeTargetNum(null)
            setRevealedAyahs(new Set())
          }, 2200)
        }
        if (status === 'denied' || status === 'unsupported' || status === 'error') {
          tasmeeSessionRef.current = null
          setTasmeeErrorMsg(
            status === 'denied'
              ? 'يلزم السماح بالميكروفون للتسميع'
              : status === 'unsupported'
                ? 'التسميع غير مدعوم على هذا الجهاز'
                : 'حدث خطأ أثناء التسميع'
          )
        }
      },
    })
  }, [pageData.ayahs, playSound, stopAudio, canUseTasmee])

  const isListening = tasmeeStatus === 'listening' || tasmeeStatus === 'requesting'

  const toggleTasmee = useCallback(() => {
    playSound('click')
    if (!canUseTasmee && !(tasmeeStatus === 'listening' || tasmeeStatus === 'requesting')) {
      setShowTasmeeLock(true)
      return
    }
    if (tasmeeStatus === 'listening' || tasmeeStatus === 'requesting') {
      stopTasmee()
      return
    }
    if (tasmeeStatus === 'incorrect' || tasmeeErrorMsg) {
      stopTasmee()
      return
    }
    void startPageTasmeeSession()
  }, [tasmeeStatus, tasmeeErrorMsg, startPageTasmeeSession, stopTasmee, playSound, canUseTasmee])

  // Fetch real Mushaf page from API
  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    fetch(`https://api.alquran.cloud/v1/page/${currentPage}/quran-uthmani`)
      .then((res) => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then((data) => {
        if (!isCancelled && data && data.data && data.data.ayahs) {
          setPageData(data.data)
        }
      })
      .catch(() => {
        // Fallback if offline or API error
        if (currentPage === 1) {
          setPageData(FALLBACK_PAGE_1)
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [currentPage])

  // Determine current Surah and Juz info from the first Ayah
  const firstAyah = pageData.ayahs[0]
  const currentSurah = firstAyah?.surah
  const juzNum = firstAyah?.juz || 1
  const hizbQuarter = firstAyah?.hizbQuarter || 1
  const hizbNum = Math.ceil(hizbQuarter / 4)

  // Group ayahs by surah if page contains multiple surahs
  const groupedSurahs = useMemo(() => {
    const groups: { surah: AyahData['surah']; ayahs: AyahData[] }[] = []
    pageData.ayahs.forEach((ayah) => {
      const lastGroup = groups[groups.length - 1]
      if (!lastGroup || lastGroup.surah.number !== ayah.surah.number) {
        groups.push({ surah: ayah.surah, ayahs: [ayah] })
      } else {
        lastGroup.ayahs.push(ayah)
      }
    })
    return groups
  }, [pageData])

  // Theme style mappings — accent = إيلاف brand green (#24ACB5)
  const BRAND = '#24ACB5'
  const BRAND_DARK = '#1F969E'
  const themeStyles = {
    white: {
      bg: '#FFFFFF',
      chrome: '#F7F7F7',
      textColor: '#1A1A1A',
      muted: '#6B7280',
      gold: '#C5A059',
      accent: BRAND,
      accentDark: BRAND_DARK,
      pillBg: '#EAF9FC',
      pillText: '#1A1A1A',
      icon: '#374151',
      border: '#CDEEF5',
      ayahHighlight: 'rgba(36, 172, 181, 0.22)',
      markerColor: '#1A1A1A',
    },
    cream: {
      bg: '#FAF6EB',
      chrome: '#F3ECE0',
      textColor: '#153036',
      muted: '#7A6A4E',
      gold: '#C5A059',
      accent: BRAND,
      accentDark: BRAND_DARK,
      pillBg: '#EFE6D4',
      pillText: '#133840',
      icon: '#3A5C64',
      border: '#E2D6BA',
      ayahHighlight: 'rgba(36, 172, 181, 0.22)',
      markerColor: '#133840',
    },
    dark: {
      bg: '#0A0A0A',
      chrome: '#141414',
      textColor: '#F5F5F5',
      muted: '#9CA3AF',
      gold: '#E5C158',
      accent: BRAND,
      accentDark: BRAND_DARK,
      pillBg: '#0F262C',
      pillText: '#FFFFFF',
      icon: '#E5E7EB',
      border: '#1A3339',
      ayahHighlight: 'rgba(36, 172, 181, 0.35)',
      markerColor: '#F5F5F5',
    },
    emerald: {
      bg: '#F3F8F5',
      chrome: '#E8F3EC',
      textColor: '#0E2E28',
      muted: '#5B7A6E',
      gold: '#B89047',
      accent: BRAND,
      accentDark: BRAND_DARK,
      pillBg: '#EAF9FC',
      pillText: '#0E2E28',
      icon: '#0E2E28',
      border: '#CDEEF5',
      ayahHighlight: 'rgba(36, 172, 181, 0.22)',
      markerColor: '#0E2E28',
    },
  }[paperTheme]

  const goPrev = useCallback(() => {
    if (currentPage <= 1) return
    playSound('click')
    setCurrentPage((p) => Math.max(1, p - 1))
    setSelectedAyah(null)
  }, [currentPage, playSound])

  const goNext = useCallback(() => {
    if (currentPage >= 604) return
    playSound('click')
    setCurrentPage((p) => Math.min(604, p + 1))
    setSelectedAyah(null)
  }, [currentPage, playSound])

  // Touch / pointer swipe — horizontal flip between mushaf pages
  const swipeRef = useRef<{
    x: number
    y: number
    active: boolean
    swiped: boolean
  } | null>(null)
  const [swipeHint, setSwipeHint] = useState(0) // visual drag offset

  const onSwipeStart = (clientX: number, clientY: number) => {
    swipeRef.current = { x: clientX, y: clientY, active: true, swiped: false }
    setSwipeHint(0)
  }

  const onSwipeMove = (clientX: number, clientY: number) => {
    const s = swipeRef.current
    if (!s?.active) return
    const dx = clientX - s.x
    const dy = clientY - s.y
    // Only hint when clearly horizontal
    if (Math.abs(dx) > Math.abs(dy) + 8) {
      setSwipeHint(Math.max(-48, Math.min(48, dx * 0.25)))
    }
  }

  const onSwipeEnd = (clientX: number, clientY: number) => {
    const s = swipeRef.current
    setSwipeHint(0)
    if (!s?.active) return
    const dx = clientX - s.x
    const dy = clientY - s.y
    swipeRef.current = { ...s, active: false }
    // Need a clear horizontal swipe (not a vertical scroll)
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.15) return
    swipeRef.current.swiped = true
    // RTL mushaf: swipe left → next page, swipe right → previous
    if (dx < 0) goNext()
    else goPrev()
  }

  const surahDisplayName = currentSurah
    ? currentSurah.name.replace(/^سُورَةُ\s*/u, '').replace(/^سورة\s*/u, '')
    : '…'

  // Keep الورد القراني bookmark in sync with last reading position
  useEffect(() => {
    if (!currentSurah || isLoading) return
    if (pageData.number !== currentPage) return
    const next = saveMushafBookmark({
      page: currentPage,
      surahName: surahDisplayName,
      surahNumber: currentSurah.number,
    })
    setBookmarkPage(next.page)
  }, [currentPage, pageData.number, currentSurah?.number, surahDisplayName, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const pinBookmark = () => {
    playSound('click')
    const next = saveMushafBookmark({
      page: currentPage,
      surahName: surahDisplayName,
      surahNumber: currentSurah?.number,
    })
    setBookmarkPage(next.page)
  }

  return (
    <div className="flex flex-col h-full select-none relative" style={{ background: themeStyles.bg }}>
      {/* Top chrome — hidden in fullscreen */}
      {!isFullscreen && (
      <div
        className="flex items-center gap-2 px-3 py-2.5 z-20 flex-shrink-0"
        style={{ background: themeStyles.chrome, borderBottom: `1px solid ${themeStyles.border}` }}
      >
        <button
          type="button"
          onClick={() => {
            playSound('click')
            const order: MushafPaperTheme[] = ['white', 'cream', 'emerald', 'dark']
            const i = order.indexOf(paperTheme)
            setPaperTheme(order[(i + 1) % order.length])
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: themeStyles.icon }}
          title="تغيير لون المصحف"
          aria-label="إعدادات المظهر"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            playSound('click')
            setShowSurahModal(true)
            setSearchSurah('')
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: themeStyles.icon }}
          aria-label="بحث"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            playSound('click')
            setFullscreen(true)
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: themeStyles.icon }}
          aria-label="ملء الشاشة"
          title="عرض المصحف بملء الشاشة"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v3" />
            <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>

        <button
          type="button"
          onClick={pinBookmark}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            color: bookmarkPage === currentPage ? themeStyles.accent : themeStyles.icon,
            background: bookmarkPage === currentPage ? themeStyles.pillBg : 'transparent',
          }}
          aria-label="حفظ علامة الورد"
          title="حفظ علامة الورد القراني"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarkPage === currentPage ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Center info pill */}
        <button
          type="button"
          onClick={() => {
            playSound('click')
            setShowSurahModal(true)
          }}
          className="flex-1 min-w-0 rounded-xl px-3 py-1.5 text-center"
          style={{ background: themeStyles.pillBg, color: themeStyles.pillText }}
        >
          <p className="font-black text-[13px] truncate leading-tight" style={{ fontFamily: 'Cairo, sans-serif' }}>
            سورة {surahDisplayName}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: themeStyles.muted, direction: 'rtl' }}>
            صفحة {toArabicDigits(currentPage)} | جزء {toArabicDigits(juzNum)} | حزب {toArabicDigits(hizbNum)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            playSound('click')
            setShowSurahModal(true)
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: themeStyles.icon }}
          aria-label="فهرس السور"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      </div>
      )}

      {/* Exit fullscreen — floating */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => {
            playSound('click')
            setFullscreen(false)
          }}
          className="absolute top-3 left-3 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: themeStyles.chrome,
            border: `1px solid ${themeStyles.border}`,
            color: themeStyles.icon,
          }}
          aria-label="إنهاء ملء الشاشة"
          title="إنهاء ملء الشاشة"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        </button>
      )}

      {/* Mushaf page body — swipe left/right to turn pages */}
      <div
        className="flex-1 overflow-y-auto relative touch-pan-y"
        style={{
          color: themeStyles.textColor,
          background: themeStyles.bg,
          touchAction: 'pan-y',
        }}
        onTouchStart={(e) => {
          const t = e.touches[0]
          if (t) onSwipeStart(t.clientX, t.clientY)
        }}
        onTouchMove={(e) => {
          const t = e.touches[0]
          if (t) onSwipeMove(t.clientX, t.clientY)
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0]
          if (t) onSwipeEnd(t.clientX, t.clientY)
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') return // handled by touch events
          if (e.button !== 0) return
          onSwipeStart(e.clientX, e.clientY)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (e.pointerType === 'touch') return
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
          onSwipeMove(e.clientX, e.clientY)
        }}
        onPointerUp={(e) => {
          if (e.pointerType === 'touch') return
          onSwipeEnd(e.clientX, e.clientY)
        }}
        onClick={(e) => {
          // Ignore edge tap if a swipe just fired
          if (swipeRef.current?.swiped) {
            swipeRef.current.swiped = false
            return
          }
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          if (x < rect.width * 0.22) goNext()
          else if (x > rect.width * 0.78) goPrev()
        }}
      >
        <div
          style={{
            transform: swipeHint ? `translateX(${swipeHint}px)` : undefined,
            transition: swipeHint ? 'none' : 'transform 0.2s ease',
            minHeight: '100%',
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${themeStyles.accent} transparent ${themeStyles.accent} ${themeStyles.accent}` }}
              />
              <p className="text-xs font-bold" style={{ color: themeStyles.muted }}>
                جاري فتح صفحة المصحف…
              </p>
            </div>
          ) : (
            <div className="px-4 pt-5 pb-28 min-h-full flex flex-col">
              {groupedSurahs.map(({ surah, ayahs }) => {
                const isSurahStart = ayahs[0]?.numberInSurah === 1
                return (
                  <div key={surah.number} className="mb-4">
                    {isSurahStart && (
                      <div className="mb-4 text-center">
                        <div
                          className="inline-block w-full max-w-sm mx-auto py-2.5 px-4 rounded-xl border"
                          style={{
                            background: themeStyles.pillBg,
                            borderColor: themeStyles.border,
                          }}
                        >
                          <h2
                            className="mushaf-font text-[18px] font-black tracking-wide"
                            style={{ color: themeStyles.textColor }}
                          >
                            {surah.name}
                          </h2>
                          <p className="text-[10px] font-bold mt-0.5" style={{ color: themeStyles.muted }}>
                            {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • آياتها {toArabicDigits(surah.numberOfAyahs)}
                          </p>
                        </div>
                        {surah.number !== 9 && !tasmeeMode && (
                          <p
                            className="mushaf-font text-[20px] font-bold text-center mt-4 tracking-wider"
                            style={{ color: themeStyles.textColor }}
                          >
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </p>
                        )}
                      </div>
                    )}

                    <div
                      className="mushaf-font leading-[2.75] text-[21px] select-text"
                      style={{
                        textAlign: 'justify',
                        textAlignLast: 'center',
                        direction: 'rtl',
                        wordSpacing: '1px',
                        color: themeStyles.textColor,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ayahs.map((ayah) => {
                        let cleanText = ayah.text
                        if (surah.number !== 1 && ayah.numberInSurah === 1) {
                          cleanText = cleanText.replace(/^﻿?بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '')
                        }
                        const isSelected = selectedAyah?.number === ayah.number
                        const isTasmeeTarget = tasmeeTargetNum === ayah.number && isListening
                        const showAyahText = !tasmeeMode || revealedAyahs.has(ayah.number)
                        const justRevealed =
                          tasmeeMode && revealedAyahs.has(ayah.number) && tasmeeTargetNum === ayah.number && tasmeeStatus === 'correct'
                        const isWrongTarget =
                          tasmeeStatus === 'incorrect' && tasmeeTargetNum === ayah.number
                        let ayahBg = 'transparent'
                        let ayahShadow = 'none'
                        if (justRevealed) {
                          ayahBg = 'rgba(36, 172, 181, 0.28)'
                          ayahShadow = `inset 0 0 0 1.5px ${themeStyles.accent}`
                        } else if (isWrongTarget) {
                          ayahBg = 'rgba(36, 172, 181, 0.18)'
                          ayahShadow = `inset 0 0 0 1.5px ${themeStyles.accentDark}`
                        } else if (isTasmeeTarget || (tasmeeMode && !showAyahText && tasmeeTargetNum === ayah.number)) {
                          ayahBg = 'rgba(36, 172, 181, 0.12)'
                          ayahShadow = `inset 0 0 0 1.5px ${themeStyles.accent}88`
                        } else if (isSelected && !tasmeeMode) {
                          ayahBg = themeStyles.ayahHighlight
                          ayahShadow = `inset 0 0 0 1px ${themeStyles.accent}55`
                        }
                        return (
                          <span
                            key={ayah.number}
                            onClick={() => {
                              playSound('click')
                              if (tasmeeMode || isListening) return
                              setSelectedAyah(isSelected ? null : ayah)
                            }}
                            className={`cursor-pointer transition-all duration-300 rounded-sm px-0.5${
                              isTasmeeTarget ? ' animate-tasmee-listen' : ''
                            }`}
                            style={{
                              backgroundColor: ayahBg,
                              boxShadow: ayahShadow,
                            }}
                          >
                            {showAyahText ? (
                              <span className="transition-opacity duration-500 opacity-100">{cleanText}</span>
                            ) : (
                              <span
                                className="select-none transition-all duration-300"
                                aria-label="آية مخفية للتسميع"
                                style={{
                                  color: themeStyles.textColor,
                                  filter: 'blur(6px)',
                                  opacity: 0.4,
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  letterSpacing: '0.02em',
                                }}
                                onCopy={(e) => e.preventDefault()}
                              >
                                {cleanText}
                              </span>
                            )}
                            <AyahEndMarker number={ayah.numberInSurah} color={themeStyles.markerColor} />
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected ayah dock */}
        {selectedAyah && (
          <div
            className={`sticky mx-3 mb-2 p-3 rounded-2xl shadow-xl border z-30 ${
              isFullscreen ? 'bottom-4' : 'bottom-20'
            }`}
            style={{
              background: themeStyles.chrome,
              borderColor: themeStyles.border,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs" style={{ color: themeStyles.textColor }}>
                {selectedAyah.surah.name} • الآية {toArabicDigits(selectedAyah.numberInSurah)}
              </span>
              <button
                type="button"
                onClick={() => {
                  stopAudio()
                  stopTasmee()
                  setSelectedAyah(null)
                }}
                className="text-xs opacity-50 p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (isPlayingAudio ? stopAudio() : playAyahAudio(selectedAyah.number))}
                className="flex-1 py-2 rounded-xl font-bold text-xs text-white"
                style={{ background: isPlayingAudio ? themeStyles.accentDark : themeStyles.accent }}
              >
                {isPlayingAudio ? 'إيقاف' : 'تلاوة الآية'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopTasmee()
                    return
                  }
                  if (tasmeeStatus === 'incorrect' || tasmeeErrorMsg) {
                    setTasmeeErrorMsg('')
                    setTasmeeStatus('idle')
                    void startPageTasmeeSession()
                    return
                  }
                  void startPageTasmeeSession()
                }}
                className="flex-1 py-2 rounded-xl font-bold text-xs text-white"
                style={{
                  background: isListening ? themeStyles.accentDark : themeStyles.accent,
                }}
              >
                {isListening ? 'إيقاف التسميع' : !canUseTasmee ? 'تسميع PRO' : tasmeeStatus === 'incorrect' ? 'إعادة التسميع' : 'تسميع'}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click')
                  void navigator.clipboard.writeText(
                    `﴿ ${selectedAyah.text} ﴾ [${selectedAyah.surah.name}: ${selectedAyah.numberInSurah}]`
                  )
                }}
                className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
                style={{
                  borderColor: themeStyles.accent,
                  color: themeStyles.accent,
                  background: 'rgba(36, 172, 181, 0.08)',
                }}
              >
                <IconCopyDoc size={12} color={themeStyles.accent} /> نسخ
              </button>
            </div>
          </div>
        )}

        {/* تسميع status banner */}
        {(tasmeeMode || tasmeeStatus !== 'idle' || tasmeeErrorMsg) && (
          <div
            className={`sticky mx-3 mb-1 px-3 py-2 rounded-xl text-center text-[11px] font-bold z-30 shadow-md slide-up ${
              isFullscreen ? 'bottom-4' : 'bottom-[4.5rem]'
            }`}
            style={{
              background: themeStyles.accent,
              color: '#fff',
              boxShadow: `0 8px 20px -4px ${themeStyles.accent}66`,
            }}
          >
            {tasmeeErrorMsg
              ? tasmeeErrorMsg
              : tasmeeStatus === 'requesting'
                ? 'جاري طلب الميكروفون…'
                : tasmeeStatus === 'listening'
                  ? 'الآيات مخفية — اقرأ من حفظك…'
                  : tasmeeStatus === 'correct'
                    ? 'أحسنت — ظهرت الآية ✓ تابع…'
                    : tasmeeStatus === 'complete'
                      ? 'تم تسميع الصفحة بالكامل ✓'
                      : tasmeeStatus === 'incorrect'
                        ? 'هناك خطأ في التسميع'
                        : tasmeeStatus === 'denied'
                          ? 'يلزم السماح بالميكروفون للتسميع'
                          : tasmeeStatus === 'unsupported'
                            ? 'التسميع غير مدعوم على هذا الجهاز'
                            : tasmeeStatus === 'error'
                              ? 'حدث خطأ أثناء التسميع'
                              : null}
          </div>
        )}
      </div>

      {/* Bottom toolbar + تسميع mic FAB — hidden in fullscreen */}
      {!isFullscreen && (
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 relative z-20"
        style={{ background: themeStyles.chrome, borderTop: `1px solid ${themeStyles.border}` }}
      >
        <div className="flex items-center gap-4" style={{ color: themeStyles.icon }}>
          <button type="button" onClick={goPrev} className="text-[11px] font-bold" disabled={currentPage <= 1}>
            السابقة
          </button>
          <button
            type="button"
            onClick={() => {
              playSound('click')
              setShowSurahModal(true)
            }}
            className="inline-flex"
            aria-label="الفهرس"
          >
            <IconQuranBook size={20} color={themeStyles.icon} />
          </button>
          <button type="button" onClick={goNext} className="text-[11px] font-bold" disabled={currentPage >= 604}>
            التالية
          </button>
        </div>

        <button
          type="button"
          onClick={toggleTasmee}
          className={`absolute left-4 -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg${
            isListening ? ' animate-tasmee-pulse' : ''
          }`}
          style={{
            background: canUseTasmee ? (isListening ? themeStyles.accentDark : themeStyles.accent) : '#7E9DA3',
            boxShadow: `0 8px 22px -4px ${canUseTasmee ? themeStyles.accent : '#7E9DA3'}99`,
          }}
          aria-label={canUseTasmee ? 'تسميع' : 'تسميع PRO'}
          title={canUseTasmee ? 'تسميع' : 'يتطلب ربط السبحة'}
        >
          {!canUseTasmee ? (
            <span className="relative flex flex-col items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
                  fill="#fff"
                  opacity="0.85"
                />
                <path
                  d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.9V21a1 1 0 1 0 2 0v-3.1A7 7 0 0 0 19 11z"
                  fill="#fff"
                  opacity="0.85"
                />
              </svg>
              <span
                className="absolute -top-1 -right-3 text-[8px] font-black px-1 rounded"
                style={{ background: '#fff', color: themeStyles.accent }}
              >
                PRO
              </span>
            </span>
          ) : tasmeeStatus === 'correct' || tasmeeStatus === 'complete' ? (
            <span className="text-white text-xl font-black">✓</span>
          ) : tasmeeStatus === 'incorrect' ? (
            <span className="text-white text-xl font-black">✕</span>
          ) : isListening ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
                fill="#fff"
              />
              <path
                d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.9V21a1 1 0 1 0 2 0v-3.1A7 7 0 0 0 19 11z"
                fill="#fff"
              />
            </svg>
          )}
        </button>

        <div className="w-14" />
      </div>
      )}

      {/* Surah Picker Modal */}
      {showSurahModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div
            className="w-full max-h-[85%] rounded-t-3xl p-4 flex flex-col shadow-2xl"
            style={{ background: themeStyles.bg }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: themeStyles.border }}>
              <div className="flex items-center gap-2">
                <IconQuranBook size={20} color={themeStyles.accent} />
                <h3 className="font-black text-sm" style={{ color: themeStyles.textColor }}>
                  فهرس سور القرآن
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSurahModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={{ background: themeStyles.pillBg }}
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="ابحث عن اسم السورة..."
                value={searchSurah}
                onChange={(e) => setSearchSurah(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border"
                style={{
                  background: themeStyles.pillBg,
                  borderColor: themeStyles.border,
                  color: themeStyles.textColor,
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pb-4">
              {SURAH_LIST.filter(
                (s) =>
                  s.name.includes(searchSurah) ||
                  s.nameEn.toLowerCase().includes(searchSurah.toLowerCase())
              ).map((surah) => (
                <button
                  key={surah.number}
                  type="button"
                  onClick={() => {
                    playSound('click')
                    setCurrentPage(surah.page)
                    setShowSurahModal(false)
                    setSelectedAyah(null)
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border text-right"
                  style={{
                    background:
                      currentSurah?.number === surah.number ? themeStyles.pillBg : 'transparent',
                    borderColor: themeStyles.border,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{ background: `${themeStyles.accent}22`, color: themeStyles.accent }}
                    >
                      {toArabicDigits(surah.number)}
                    </span>
                    <div>
                      <p className="font-bold text-xs" style={{ color: themeStyles.textColor }}>
                        سورة {surah.name}
                      </p>
                      <p className="text-[10px]" style={{ color: themeStyles.muted }}>
                        {surah.type} • {toArabicDigits(surah.verses)} آية
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: themeStyles.muted }}>
                    ص {toArabicDigits(surah.page)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* تسميع locked — requires PRO + NFC sebha pairing */}
      {showTasmeeLock && (
        <div
          className="absolute inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowTasmeeLock(false)}
        >
          <div
            className="w-full rounded-t-3xl p-5 pb-8 shadow-2xl slide-up"
            style={{ background: themeStyles.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(36,172,181,0.15)', color: themeStyles.accent }}
              >
                ✦ PRO
              </span>
              <button
                type="button"
                onClick={() => setShowTasmeeLock(false)}
                className="w-8 h-8 rounded-full text-xs"
                style={{ background: themeStyles.pillBg }}
              >
                ✕
              </button>
            </div>
            <h3 className="font-black text-base mb-2" style={{ color: themeStyles.textColor }}>
              التسميع متاح مع سبحة إيلاف
            </h3>
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: themeStyles.muted }}>
              خاصية التسميع من مزايا PRO. المسّ سبحة إيلاف لتفعيلها ثم استخدم الميكروفون للتسميع.
            </p>
            <ul className="text-[11px] space-y-1.5 mb-5" style={{ color: themeStyles.textColor }}>
              <li className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: themeStyles.accent }}
                >
                  1
                </span>
                افتح تبويب السبحة
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: themeStyles.accent }}
                >
                  2
                </span>
                المسّ سبحة إيلاف على ظهر الهاتف
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: themeStyles.accent }}
                >
                  3
                </span>
                بعد الربط يعود التسميع للعمل
              </li>
            </ul>
            <button
              type="button"
              onClick={() => {
                setShowTasmeeLock(false)
                playSound('click')
                setActiveTab('misbaha')
              }}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white"
              style={{
                background: themeStyles.accent,
                boxShadow: `0 8px 20px -4px ${themeStyles.accent}66`,
              }}
            >
              المس سبحة إيلاف الآن
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

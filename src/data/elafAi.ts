/** إيلاف AI — frequent questions + system guidance */

export const ELAF_AI_FAQS: { id: string; question: string; hint?: string }[] = [
  { id: 'wudu', question: 'كيف أتوضأ خطوة بخطوة؟' },
  { id: 'prayer', question: 'ما أركان الصلاة؟' },
  { id: 'fajr', question: 'متى يبدأ وقت صلاة الفجر؟' },
  { id: 'qibla', question: 'كيف أحدد اتجاه القبلة؟' },
  { id: 'ramadan', question: 'ما مفطرات الصيام؟' },
  { id: 'zakat', question: 'على من تجب الزكاة؟' },
  { id: 'hajj', question: 'ما الفرق بين الحج والعمرة؟' },
  { id: 'adhkar', question: 'ما أذكار الصباح والمساء؟' },
  { id: 'quran', question: 'كيف أبدأ حفظ القرآن؟' },
  { id: 'dua', question: 'ما دعاء الهم والحزن؟' },
]

export const ELAF_AI_SYSTEM_PROMPT = `أنت «إيلاف AI» مساعد إسلامي موثوق داخل تطبيق إيلاف.
أجب بالعربية الفصحى الواضحة والمهذبة.
ركز على العبادات والعقيدة والآداب والقرآن والأحاديث الصحيحة بقدر الإمكان.
إذا كان الحكم مختلفاً بين المذاهب، اذكر ذلك باختصار دون تعصب.
لا تختلق أحاديث أو آيات؛ وإن لم تكن متأكداً قل ذلك بوضوح.
لا تقدم فتاوى طبية أو قانونية قاطعة؛ وجّه للاستشارة المختصة عند الحاجة.
اجعل الإجابة مختصرة ومنظمة (نقاط قصيرة إن أمكن).`

export type ElafAiMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

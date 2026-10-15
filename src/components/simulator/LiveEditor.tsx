import React, { useState } from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import type { DailyVerse, PrayerItem } from '../../types/simulator'
import {
  IconQuranBook,
  IconMosque,
  IconPaletteStudio,
  IconLightningBolt,
  IconCopyDoc,
  IconMisbaha,
  IconKaaba,
  IconDuaHands,
  IconLiveBroadcast,
  IconPhoneShake,
  IconAdhanBell,
  PrayerIcon,
} from '../icons/IslamicIcons'

export function LiveEditor() {
  const {
    state,
    updateVerse,
    updatePrayerTime,
    updateBrand,
    updateTheme,
    setActiveTab,
    setIsPro,
    setShowProModal,
    triggerShake,
    triggerNotification,
    resetToDefaults,
    exportConfigJson,
    importConfigJson,
    playSound,
  } = useSimulator()

  const [activeTab, setEditorTab] = useState<'content' | 'prayers' | 'theme' | 'features' | 'export'>('content')
  const [copied, setCopied] = useState(false)
  const [importJsonText, setImportJsonText] = useState('')
  const [importError, setImportError] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)

  if (!state.isLiveEditorOpen) return null

  // Pre-configured color themes
  const colorThemes = [
    { name: 'إيلاف تيل (الافتراضي)', primary: '#24ACB5', accent: '#D4AF37' },
    { name: 'الزمرد الملكي', primary: '#10B981', accent: '#F59E0B' },
    { name: 'الذهب الإسلامي', primary: '#D4AF37', accent: '#24ACB5' },
    { name: 'النيلي الفاخر', primary: '#4F46E5', accent: '#38BDF8' },
    { name: 'الياقوت الهادئ', primary: '#E11D48', accent: '#F472B6' },
  ]

  // Copy JSON handler
  const handleCopy = () => {
    playSound('click')
    navigator.clipboard.writeText(exportConfigJson())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Import JSON handler
  const handleImport = () => {
    setImportError(false)
    setImportSuccess(false)
    if (!importJsonText.trim()) return
    const success = importConfigJson(importJsonText)
    if (success) {
      setImportSuccess(true)
      setTimeout(() => setImportSuccess(false), 3000)
    } else {
      setImportError(true)
      setTimeout(() => setImportError(false), 3000)
    }
  }

  return (
    <aside className="w-[390px] flex-shrink-0 bg-[#0A1B20]/95 backdrop-blur-xl border-r border-[#1E434D] h-full flex flex-col text-white select-none z-40 overflow-hidden shadow-2xl transition-all">
      {/* Studio Header */}
      <div className="p-4 border-b border-[#1E434D] flex items-center justify-between bg-[#0D2227]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#24ACB5]/20 border border-[#24ACB5]/40 flex items-center justify-center text-[#24ACB5]">
            <IconPaletteStudio size={16} color="#24ACB5" />
          </div>
          <div>
            <h2 className="font-bold text-[14px] text-white">استوديو التعديل المباشر</h2>
            <p className="text-[10px] text-white/50">التعديلات تنعكس لحظيًا على شاشة الهاتف</p>
          </div>
        </div>
        <button
          onClick={resetToDefaults}
          title="استعادة الإعدادات الأصلية"
          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all"
        >
          ↺ إعادة تعيين
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E434D] bg-[#0A181C] p-1.5 gap-1">
        {[
          { id: 'content', label: 'المحتوى والآيات', IconComp: IconQuranBook },
          { id: 'prayers', label: 'الصلاة والموقع', IconComp: IconMosque },
          { id: 'theme', label: 'المظهر والألوان', IconComp: IconPaletteStudio },
          { id: 'features', label: 'التجربة والشاشات', IconComp: IconLightningBolt },
          { id: 'export', label: 'تصدير JSON', IconComp: IconCopyDoc },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              playSound('click')
              setEditorTab(t.id as typeof activeTab)
            }}
            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${
              activeTab === t.id
                ? 'bg-[#24ACB5] text-white shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <t.IconComp size={14} />
            <span className="truncate w-full text-center">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[12px]">

        {/* ─── TAB 1: CONTENT ─── */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Branding Section */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ هوية التطبيق (Branding)
              </span>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">اسم التطبيق (بالعربية)</label>
                <input
                  type="text"
                  value={state.appName}
                  onChange={(e) => updateBrand({ appName: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5]"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">الشعار الإنجليزي (Tagline)</label>
                <input
                  type="text"
                  value={state.appTagline}
                  onChange={(e) => updateBrand({ appTagline: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5]"
                />
              </div>
            </div>

            {/* Daily Verse Section */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ آية اليوم اليومية (Daily Verse)
              </span>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">نص الآية الكريمة (عربي)</label>
                <textarea
                  rows={2}
                  value={state.dailyVerse.arabic}
                  onChange={(e) => updateVerse({ arabic: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5] leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">اسم السورة ورقم الآية</label>
                <input
                  type="text"
                  value={state.dailyVerse.surah}
                  onChange={(e) => updateVerse({ surah: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5]"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">الترجمة الإنجليزية (Translation)</label>
                <textarea
                  rows={2}
                  value={state.dailyVerse.translation}
                  onChange={(e) => updateVerse({ translation: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5] text-left ltr"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">النطق بالحروف اللاتينية (Transliteration)</label>
                <input
                  type="text"
                  value={state.dailyVerse.transliteration}
                  onChange={(e) => updateVerse({ transliteration: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5] text-left ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: PRAYERS & LOCATION ─── */}
        {activeTab === 'prayers' && (
          <div className="space-y-4">
            {/* Location & Calculation */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ الموقع وطريقة الحساب
              </span>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">اسم المدينة والدولة</label>
                <input
                  type="text"
                  value={state.cityName}
                  onChange={(e) => updateBrand({ cityName: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5]"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70 block mb-1">طريقة الحساب المعتمدة</label>
                <input
                  type="text"
                  value={state.calculationMethod}
                  onChange={(e) => updateBrand({ calculationMethod: e.target.value })}
                  className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#24ACB5]"
                />
              </div>
            </div>

            {/* Editable Prayer Times */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ أوقات الصلوات الست (تحديث مباشر)
              </span>
              <div className="space-y-2">
                {state.prayers.map((prayer, idx) => (
                  <div key={prayer.id} className="flex items-center justify-between bg-[#0A1B20] p-2 rounded-xl border border-[#1E434D]/60">
                    <div className="flex items-center gap-2">
                      <PrayerIcon id={prayer.id || prayer.name} size={16} color="#24ACB5" />
                      <span className="font-bold text-white/90">{prayer.name}</span>
                    </div>
                    <input
                      type="time"
                      value={prayer.time}
                      onChange={(e) => updatePrayerTime(idx, e.target.value)}
                      className="bg-[#133840] border border-[#24ACB5]/40 rounded-lg px-2 py-1 text-white font-mono text-xs outline-none focus:border-[#24ACB5]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: THEMES & STYLES ─── */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            {/* Color Presets */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ حزم الألوان الجاهزة (Palettes)
              </span>
              <div className="grid grid-cols-1 gap-2">
                {colorThemes.map((pal) => (
                  <button
                    key={pal.name}
                    onClick={() => {
                      playSound('click')
                      updateTheme({
                        primaryColor: pal.primary,
                        accentColor: pal.accent,
                      })
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all ${
                      state.theme.primaryColor === pal.primary
                        ? 'bg-[#24ACB5]/20 border-[#24ACB5] ring-1 ring-[#24ACB5]'
                        : 'bg-[#0A1B20] border-[#1E434D] hover:bg-white/5'
                    }`}
                  >
                    <span className="font-semibold text-white/90">{pal.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: pal.primary }} />
                      <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: pal.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ تخصيص الألوان يدويًا
              </span>
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/80">اللون الرئيسي (Primary):</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white/60">{state.theme.primaryColor}</span>
                  <input
                    type="color"
                    value={state.theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/80">لون التمييز (Accent Gold):</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white/60">{state.theme.accentColor}</span>
                  <input
                    type="color"
                    value={state.theme.accentColor}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>

            {/* Sliders: Radius & Font scaling */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ ضبط التخطيط والخطوط
              </span>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/80">استدارة الحواف (Corner Radius):</span>
                  <span className="font-mono text-[#24ACB5]">{state.theme.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="28"
                  value={state.theme.borderRadius}
                  onChange={(e) => updateTheme({ borderRadius: Number(e.target.value) })}
                  className="w-full accent-[#24ACB5]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/80">حجم الخطوط (Typography Scale):</span>
                  <span className="font-mono text-[#24ACB5]">{Math.round(state.theme.fontScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.2"
                  step="0.05"
                  value={state.theme.fontScale}
                  onChange={(e) => updateTheme({ fontScale: Number(e.target.value) })}
                  className="w-full accent-[#24ACB5]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: FEATURES & NAVIGATION ─── */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            {/* Screen Switcher */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ الانتقال الفوري بين الشاشات
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'home', label: 'الرئيسية', IconComp: IconMosque },
                  { id: 'live', label: 'بث مباشر', IconComp: IconLiveBroadcast },
                  { id: 'misbaha', label: 'السبحة الذكية', IconComp: IconMisbaha },
                  { id: 'prayer', label: 'الصلاة والقبلة', IconComp: IconKaaba },
                  { id: 'quran', label: 'القرآن الكريم', IconComp: IconQuranBook },
                  { id: 'athkar', label: 'الأذكار اليومية', IconComp: IconDuaHands },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id as typeof state.activeTab)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      state.activeTab === s.id
                        ? 'bg-[#24ACB5] text-white border-[#24ACB5]'
                        : 'bg-[#0A1B20] text-white/70 border-[#1E434D] hover:bg-white/5'
                    }`}
                  >
                    <s.IconComp size={14} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Hardware / NFC Simulation */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ محاكاة سبحة إيلاف وتقنية NFC
              </span>
              <button
                onClick={() => setShowProModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#133840] to-[#24ACB5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <IconMisbaha size={15} color="#FFFFFF" />
                <span>محاكاة مسح NFC الذكي</span>
              </button>
              <button
                onClick={triggerShake}
                className="w-full py-2 px-3 rounded-xl bg-[#0A1B20] border border-[#1E434D] text-white/80 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <IconPhoneShake size={14} />
                <span>محاكاة هز الهاتف (Shake)</span>
              </button>
              <button
                onClick={() =>
                  triggerNotification({
                    title: 'تذكير: قيام الليل',
                    body: 'أفضل الصلاة بعد الفريضة صلاة الليل',
                  })
                }
                className="w-full py-2 px-3 rounded-xl bg-[#0A1B20] border border-[#1E434D] text-white/80 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <IconAdhanBell size={14} />
                <span>إشعار إسلامي مخصص</span>
              </button>
            </div>

            {/* Pro Mode Switch */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-xs">وضعية باقة PRO مدى الحياة</p>
                <p className="text-[10px] text-white/50">تفتح جميع القراء الحصريين وميزات التحليلات</p>
              </div>
              <button
                onClick={() => setIsPro(!state.isPro)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  state.isPro
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#0A1B20] border border-[#1E434D] text-white/60'
                }`}
              >
                {state.isPro ? '✦ مفعّلة' : 'غير مفعّلة'}
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 5: JSON EXPORT & IMPORT ─── */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider">
                  ✦ معاينة التعديلات بصيغة JSON
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-[#24ACB5] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                  {copied ? '✓ تم النسخ!' : '📋 نسخ الكود'}
                </button>
              </div>
              <pre className="w-full h-44 bg-[#0A1B20] p-3 rounded-xl border border-[#1E434D] font-mono text-[10px] text-emerald-400 overflow-auto text-left ltr">
                {exportConfigJson()}
              </pre>
            </div>

            {/* Import JSON */}
            <div className="bg-[#132B32]/70 p-3.5 rounded-2xl border border-[#1E434D] space-y-3">
              <span className="font-bold text-[#24ACB5] text-[11px] uppercase tracking-wider block">
                ✦ استيراد وتطبيق تعديلات JSON
              </span>
              <textarea
                rows={3}
                placeholder="ألصق كود JSON هنا لتطبيق التعديلات فورًا..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full bg-[#0A1B20] border border-[#1E434D] rounded-xl px-3 py-2 text-white font-mono text-[10px] outline-none focus:border-[#24ACB5] text-left ltr"
              />
              <button
                onClick={handleImport}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all active:scale-95"
              >
                تطبيق التعديلات الآن
              </button>
              {importSuccess && <p className="text-[11px] text-emerald-400 text-center font-bold">✓ تم استيراد التعديلات وتطبيقها بنجاح!</p>}
              {importError && <p className="text-[11px] text-rose-400 text-center font-bold">✕ صيغة JSON غير صحيحة، يرجى التحقق من الكود.</p>}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

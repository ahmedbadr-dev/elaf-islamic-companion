import fs from 'fs'

const path = 'src/App.tsx'
let s = fs.readFileSync(path, 'utf8')

s = s.replace(
  '<span style={{ fontSize: 14 }}>{p.icon}</span>',
  '<PrayerIcon id={p.id || p.name} size={16} color="#24ACB5" />',
)

s = s.replace(
  `{[{ k: 'morning' as const, label: 'أذكار الصباح', icon: '🌤️' }, { k: 'evening' as const, label: 'أذكار المساء', icon: '🌙' }]
            .map(({ k, label, icon }) => (`,
  `{[{ k: 'morning' as const, label: 'أذكار الصباح' }, { k: 'evening' as const, label: 'أذكار المساء' }]
            .map(({ k, label }) => (`,
)

s = s.replace(
  `<span style={{ fontSize: 14 }}>{icon}</span>
                <span className="text-[10px] font-semibold" style={{ color: athkarDone[k] ? '#24ACB5' : '#3A5C64' }}>{label}</span>`,
  `<span style={{ color: '#24ACB5' }}>{k === 'morning' ? <IconSunToggle size={14} color="#24ACB5" /> : <IconMoonToggle size={14} color="#24ACB5" />}</span>
                <span className="text-[10px] font-semibold" style={{ color: athkarDone[k] ? '#24ACB5' : '#3A5C64' }}>{label}</span>`,
)

s = s.replace(
  `{voiceOn ? '🔊 صوت مفعّل' : '🔇 صوت متوقف'}`,
  `{voiceOn ? <span className="inline-flex items-center gap-1"><IconSpeakerSound size={12} /> صوت مفعّل</span> : <span className="inline-flex items-center gap-1"><IconSpeakerMute size={12} /> صوت متوقف</span>}`,
)

s = s.replace(
  `{voiceOn ? '🔊' : '🔇'}`,
  `{voiceOn ? <IconSpeakerSound size={14} /> : <IconSpeakerMute size={14} />}`,
)

s = s.replace(
  `<span style={{ fontSize: 18 }}>📍</span>`,
  `<IconLocationPin size={18} color="#fff" />`,
)

s = s.replace(
  `{[{ id: 'times' as const, label: 'أوقات الصلاة' }, { id: 'qibla' as const, label: '🧭 اتجاه القبلة' }].map(({ id, label }) => (
          <button key={id} onClick={() => setView(id)}
            className="flex-1 py-2 rounded-full text-[12px] font-bold transition-all"
            style={{
              background: view === id ? state.theme.primaryColor : 'transparent',
              color: view === id ? '#fff' : '#3A5C64',
            }}>
            {label}
          </button>
        ))}`,
  `{[{ id: 'times' as const, label: 'أوقات الصلاة', Icon: IconAdhanBell }, { id: 'qibla' as const, label: 'اتجاه القبلة', Icon: IconCompassRose }].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className="flex-1 py-2 rounded-full text-[12px] font-bold transition-all inline-flex items-center justify-center gap-1.5"
            style={{
              background: view === id ? state.theme.primaryColor : 'transparent',
              color: view === id ? '#fff' : '#3A5C64',
            }}>
            <Icon size={14} color={view === id ? '#fff' : '#3A5C64'} />
            {label}
          </button>
        ))}`,
)

s = s.replace(
  `<span style={{ fontSize: 20, marginLeft: 12 }}>{p.icon}</span>`,
  `<span style={{ marginLeft: 12, display: 'inline-flex', color: '#24ACB5' }}><PrayerIcon id={p.id || p.name} size={20} color="#24ACB5" /></span>`,
)

s = s.replace(`<span style={{ fontSize: 18 }}>🕋</span>`, `<IconKaaba size={20} color="#24ACB5" />`)

s = s.replace(
  `<span>📖</span>
            <span>المصحف الشريف</span>`,
  `<IconQuranBook size={14} />
            <span>المصحف الشريف</span>`,
)

s = s.replace(
  `<span>📑</span>
            <span>قائمة السور</span>`,
  `<IconListSurah size={14} />
            <span>قائمة السور</span>`,
)

s = s.replace(
  `<span>🎙️</span>
            <span>القراء</span>`,
  `<IconMicrophoneReciter size={14} />
            <span>القراء</span>`,
)

s = s.replace(`📖 التفسير`, `<><IconQuranBook size={12} /> التفسير</>`)
s = s.replace(`🔊 استماع`, `<><IconSpeakerSound size={12} /> استماع</>`)
s = s.replace(`<span style={{ fontSize: 26 }}>📖</span>`, `<IconQuranBook size={26} color="#24ACB5" />`)
s = s.replace(
  `<span style={{ color: '#fff', fontSize: 18 }}>🎙️</span>`,
  `<IconMicrophoneReciter size={18} color="#fff" />`,
)

s = s.replace(
  `{ id: 'morning', label: 'الصباح', icon: '🌤️' },
    { id: 'evening', label: 'المساء', icon: '🌙' },
    { id: 'post-prayer', label: 'بعد الصلاة', icon: '🤲' },
    { id: 'sleep', label: 'النوم', icon: '😴' },`,
  `{ id: 'morning', label: 'الصباح', Icon: IconSunToggle },
    { id: 'evening', label: 'المساء', Icon: IconMoonToggle },
    { id: 'post-prayer', label: 'بعد الصلاة', Icon: IconDuaHands },
    { id: 'sleep', label: 'النوم', Icon: IconSleep },`,
)

// Athkar category render: {c.icon} -> <c.Icon />
s = s.replace(
  `<span style={{ fontSize: 16 }}>{c.icon}</span>`,
  `<span style={{ color: cat === c.id ? '#fff' : '#24ACB5' }}><c.Icon size={16} color={cat === c.id ? '#fff' : '#24ACB5'} /></span>`,
)

s = s.replace(
  `                  🔊
                </button>`,
  `                  <IconSpeakerSound size={14} color="#24ACB5" />
                </button>`,
)

s = s.replace(
  `✨ أحسنت! اكتمل الذكر`,
  `<><IconSparkle size={12} color="#2BB673" /> أحسنت! اكتمل الذكر</>`,
)

s = s.replace(
  `<div className="text-6xl mb-4">✨</div>`,
  `<div className="mb-4 flex justify-center"><IconSparkle size={56} color="#D4AF37" /></div>`,
)

s = s.replace(
  `{['D', 'A', 'AF', '🌙', 'E', 'L'].map((c, i) => (
                <span key={i} className="text-xl" style={{
                  animation: \`confetti-fall 0.8s \${i * 0.1}s ease-out forwards\`,
                  display: 'inline-block',
                }}>
                  {['🌟', '✨', '🌙', '⭐', '💫', '🌟'][i]}
                </span>
              ))}`,
  `{[0,1,2,3,4,5].map((i) => (
                <span key={i} className="inline-flex" style={{
                  animation: \`confetti-fall 0.8s \${i * 0.1}s ease-out forwards\`,
                  color: '#D4AF37',
                }}>
                  <IconSparkle size={18} color="#D4AF37" />
                </span>
              ))}`,
)

s = s.replace(
  `{['🎙️ تسجيلات نادرة لكبار القراء', '🎨 ثيمات حصرية للتطبيق', '📊 تحليلات روحانية أسبوعية وشهرية', '📿 بناء وردك اليومي المخصص'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span style={{ color: '#24ACB5' }}>✓</span>
                  <p className="text-[12px]" style={{ color: '#3A5C64' }}>{f}</p>
                </div>
              ))}`,
  `{[
                { t: 'تسجيلات نادرة لكبار القراء', Icon: IconMicrophoneReciter },
                { t: 'ثيمات حصرية للتطبيق', Icon: IconPaletteStudio },
                { t: 'تحليلات روحانية أسبوعية وشهرية', Icon: IconSparkle },
                { t: 'بناء وردك اليومي المخصص', Icon: IconMisbaha },
              ].map(({ t, Icon }) => (
                <div key={t} className="flex items-center gap-2">
                  <Icon size={14} color="#24ACB5" />
                  <p className="text-[12px]" style={{ color: '#3A5C64' }}>{t}</p>
                </div>
              ))}`,
)

fs.writeFileSync(path, s)
console.log('App.tsx icons updated')

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  listUserLocationsForAdmin,
  type UserLocationPin,
} from '../../services/UserLocationService'

function cityStats(pins: UserLocationPin[]) {
  const map = new Map<string, number>()
  for (const p of pins) {
    const key = p.cityLabel || 'غير معروف'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function MapPanel({ pins }: { pins: UserLocationPin[] }) {
  const valid = pins.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))

  const bounds = useMemo(() => {
    if (!valid.length) return null
    const lats = valid.map((p) => p.latitude)
    const lngs = valid.map((p) => p.longitude)
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    }
  }, [valid])

  if (!valid.length) {
    return (
      <div className="rounded-2xl border border-teal-100 bg-white p-8 text-center text-sm text-slate-500">
        لا توجد مواقع بعد — عندما يوافق المستخدمون على مشاركة الموقع ستظهر هنا.
      </div>
    )
  }

  const pad = 0.08
  const minLat = (bounds?.minLat ?? 0) - pad
  const maxLat = (bounds?.maxLat ?? 0) + pad
  const minLng = (bounds?.minLng ?? 0) - pad
  const maxLng = (bounds?.maxLng ?? 0) + pad
  const latSpan = Math.max(0.01, maxLat - minLat)
  const lngSpan = Math.max(0.01, maxLng - minLng)

  return (
    <div className="relative h-[420px] overflow-hidden rounded-2xl border border-teal-100 bg-[#E8F4F2]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(#c5ddd8 1px, transparent 1px), linear-gradient(90deg, #c5ddd8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {valid.map((p) => {
        const left = ((p.longitude - minLng) / lngSpan) * 100
        const top = ((maxLat - p.latitude) / latSpan) * 100
        return (
          <a
            key={p.userId}
            href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=14/${p.latitude}/${p.longitude}`}
            target="_blank"
            rel="noreferrer"
            title={`${p.cityLabel || 'موقع'} — ${p.name || p.email || p.userId}`}
            className="absolute z-[1] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="block h-3.5 w-3.5 rounded-full bg-[#24ACB5] ring-4 ring-[#24ACB5]/35 shadow-md" />
          </a>
        )
      })}
      <p className="absolute bottom-3 left-3 z-[2] rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600">
        اضغط النقطة لفتح الخريطة · {valid.length} موقع
      </p>
    </div>
  )
}

export function LocationsDashboard() {
  const [pins, setPins] = useState<UserLocationPin[]>([])
  const [loadingPins, setLoadingPins] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cities = useMemo(() => cityStats(pins), [pins])

  const refresh = useCallback(async () => {
    setLoadingPins(true)
    setError(null)
    try {
      const list = await listUserLocationsForAdmin()
      setPins(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setPins([])
    } finally {
      setLoadingPins(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 30_000)
    return () => window.clearInterval(id)
  }, [refresh])

  return (
    <div className="min-h-screen bg-[#F4F8F9] text-slate-800" dir="rtl">
      <header className="border-b border-teal-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-[#24ACB5]">إيلاف · لوحة المواقع</p>
            <h1 className="text-xl font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>
              مواقع المستخدمين — المساجد القريبة
            </h1>
            <p className="mt-0.5 text-[12px] text-slate-500">
              بدون تسجيل دخول حالياً · حماية الدخول لاحقاً · بيانات بموافقة المستخدم فقط
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loadingPins}
              className="rounded-full bg-[#24ACB5] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-60"
            >
              {loadingPins ? 'جاري التحديث…' : 'تحديث'}
            </button>
            <a
              href="/"
              className="rounded-full border border-teal-100 px-3 py-1.5 text-[12px] font-bold text-[#24ACB5]"
            >
              التطبيق
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-teal-100 bg-white p-4">
            <p className="text-[11px] text-slate-500">مواقع نشطة</p>
            <p className="text-2xl font-black text-[#133840]">{pins.length}</p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-white p-4">
            <p className="text-[11px] text-slate-500">مدن</p>
            <p className="text-2xl font-black text-[#133840]">{cities.length}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-teal-100 bg-white p-4 text-[12px] text-slate-500">
            يُحدَّث تلقائياً كل ٣٠ ثانية. حماية الدخول بالبريد ستُضاف لاحقاً.
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
            {error}
          </p>
        ) : null}

        <MapPanel pins={pins} />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-teal-100 bg-white p-4 md:col-span-1">
            <h2 className="mb-3 text-sm font-black">حسب المدينة</h2>
            <ul className="space-y-2 text-[13px]">
              {cities.map(([city, count]) => (
                <li key={city} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                  <span className="truncate text-slate-700">{city}</span>
                  <span className="font-bold text-[#24ACB5]">{count}</span>
                </li>
              ))}
              {!cities.length ? <li className="text-slate-400">—</li> : null}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-teal-100 bg-white md:col-span-2">
            <div className="border-b border-teal-50 px-4 py-3 text-sm font-black">سجل المواقع</div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-right text-[12px]">
                <thead className="sticky top-0 bg-[#F8FCFD] text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-bold">المدينة</th>
                    <th className="px-3 py-2 font-bold">المستخدم</th>
                    <th className="px-3 py-2 font-bold">الإحداثيات</th>
                    <th className="px-3 py-2 font-bold">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {pins.map((p) => (
                    <tr key={p.userId} className="border-t border-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-800">{p.cityLabel || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">
                        <div>{p.name || '—'}</div>
                        <div className="text-[10px] text-slate-400">{p.email || p.userId.slice(0, 8)}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500" dir="ltr">
                        {p.latitude.toFixed(2)}, {p.longitude.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-slate-500" dir="ltr">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleString('ar-SA') : '—'}
                      </td>
                    </tr>
                  ))}
                  {!pins.length && !loadingPins ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                        لا بيانات بعد
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

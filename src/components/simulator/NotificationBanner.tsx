import React from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import { IconMosque } from '../icons/IslamicIcons'

export function NotificationBanner() {
  const { state, dismissNotification } = useSimulator()

  if (state.notifications.length === 0) return null

  const notif = state.notifications[0]

  return (
    <div className="absolute top-3 left-4 right-4 z-[99] pointer-events-auto slide-down-banner">
      <div
        className="backdrop-blur-xl bg-black/85 text-white p-3.5 rounded-2xl shadow-2xl border border-white/15 flex items-start gap-3 cursor-pointer select-none transition-all hover:scale-[1.01]"
        onClick={() => dismissNotification(notif.id)}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#24ACB5] to-[#133840] flex items-center justify-center flex-shrink-0 shadow-md">
          <IconMosque size={20} color="#FFFFFF" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#5ce6ee]">إيلاف • Elaf</span>
            <span className="text-[10px] text-white/50">{notif.time}</span>
          </div>
          <p className="text-[13px] font-bold text-white mt-0.5 leading-snug truncate">{notif.title}</p>
          <p className="text-[11px] text-white/70 leading-normal line-clamp-2 mt-0.5">{notif.body}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismissNotification(notif.id)
          }}
          className="text-white/40 hover:text-white text-xs p-1"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

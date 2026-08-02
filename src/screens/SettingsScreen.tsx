import { useState } from 'react'
import { BackIcon, FireIcon } from '../components/icons'

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [ageRange, setAgeRange] = useState([22, 35])
  const [distance, setDistance] = useState(25)
  const [notifications, setNotifications] = useState(true)
  const [showMe, setShowMe] = useState(true)

  const sections = [
    {
      title: 'Cuenta',
      items: [
        { label: 'Número de teléfono', value: '+52 55 1234 5678', icon: '📱' },
        { label: 'Email', value: 'ale@email.com', icon: '✉️' },
        { label: 'Conectar con Instagram', value: 'Conectar', icon: '📸', action: true },
      ],
    },
    {
      title: 'Seguridad',
      items: [
        { label: 'Verificación de perfil', value: '✅ Verificado', icon: '🛡️' },
        { label: 'Bloquear contactos', value: '0 bloqueados', icon: '🚫' },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0d0d0f' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full glass flex items-center justify-center">
          <BackIcon size={18} className="text-white/70" />
        </button>
        <h1 className="text-white font-extrabold text-xl tracking-tight">Configuración</h1>
      </div>

      <div className="px-5 space-y-5 pb-28">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Preferencias de búsqueda</p>

          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-white/80">Rango de edad</span>
              <span className="text-sm font-semibold gradient-brand-text">{ageRange[0]}–{ageRange[1]}</span>
            </div>
            <input type="range" min={18} max={60} value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], +e.target.value])} className="w-full accent-[#ff3e6c]" />
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-white/80">Distancia máxima</span>
              <span className="text-sm font-semibold gradient-brand-text">{distance} km</span>
            </div>
            <input type="range" min={1} max={100} value={distance} onChange={(e) => setDistance(+e.target.value)} className="w-full accent-[#ff3e6c]" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white/80">Mostrar mi perfil</p>
              <p className="text-xs text-white/35 mt-0.5">Aparece en los resultados de búsqueda</p>
            </div>
            <button onClick={() => setShowMe((p) => !p)} className="w-12 h-6 rounded-full transition-all relative" style={{ background: showMe ? 'linear-gradient(135deg,#ff3e6c,#ff7043)' : 'rgba(255,255,255,0.12)' }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: showMe ? '26px' : '2px' }} />
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white/80">Notificaciones</p>
              <p className="text-xs text-white/35 mt-0.5">Matches, mensajes, etc.</p>
            </div>
            <button onClick={() => setNotifications((p) => !p)} className="w-12 h-6 rounded-full transition-all relative" style={{ background: notifications ? 'linear-gradient(135deg,#ff3e6c,#ff7043)' : 'rgba(255,255,255,0.12)' }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: notifications ? '26px' : '2px' }} />
            </button>
          </div>
        </div>

        {sections.map((sec) => (
          <div key={sec.title} className="glass rounded-2xl overflow-hidden">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest px-5 pt-4 pb-2">{sec.title}</p>
            {sec.items.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/80">{item.label}</p>
                    <p className={`text-xs mt-0.5 font-medium ${item.action ? 'gradient-brand-text' : 'text-white/35'}`}>{item.value}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
                {i < sec.items.length - 1 && <div className="mx-5" style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />}
              </div>
            ))}
          </div>
        ))}

        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,62,108,0.2), rgba(255,112,67,0.2))', border: '1px solid rgba(255,62,108,0.2)' }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FireIcon size={18} className="text-[#f304eb]" />
              <span className="font-bold text-white">swiper Gold</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,62,108,0.3)', color: '#ff6b8a' }}>PRO</span>
            </div>
            <p className="text-white/50 text-xs mb-4">Likes ilimitados, ver quién te dio like y más</p>
            <button className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)' }}>
              Actualizar a Gold — $199/mes
            </button>
          </div>
        </div>

        <button className="w-full py-4 rounded-xl font-bold text-[#f304eb] text-sm glass">Cerrar sesión</button>
      </div>
    </div>
  )
}

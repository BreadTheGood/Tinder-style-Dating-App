import { useState } from 'react'
import { XIcon, HeartIcon } from './icons'

const THEMES = [
  { id: 'original', name: 'Original (Fucsia a Naranja)', bg: 'linear-gradient(135deg, #f304eb 0%, #ff7043 100%)' },
  { id: 'warm-blue', name: 'Atardecer (Rosa a Azul)', bg: 'linear-gradient(135deg, #ff007f 0%, #d407f3 25%, #9d00ff 50%, #4d00ff 75%, #00d4ff 100%)' },
  { id: 'warm-fuchsia', name: 'Fucsia Profundo (Actual)', bg: 'linear-gradient(135deg, #ff2a85 0%, #ff00aa 20%, #f304eb 40%, #cc00b8 60%, #990088 80%, #5e0053 100%)' },
  { id: 'neon-night', name: 'Cyberpunk (Cian a Magenta)', bg: 'linear-gradient(135deg, #00ffff 0%, #0055ff 40%, #8a2be2 70%, #ff00ff 100%)' },
  { id: 'acid-party', name: 'Fiesta Ácida (Lima a Celeste)', bg: 'linear-gradient(135deg, #ccff00 0%, #00ff87 40%, #00b8ff 100%)' },
  { id: 'ultraviolet-fire', name: 'Ultravioleta (Fuego a Púrpura)', bg: 'linear-gradient(135deg, #ff3300 0%, #ff0066 40%, #9900ff 80%, #4a00e0 100%)' }
]

export function ThemeModal({ onClose }: { onClose: () => void }) {
  const [activeTheme, setActiveTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'warm-fuchsia')

  const applyTheme = (id: string) => {
    setActiveTheme(id)
    if (id === 'original') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', id)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#1a1a1f] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-extrabold tracking-tight text-xl">Estilos</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
            <XIcon size={16} className="text-white/60" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">Vista Previa</p>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
            {/* Login Preview */}
            <div className="min-w-[140px] h-[220px] bg-[#0d0d0f] rounded-2xl border border-white/10 p-3 flex flex-col justify-end snap-center relative overflow-hidden">
               <div className="absolute top-1/3 inset-x-4 h-10 bg-white/5 rounded-lg border border-white/5" />
               <div className="absolute top-1/2 inset-x-4 h-10 bg-white/5 rounded-lg border border-white/5" />
               <div className="w-full h-8 rounded-lg mt-auto gradient-brand" />
               <div className="absolute top-3 left-3 text-[10px] font-bold text-white/40">Login</div>
            </div>

            {/* Swipe Preview */}
            <div className="min-w-[140px] h-[220px] bg-[#0d0d0f] rounded-2xl border border-white/10 p-3 flex flex-col items-center justify-end snap-center relative overflow-hidden">
               <div className="w-full h-32 bg-white/5 rounded-xl mb-3 border border-white/5" />
               <div className="flex gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><XIcon size={12} className="text-white/40" /></div>
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center"><HeartIcon filled size={16} className="text-white" /></div>
               </div>
               <div className="absolute top-3 left-3 text-[10px] font-bold text-white/40">Swipe</div>
            </div>

            {/* Match/Loading Preview */}
            <div className="min-w-[140px] h-[220px] bg-[#0d0d0f] rounded-2xl border border-white/10 p-3 flex flex-col items-center justify-center snap-center relative overflow-hidden">
               <div className="w-16 h-16 rounded-full gradient-brand opacity-80" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-20 h-20 rounded-full border border-white/20" />
               </div>
               <div className="absolute top-3 left-3 text-[10px] font-bold text-white/40">Carga</div>
            </div>
          </div>

          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4 mt-2">Colores</p>
          <div className="flex items-center justify-center gap-4 flex-wrap px-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${activeTheme === t.id ? 'ring-2 ring-white scale-110 shadow-xl' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                style={{ background: t.bg }}
                title={t.name}
              />
            ))}
          </div>
          <p className="text-center text-white/60 text-xs font-medium mt-4">
            {THEMES.find(t => t.id === activeTheme)?.name}
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { XIcon, HeartIcon } from './icons'

const THEMES = [
  { id: 'original', name: 'Original', bg: 'linear-gradient(135deg, #f304eb 0%, #ff7043 100%)' },
  { id: 'warm-blue', name: 'Azul Profundo', bg: 'linear-gradient(135deg, #00d4ff 0%, #0088ff 20%, #0055ff 40%, #0033cc 60%, #001188 80%, #000044 100%)' },
  { id: 'warm-fuchsia', name: 'Fucsia Profundo', bg: 'linear-gradient(135deg, #ff2a85 0%, #ff00aa 20%, #f304eb 40%, #cc00b8 60%, #990088 80%, #5e0053 100%)' },
  { id: 'neon-night', name: 'Cian Profundo', bg: 'linear-gradient(135deg, #aaffff 0%, #00ffff 20%, #00cccc 40%, #008888 60%, #004444 80%, #001111 100%)' },
  { id: 'acid-party', name: 'Lima Profunda', bg: 'linear-gradient(135deg, #ccff00 0%, #99e600 20%, #66cc00 40%, #339900 60%, #116600 80%, #003300 100%)' },
  { id: 'ultraviolet-fire', name: 'Violeta Profundo', bg: 'linear-gradient(135deg, #d400ff 0%, #aa00ff 20%, #8800ff 40%, #5500cc 60%, #330088 80%, #110033 100%)' }
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
            <div className="min-w-[140px] h-[220px] bg-[#0d0d0f] rounded-2xl border border-white/10 p-3 flex flex-col items-center justify-center snap-center relative overflow-hidden">
               <div className="absolute top-[-10%] left-[-10%] w-[80px] h-[80px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, var(--theme-color-1) 0%, transparent 70%)' }} />
               <div className="absolute bottom-[20%] right-[-10%] w-[60px] h-[60px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, var(--theme-color-2) 0%, transparent 70%)' }} />
               
               <div className="mb-2 text-center relative z-10">
                 <div className="font-extrabold tracking-widest text-[11px] gradient-brand-text mb-0.5">G I R A</div>
                 <div className="text-[5px] text-white/40 font-medium tracking-wide">Girá. Matcheá. Conectá.</div>
               </div>

               <div className="w-full space-y-1.5 mt-2 relative z-10">
                 <div className="w-full h-6 bg-white/5 border border-white/10 rounded px-2 flex items-center">
                   <div className="w-8 h-1 bg-white/20 rounded-full" />
                 </div>
                 <div className="w-full h-6 gradient-brand rounded flex items-center justify-center">
                   <div className="w-12 h-1.5 bg-white/80 rounded-full" />
                 </div>
                 <div className="w-full h-6 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                   <div className="w-16 h-1 bg-white/40 rounded-full" />
                 </div>
               </div>

               <div className="absolute top-2 left-2 text-[8px] font-bold text-white/30 uppercase">Login</div>
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

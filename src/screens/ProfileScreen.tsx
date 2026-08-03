import { SettingsIcon } from '../components/icons'
import type { UserProfile } from '../types'
import { supabase } from '../lib/supabase'

export function ProfileScreen({ user, onEdit }: { user: UserProfile; onEdit: () => void }) {
  const me = user

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0d0d0f' }}>
      <div className="relative h-80 flex-shrink-0">
        <img src={me.images?.[0] || 'https://via.placeholder.com/600x700?text=Sin+Foto'} alt={me.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d0d0f 0%, transparent 60%)' }} />
        <div className="absolute bottom-4 left-5">
          <h2 className="text-white font-extrabold text-3xl tracking-tight">{me.name}, {me.age}</h2>
          <p className="text-white/60 text-sm font-medium">{me.job}</p>
        </div>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        {(me.stats || []).map((s) => (
          <div key={s.label} className="glass rounded-2xl py-4 text-center">
            <div className="gradient-brand-text font-extrabold text-2xl">{s.value}</div>
            <div className="text-white/40 text-xs font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 glass rounded-2xl p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Sobre mí</p>
        <p className="text-white/80 text-sm leading-relaxed">{me.bio}</p>
      </div>

      <div className="mx-5 mt-4 glass rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Intereses</p>
        <div className="flex flex-wrap gap-2">
          {(me.tags || []).map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,62,108,0.15)', color: '#ff6b8a', border: '1px solid rgba(255,62,108,0.2)' }}>
              {t}
            </span>
          ))}
          <button className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/40" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }}>
            + Agregar
          </button>
        </div>
      </div>

      <div className="mx-5 mb-28">
        <button onClick={onEdit} className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all active:scale-95 glass border border-white/10">Editar perfil</button>
        <button onClick={() => supabase.auth.signOut()} className="w-full mt-3 py-4 rounded-xl font-bold text-red-500 text-sm transition-all active:scale-95 bg-white/5 border border-red-500/20 hover:bg-red-500/10">Cerrar sesión</button>
      </div>
    </div>
  )
}

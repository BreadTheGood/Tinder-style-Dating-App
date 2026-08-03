import { useState, useEffect } from 'react'
import type { UserProfile } from '../types'
import { supabase } from '../lib/supabase'
import { supabaseAppDataService } from '../services/supabaseAppDataService'

export function ProfileScreen({ user, onEdit }: { user: UserProfile; onEdit: () => void }) {
  const me = user
  const [events, setEvents] = useState<any[]>([])
  const [ticketCode, setTicketCode] = useState('')
  const [joining, setJoining] = useState(false)

  const fetchEvents = async () => {
     if (supabaseAppDataService.getMyEvents) {
        const evts = await supabaseAppDataService.getMyEvents()
        setEvents(evts)
     }
  }

  useEffect(() => {
     fetchEvents()
  }, [])

  const handleJoin = async () => {
     if (!ticketCode.trim() || joining) return
     setJoining(true)
     if (supabaseAppDataService.joinEvent) {
        const res = await supabaseAppDataService.joinEvent(ticketCode.trim().toUpperCase())
        if (res.success) {
           setTicketCode('')
           fetchEvents()
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: '¡Te has unido al evento con éxito!' } }))
        } else {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: res.error || 'Error al unirse al evento' } }))
        }
     }
     setJoining(false)
  }

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

      <div className="mx-5 mt-4 glass rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Mis Eventos</p>
        
        <div className="flex flex-col gap-2 mb-4">
           {events.length === 0 ? (
             <p className="text-white/40 text-sm">No estás en ningún evento actualmente.</p>
           ) : (
             events.map(e => (
               <div key={e.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{e.name || 'Evento'}</p>
                    <p className="text-[#f304eb] text-xs font-medium">#{e.code}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
               </div>
             ))
           )}
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={ticketCode} 
            onChange={e => setTicketCode(e.target.value)} 
            placeholder="Ingresar código de ticket..." 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f304eb] uppercase placeholder:normal-case placeholder:text-white/30" 
          />
          <button 
            onClick={handleJoin} 
            disabled={joining}
            className="bg-gradient-to-r from-[#f304eb] to-[#ff7043] px-5 py-3 rounded-xl font-bold text-white shadow-lg text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            Unirse
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

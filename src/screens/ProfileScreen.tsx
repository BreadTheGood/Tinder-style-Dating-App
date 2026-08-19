import { useState, useEffect } from 'react'
import type { UserProfile } from '../types'
import { supabase } from '../lib/supabase'
import { supabaseAppDataService } from '../services/supabaseAppDataService'
import { ThemeModal } from '../components/ThemeModal'

export function ProfileScreen({ user, onEdit }: { user: UserProfile; onEdit: () => void }) {
  const me = user
  const [events, setEvents] = useState<any[]>([])
  const [ticketCode, setTicketCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [showThemeModal, setShowThemeModal] = useState(false)

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
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Ã‰xito', body: 'Â¡Te has unido al evento con Ã©xito!' } }))
           window.dispatchEvent(new CustomEvent('app-reload-data'))
        } else {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: res.error || 'Error al unirse al evento' } }))
        }
     }
     setJoining(false)
  }

  const [showHistory, setShowHistory] = useState(false)

  const getTimeRemaining = (endDatetime?: string) => {
    if (!endDatetime) return null
    const diffMs = new Date(endDatetime).getTime() - Date.now()
    if (diffMs <= 0) return 'Finalizado'

    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `Quedan ${days}d ${hours % 24}h`
    }
    if (hours > 0) {
      return `Finaliza en ${hours}h ${minutes}m`
    }
    return `Finaliza en ${minutes}m`
  }

  const activeEvents = events.filter(e => {
     if (e.status === 'suspendido' || e.status === 'finalizado') return false
     if (!e.end_datetime) return true
     return new Date(e.end_datetime).getTime() > Date.now()
  })

  const pastEvents = events.filter(e => {
     if (e.status === 'suspendido') return true
     if (e.status === 'finalizado') return true
     if (!e.end_datetime) return false
     return new Date(e.end_datetime).getTime() <= Date.now()
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0d0d0f' }}>
      <div className="relative h-80 flex-shrink-0">
        <img src={me.images?.[imgIdx] || 'https://placehold.co/600x700?text=Sin+Foto'} alt={me.name} className="w-full h-full object-cover" />
        
        {me.images && me.images.length > 1 && (
          <div className="absolute top-4 inset-x-4 flex gap-1.5 z-30">
            {me.images.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                 <div className="h-full w-full rounded-full transition-all duration-300" style={{ background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: i === imgIdx ? '0 0 4px rgba(255,255,255,0.8)' : 'none' }} />
              </div>
            ))}
          </div>
        )}

        {me.images && me.images.length > 1 && (
          <>
            <div 
              className="absolute top-0 bottom-0 left-0 w-1/2 z-20"
              onClick={() => setImgIdx(prev => Math.max(0, prev - 1))}
            />
            <div 
              className="absolute top-0 bottom-0 right-0 w-1/2 z-20"
              onClick={() => setImgIdx(prev => Math.min(me.images!.length - 1, prev + 1))}
            />
          </>
        )}

        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, #0d0d0f 0%, transparent 60%)' }} />
        <div className="absolute bottom-4 left-5">
          <h2 className="text-white font-extrabold text-3xl tracking-tight">{me.name}, {me.age}</h2>
          <p className="text-white/60 text-sm font-medium">{me.job}</p>
        </div>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        {(me.stats || []).map((s) => (
          <div key={s.label} className="glass rounded-2xl py-4 text-center">
            <div className="text-[var(--theme-color-1)] font-extrabold text-2xl">{s.value}</div>
            <div className="text-white/40 text-xs font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 glass rounded-2xl p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Sobre mÃ­</p>
        <p className="text-white/80 text-sm leading-relaxed break-words whitespace-pre-wrap">{me.bio}</p>
      </div>

      <div className="mx-5 mt-4 glass rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Intereses</p>
        <div className="flex flex-wrap gap-2">
          {(me.tags || []).map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'color-mix(in srgb, var(--theme-color-1) 15%, transparent)', color: 'var(--theme-color-1)', border: '1px solid color-mix(in srgb, var(--theme-color-1) 20%, transparent)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Mis eventos activos */}
      <div className="mx-5 mt-4 glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Mis eventos activos</p>
          {pastEvents.length > 0 && (
             <button 
               onClick={() => setShowHistory(!showHistory)} 
               className="text-xs font-semibold text-[var(--theme-color-1)] hover:underline"
             >
                {showHistory ? 'Ocultar historial' : `Historial (${pastEvents.length})`}
             </button>
          )}
        </div>
        
        <div className="flex flex-col gap-2 mb-4">
           {activeEvents.length === 0 ? (
             <p className="text-white/40 text-sm">No estÃ¡s en ningÃºn evento activo actualmente.</p>
           ) : (
             activeEvents.map(e => {
               const remainingText = getTimeRemaining(e.end_datetime)
               return (
                 <div key={e.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{e.name || 'Evento'}</p>
                      {remainingText && (
                        <p className="text-white/50 text-xs font-medium mt-0.5">{remainingText}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <span className="text-[10px] text-[#4ade80] font-semibold uppercase tracking-wider">En vivo</span>
                       <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                    </div>
                 </div>
               )
             })
           )}
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={ticketCode} 
            onChange={e => setTicketCode(e.target.value)} 
            placeholder="Ingresar cÃ³digo de ticket..." 
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--theme-color-1)] uppercase placeholder:normal-case placeholder:text-white/30 transition-colors" 
          />
          <button 
            onClick={handleJoin} 
            disabled={joining}
            className="gradient-brand px-5 py-3 rounded-xl font-bold text-white shadow-lg text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            Unirse
          </button>
        </div>
      </div>

      {/* Historial de eventos pasados */}
      {showHistory && pastEvents.length > 0 && (
        <div className="mx-5 glass rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Historial de eventos pasados</p>
          <div className="flex flex-col gap-2">
             {pastEvents.map(e => {
               const dateStr = e.start_datetime ? new Date(e.start_datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
               return (
                 <div key={e.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between opacity-60">
                    <div>
                      <p className="text-white/80 font-semibold text-sm">{e.name || 'Evento'}</p>
                      <p className="text-white/30 text-xs font-medium">{dateStr}</p>
                    </div>
                    <span className="text-[10px] text-white/40 font-semibold uppercase">Finalizado</span>
                 </div>
               )
             })}
          </div>
        </div>
      )}

      <div className="mx-5 mb-28">
        <button onClick={() => setShowThemeModal(true)} className="w-full mb-3 py-4 rounded-xl font-bold text-white text-sm transition-all active:scale-95 glass border border-white/10 flex items-center justify-center gap-2">
           <svg className="w-4 h-4 text-[var(--theme-color-1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
           Estilos
        </button>
        <button onClick={onEdit} className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all active:scale-95 glass border border-white/10">Editar perfil</button>
        <button onClick={() => supabase.auth.signOut()} className="w-full mt-3 py-4 rounded-xl font-bold text-red-500 text-sm transition-all active:scale-95 bg-white/5 border border-red-500/20 hover:bg-red-500/10">Cerrar sesiÃ³n</button>
      </div>

      {showThemeModal && <ThemeModal onClose={() => setShowThemeModal(false)} />}
    </div>
  )
}


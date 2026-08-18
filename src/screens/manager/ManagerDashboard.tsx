import { useState, useEffect } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'
import { TicketManager } from './TicketManager'
import { DrinkManager } from './DrinkManager'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { BarChart3, GlassWater } from 'lucide-react'

export function ManagerDashboard({ manager }: { manager: any }) {
  const isAdmin = manager.role === 'system_admin'
  const isActive = manager.is_active

  const [activeTab, setActiveTab] = useState<'events' | 'managers' | 'settings' | 'bar'>('events')
  const [managersList, setManagersList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newAuthId, setNewAuthId] = useState('')
  const [newRole, setNewRole] = useState('event_manager')
  const [creating, setCreating] = useState(false)

  const [eventsList, setEventsList] = useState<any[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventTime, setNewEventTime] = useState('12:00')
  const [newEventCode, setNewEventCode] = useState('')
  const [newEventBarPassword, setNewEventBarPassword] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'finished' | 'suspended'>('all')
  const [managingTicketsFor, setManagingTicketsFor] = useState<any | null>(null)
  const [managingDrinksFor, setManagingDrinksFor] = useState<any | null>(null)
  const [viewingAnalyticsFor, setViewingAnalyticsFor] = useState<string | null>(null)

  const [mpToken, setMpToken] = useState(manager.mp_access_token || '')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (activeTab === 'managers' && isAdmin) {
      loadManagers()
    } else if (activeTab === 'events') {
      loadEvents()
    }
  }, [activeTab])

  const loadEvents = async () => {
    setLoading(true)
    let query = supabase.from('Events').select('*').order('start_datetime', { ascending: false })
    if (!isAdmin) {
       query = query.eq('manager_id', manager.id)
    }
    const { data } = await query
    if (data) setEventsList(data)
    setLoading(false)
  }

  const startEditEvent = (evt: any) => {
    setEditingEventId(evt.id)
    setNewEventName(evt.name || '')
    setNewEventDesc(evt.description || '')
    setNewEventCode(evt.code || '')
    setNewEventBarPassword('')
    if (evt.start_datetime) {
      const d = new Date(evt.start_datetime)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      setNewEventDate(`${yyyy}-${mm}-${dd}`)
      setNewEventTime(`${hh}:${min}`)
    } else {
      setNewEventDate('')
      setNewEventTime('12:00')
    }
    setShowEventForm(true)
  }

  const resetEventForm = () => {
    setEditingEventId(null)
    setNewEventName('')
    setNewEventDesc('')
    setNewEventDate('')
    setNewEventTime('12:00')
    setNewEventCode('')
    setNewEventBarPassword('')
    setShowEventForm(false)
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName || !newEventDate) return
    setSavingEvent(true)

    const timeString = newEventTime || '12:00'
    const startDateStr = `${newEventDate}T${timeString}:00`
    const startD = new Date(startDateStr)
    const endD = new Date(startD.getTime() + 12 * 60 * 60 * 1000)
    
    const y = endD.getFullYear()
    const m = String(endD.getMonth() + 1).padStart(2, '0')
    const d = String(endD.getDate()).padStart(2, '0')
    const h = String(endD.getHours()).padStart(2, '0')
    const min = String(endD.getMinutes()).padStart(2, '0')
    const endDateStr = `${y}-${m}-${d}T${h}:${min}:00`

    const pw = newEventBarPassword.trim()
    if (pw !== '') {
       if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[^a-zA-Z0-9]/.test(pw)) {
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'La contraseña de la barra debe tener al menos 8 caracteres, una mayúscula y un carácter especial.' } }))
          setSavingEvent(false)
          return
       }
    }

    if (editingEventId) {
      const payload: any = {
         name: newEventName,
         description: newEventDesc,
         start_datetime: startDateStr,
         end_datetime: endDateStr,
         status: 'en curso'
      }
      if (newEventCode.trim() !== '') {
         payload.code = newEventCode.trim()
      }
      if (newEventBarPassword.trim() !== '') {
         payload.bar_password = newEventBarPassword.trim()
      }

      const { error: dbErr } = await supabase.from('Events').update(payload).eq('id', editingEventId)

      if (dbErr) {
         window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error actualizando evento: ' + dbErr.message } }))
      } else {
         window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Evento actualizado correctamente.' } }))
         resetEventForm()
         loadEvents()
      }
    } else {
      const code = newEventCode.trim() !== '' ? newEventCode.trim() : Math.random().toString(36).substring(2, 8).toUpperCase()
      const bPass = newEventBarPassword.trim() !== '' ? newEventBarPassword.trim() : null
      const { error: dbErr } = await supabase.from('Events').insert({
         manager_id: manager.id,
         name: newEventName,
         description: newEventDesc,
         start_datetime: startDateStr,
         end_datetime: endDateStr,
         code: code,
         bar_password: bPass,
         status: 'en curso'
      })

      if (dbErr) {
         window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error creando evento: ' + dbErr.message } }))
      } else {
         window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Evento creado exitosamente.' } }))
         resetEventForm()
         loadEvents()
      }
    }
    setSavingEvent(false)
  }

  const toggleSuspendEvent = async (evt: any) => {
    const isCurrentlySuspended = evt.status === 'suspendido'
    const newStatus = isCurrentlySuspended ? 'en curso' : 'suspendido'
    
    const { error } = await supabase.from('Events').update({
      status: newStatus
    }).eq('id', evt.id)

    if (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error al cambiar estado del evento: ' + error.message } }))
      return
    }

    window.dispatchEvent(new CustomEvent('app-toast', { 
      detail: { 
        title: !isCurrentlySuspended ? 'Evento Suspendido' : 'Evento Reanudado', 
        body: !isCurrentlySuspended ? 'El evento ha sido suspendido exitosamente.' : 'El evento vuelve a estar activo.' 
      } 
    }))
    loadEvents()
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    const { error } = await supabase.from('Managers').update({ mp_access_token: mpToken }).eq('id', manager.id)
    setSavingSettings(false)
    if (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: error.message } }))
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Configuración guardada.' } }))
    }
  }

  const deleteEvent = async (eventId: string) => {
    // Eliminar dependencias primero para no violar foreign keys
    await supabase.from('ProfileEvents').delete().eq('event_id', eventId)
    await supabase.from('TicketCodes').delete().eq('event_id', eventId)
    await supabase.from('Transactions').delete().eq('event_id', eventId)
    
    const { error } = await supabase.from('Events').delete().eq('id', eventId)
    if (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error eliminando evento: ' + error.message } }))
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Eliminado', body: 'Evento eliminado permanentemente.' } }))
      loadEvents()
    }
  }

  const loadManagers = async () => {
    setLoading(true)
    const { data } = await supabase.from('Managers').select('*').order('created_at', { ascending: false })
    if (data) setManagersList(data)
    setLoading(false)
  }

  const toggleManagerActive = async (id: string, currentStatus: boolean) => {
    if (id === manager.id) {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Acción no permitida', body: 'No puedes desactivarte a ti mismo.' } }))
       return
    }
    await supabase.from('Managers').update({ is_active: !currentStatus }).eq('id', id)
    loadManagers()
  }

  const deleteManager = async (id: string) => {
    if (id === manager.id) {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Acción no permitida', body: 'No puedes eliminarte a ti mismo.' } }))
       return
    }
    await supabase.from('Managers').delete().eq('id', id)
    loadManagers()
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Eliminado', body: 'Manager eliminado permanentemente.' } }))
  }

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newAuthId) return
    setCreating(true)

    const { error: dbErr } = await supabase.from('Managers').insert({
      id: newAuthId,
      email: newEmail,
      role: newRole,
      is_active: true
    })
       
    if (dbErr) {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error vinculando el perfil: ' + dbErr.message } }))
    } else {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Manager vinculado exitosamente.' } }))
       setNewEmail('')
       setNewAuthId('')
       setNewRole('event_manager')
       loadManagers()
    }
    setCreating(false)
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) + ' hs'
  }

  const activeEventsList = eventsList.filter(e => {
     if (e.status === 'suspendido' || e.status === 'finalizado') return false
     if (!e.end_datetime) return true
     return new Date(e.end_datetime).getTime() > Date.now()
  })

  const finishedEventsList = eventsList.filter(e => {
     if (e.status === 'suspendido') return false
     if (e.status === 'finalizado') return true
     if (!e.end_datetime) return false
     return new Date(e.end_datetime).getTime() <= Date.now()
  })

  const suspendedEventsList = eventsList.filter(e => e.status === 'suspendido')

  const filteredEventsList = eventFilter === 'active' 
    ? activeEventsList 
    : eventFilter === 'finished' 
    ? finishedEventsList 
    : eventFilter === 'suspended'
    ? suspendedEventsList
    : eventsList

  if (!isActive) {
     return (
       <div className="flex h-screen flex-col items-center justify-center bg-gray-900 p-6 text-center">
         <h1 className="text-3xl text-red-500 mb-4 font-bold">Cuenta desactivada</h1>
         <p className="text-gray-400 mb-8">Tu cuenta de manager ha sido suspendida por un administrador del sistema.</p>
         <button onClick={() => supabase.auth.signOut()} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">Cerrar sesión</button>
       </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
         <h2 className="text-2xl font-bold text-[var(--theme-color-1)] mb-8 tracking-widest notranslate" translate="no">
           G I R A <span className="text-white">Manager</span>
         </h2>

         <nav className="flex-1 space-y-2">
            <button 
              onClick={() => setActiveTab('events')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'events' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              Eventos
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('managers')} 
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'managers' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                Managers
              </button>
            )}
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              Configuración
            </button>
         </nav>

         <div className="pt-6 border-t border-gray-800 mt-auto">
            <p className="text-sm text-gray-400 mb-4 truncate" title={manager.email}>{manager.email}</p>
            <div className="flex gap-2 mb-4">
              <span className="text-xs px-2 py-1 bg-[var(--theme-color-1)]/20 text-[var(--theme-color-1)] rounded font-bold uppercase tracking-wide">
                {isAdmin ? 'ADMIN' : 'MANAGER'}
              </span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors">
              Cerrar sesión
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'events' && viewingAnalyticsFor && (
          <AnalyticsDashboard eventId={viewingAnalyticsFor} onBack={() => setViewingAnalyticsFor(null)} />
        )}
        {activeTab === 'events' && managingTicketsFor && (
           <TicketManager event={managingTicketsFor} onBack={() => setManagingTicketsFor(null)} />
        )}
        {activeTab === 'events' && managingDrinksFor && (
           <DrinkManager event={managingDrinksFor} onBack={() => setManagingDrinksFor(null)} />
        )}
        {activeTab === 'events' && !managingTicketsFor && !managingDrinksFor && !viewingAnalyticsFor && (
           <>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{isAdmin ? 'Todos los eventos' : 'Tus eventos'}</h1>
                  <p className="text-sm text-gray-500 mt-1">Crea, edita, suspende o elimina eventos para tus usuarios.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setViewingAnalyticsFor('general')}
                    className="flex-1 md:flex-none bg-blue-100 text-blue-700 px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Métricas globales
                  </button>
                  <button 
                    onClick={() => {
                      if (showEventForm) resetEventForm()
                      else setShowEventForm(true)
                    }}
                    className="flex-1 md:flex-none bg-[var(--theme-color-1)] text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                     {showEventForm ? 'Cancelar' : '+ Crear evento'}
                  </button>
                </div>
             </div>

             {/* Filtros de eventos */}
             <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
               <button
                 onClick={() => setEventFilter('all')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                   eventFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 Todos ({eventsList.length})
               </button>
               <button
                 onClick={() => setEventFilter('active')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                   eventFilter === 'active' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 En curso ({activeEventsList.length})
               </button>
               <button
                 onClick={() => setEventFilter('suspended')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                   eventFilter === 'suspended' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 Suspendidos ({suspendedEventsList.length})
               </button>
               <button
                 onClick={() => setEventFilter('finished')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                   eventFilter === 'finished' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 Finalizados ({finishedEventsList.length})
               </button>
             </div>

             {showEventForm && (
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">{editingEventId ? 'Editar Evento' : 'Detalles del Nuevo Evento'}</h2>
                  <form onSubmit={handleSaveEvent} className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre del evento</label>
                        <input type="text" required value={newEventName} onChange={e => setNewEventName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)]" placeholder="Ej: Fiesta de Verano 2026" />
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-sm font-semibold text-gray-600 mb-1">Descripción</label>
                           <textarea rows={2} value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)] resize-none" placeholder="Breve descripción del evento..." />
                        </div>
                        <div className="w-48 flex flex-col gap-4">
                           <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Código del evento</label>
                              <input type="text" value={newEventCode} onChange={e => setNewEventCode(e.target.value.toUpperCase())} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)] uppercase" placeholder="Ej: FIESTA26" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Contraseña de barra</label>
                              <input type="text" value={newEventBarPassword} onChange={e => setNewEventBarPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)] placeholder:text-gray-400" placeholder={editingEventId ? "••••••••" : "Ej: Barra123!"} />
                              <p className="text-[10px] text-gray-400 mt-1 leading-tight">{editingEventId ? "Déjalo vacío para mantener la actual" : "Para acceso a empleados"}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-sm font-semibold text-gray-600 mb-1">Fecha de inicio</label>
                           <input type="date" required value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)]" />
                        </div>
                        <div className="w-48">
                           <label className="block text-sm font-semibold text-gray-600 mb-1">Hora de inicio</label>
                           <input type="time" required value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)]" />
                        </div>
                     </div>
                     <p className="text-xs text-gray-400 mt-1">Por defecto, el evento durará 12 horas a partir de la fecha y hora seleccionadas.</p>
                     <div className="pt-2 flex justify-between gap-3">
                        {editingEventId ? (
                           <div className="flex gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const ev = eventsList.find(e => e.id === editingEventId)
                                  if (ev) toggleSuspendEvent(ev)
                                }}
                                className={`px-4 py-2.5 rounded-lg font-bold transition-colors text-sm ${
                                  eventsList.find(e => e.id === editingEventId)?.status === 'suspendido' 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                              >
                                {eventsList.find(e => e.id === editingEventId)?.status === 'suspendido' ? 'Reanudar Evento' : 'Suspender Evento'}
                              </button>
                              <button 
                                type="button"
                                onClick={() => deleteEvent(editingEventId)}
                                className="px-4 py-2.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-bold transition-colors text-sm"
                              >
                                Eliminar Evento
                              </button>
                           </div>
                        ) : <div />}
                        <div className="flex gap-2">
                           <button type="button" onClick={resetEventForm} className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                              Cancelar
                           </button>
                           <button type="submit" disabled={savingEvent} className="bg-gray-900 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
                              {savingEvent ? 'Guardando...' : editingEventId ? 'Guardar cambios' : 'Guardar Evento'}
                           </button>
                        </div>
                     </div>
                  </form>
               </div>
             )}

             {filteredEventsList.length === 0 && !loading ? (
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No hay eventos en esta categoría</h3>
                  <p className="text-sm">Cambia de filtro o crea un nuevo evento.</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-6">
                 {filteredEventsList.map(e => {
                   const isSuspended = e.status === 'suspendido'
                   const isOngoing = !isSuspended && e.status !== 'finalizado' && (!e.end_datetime || new Date(e.end_datetime).getTime() > Date.now())

                   return (
                     <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isSuspended ? 'bg-amber-400' : isOngoing ? 'bg-[var(--theme-color-1)]' : 'bg-gray-300'}`} />
                       
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex-1 pr-2">
                           <h3 className="text-xl font-bold text-gray-900">{e.name}</h3>
                           <p className="text-gray-400 text-xs font-mono mt-0.5">#{e.code}</p>
                         </div>
                         {isSuspended ? (
                           <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase flex-shrink-0">
                             Suspendido
                           </span>
                         ) : isOngoing ? (
                           <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase flex items-center gap-1.5 flex-shrink-0">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             En curso
                           </span>
                         ) : (
                           <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase flex-shrink-0">
                             Finalizado
                           </span>
                         )}
                       </div>

                       <p className="text-gray-500 text-sm mb-4 flex-1">{e.description || 'Sin descripción'}</p>

                       <div className="mt-auto pt-3 border-t border-gray-100 space-y-1.5 text-xs font-semibold">
                          <div className="flex justify-between items-center text-gray-600">
                             <span className="text-gray-400">Inicio:</span>
                             <span className="text-gray-800">{formatDateTime(e.start_datetime)}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                             <span className="text-gray-400">Expiración:</span>
                             <span className={isOngoing ? 'text-green-700 font-bold' : 'text-gray-500'}>{formatDateTime(e.end_datetime)}</span>
                          </div>
                       </div>

                       {/* Acciones de Edición / Suspensión / Eliminación */}
                       <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
                          <button 
                            onClick={() => setManagingTicketsFor(e)}
                            className="flex-1 min-w-[80px] justify-center px-3 py-1.5 bg-[var(--theme-color-1)]/10 hover:bg-[var(--theme-color-1)]/20 text-[var(--theme-color-1)] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                            Tickets
                          </button>
                          <button 
                            onClick={() => setViewingAnalyticsFor(e.id)}
                            className="flex-1 min-w-[80px] justify-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Métricas
                          </button>
                          <button 
                            onClick={() => setManagingDrinksFor(e)}
                            className="flex-1 min-w-[80px] justify-center px-3 py-1.5 bg-[var(--theme-color-1)]/10 hover:bg-[var(--theme-color-1)]/20 text-[var(--theme-color-1)] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <GlassWater className="w-3.5 h-3.5" />
                            Tragos
                          </button>
                          <button 
                            onClick={() => startEditEvent(e)}
                            className="flex-1 min-w-[80px] justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                       </div>
                     </div>
                   )
                 })}
               </div>
             )}
           </>
         )}

         {activeTab === 'managers' && isAdmin && (
           <>
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de managers</h1>
             </div>

             {/* Formulario de Creación */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Vincular manager existente</h2>
                <p className="text-sm text-gray-500 mb-4">Primero crea el usuario en Supabase (Authentication &gt; Users) y pega aquí su UID.</p>
                <form onSubmit={handleCreateManager} className="flex gap-4 items-end">
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">UID del usuario (Supabase)</label>
                      <input type="text" required value={newAuthId} onChange={e => setNewAuthId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)]" placeholder="123e4567-e89b-12d3..." />
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Correo electrónico</label>
                      <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)]" placeholder="nuevo@manager.com" />
                   </div>
                   <div className="w-40">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Rol</label>
                      <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[var(--theme-color-1)]">
                         <option value="event_manager">Manager</option>
                         <option value="system_admin">Admin</option>
                      </select>
                   </div>
                   <button type="submit" disabled={creating} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 h-[46px]">
                      {creating ? 'Vinculando...' : 'Vincular'}
                   </button>
                </form>
             </div>

             {/* Lista de Managers */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                         <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Correo</th>
                         <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                         <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                         <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                      ) : managersList.map(m => (
                         <tr key={m.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                               <div className="font-medium text-gray-900">{m.email}</div>
                               <div className="text-xs text-gray-400 font-mono mt-0.5">{m.id}</div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${m.role === 'system_admin' ? 'bg-[var(--theme-color-1)]/10 text-[var(--theme-color-1)]' : 'bg-gray-100 text-gray-600'}`}>
                                 {m.role === 'system_admin' ? 'Admin' : 'Manager'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {m.is_active ? 'Activo' : 'Inactivo'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-3">
                               {m.id !== manager.id && (
                                 <>
                                   <button onClick={() => toggleManagerActive(m.id, m.is_active)} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
                                      {m.is_active ? 'Desactivar' : 'Activar'}
                                   </button>
                                   <button onClick={() => deleteManager(m.id)} className="text-sm font-semibold text-red-500 hover:text-red-700">
                                      Eliminar
                                   </button>
                                 </>
                               )}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            </>
         )}

         {activeTab === 'settings' && (
           <div className="max-w-2xl mx-auto">
             <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuración</h1>
             <p className="text-gray-500 mb-8">Administra tus credenciales y configuración general.</p>

             <form onSubmit={saveSettings} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h2 className="text-xl font-bold text-gray-800 mb-4">Mercado Pago</h2>
               <p className="text-sm text-gray-500 mb-6">
                 Ingresa tu Access Token de producción (o de prueba) para recibir directamente el dinero de las ventas de la barra en tu cuenta de Mercado Pago.
               </p>

               <div className="mb-6">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Access Token</label>
                 <input
                   type="password"
                   value={mpToken}
                   onChange={e => setMpToken(e.target.value)}
                   className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none focus:border-[var(--theme-color-1)]"
                   placeholder="APP_USR-..."
                 />
                 <p className="text-xs text-gray-400 mt-2">
                   Puedes obtenerlo desde tu cuenta de desarrollador en Mercado Pago.
                 </p>
               </div>

               <div className="flex justify-end">
                 <button 
                   type="submit"
                   disabled={savingSettings}
                   className="bg-[var(--theme-color-1)] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                 >
                   {savingSettings ? 'Guardando...' : 'Guardar cambios'}
                 </button>
               </div>
             </form>
           </div>
         )}
      </div>
    </div>
  )
}

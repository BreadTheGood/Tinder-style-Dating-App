import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function ManagerDashboard({ manager }: { manager: any }) {
  const isAdmin = manager.role === 'system_admin'
  const isActive = manager.is_active

  const [activeTab, setActiveTab] = useState<'events' | 'managers'>('events')
  const [managersList, setManagersList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newAuthId, setNewAuthId] = useState('')
  const [newRole, setNewRole] = useState('event_manager')
  const [creating, setCreating] = useState(false)

  const [eventsList, setEventsList] = useState<any[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'finished'>('all')

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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName || !newEventDate) return
    setSavingEvent(true)

    const startDate = new Date(newEventDate + 'T12:00:00')
    const endDate = new Date(startDate.getTime() + 12 * 60 * 60 * 1000)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error: dbErr } = await supabase.from('Events').insert({
       manager_id: manager.id,
       name: newEventName,
       description: newEventDesc,
       start_datetime: startDate.toISOString(),
       end_datetime: endDate.toISOString(),
       code: code
    })

    if (dbErr) {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error creando evento: ' + dbErr.message } }))
    } else {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Evento creado exitosamente.' } }))
       setNewEventName('')
       setNewEventDesc('')
       setNewEventDate('')
       setShowEventForm(false)
       loadEvents()
    }
    setSavingEvent(false)
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
     if (!e.end_datetime) return true
     return new Date(e.end_datetime).getTime() > Date.now()
  })

  const finishedEventsList = eventsList.filter(e => {
     if (!e.end_datetime) return false
     return new Date(e.end_datetime).getTime() <= Date.now()
  })

  const filteredEventsList = eventFilter === 'active' 
    ? activeEventsList 
    : eventFilter === 'finished' 
    ? finishedEventsList 
    : eventsList

  if (!isActive) {
     return (
       <div className="flex h-screen flex-col items-center justify-center bg-gray-900 p-6 text-center">
         <h1 className="text-3xl text-red-500 mb-4 font-bold">Cuenta Desactivada</h1>
         <p className="text-gray-400 mb-8">Tu cuenta de manager ha sido suspendida por un administrador del sistema.</p>
         <button onClick={() => supabase.auth.signOut()} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">Cerrar Sesión</button>
       </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
         <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f304eb] to-[#ff7043] mb-8">
           Manager Portal
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
         </nav>

         <div className="pt-6 border-t border-gray-800 mt-auto">
            <p className="text-sm text-gray-400 mb-4 truncate" title={manager.email}>{manager.email}</p>
            <div className="flex gap-2 mb-4">
              <span className="text-xs px-2 py-1 bg-[#f304eb]/20 text-[#f304eb] rounded font-bold uppercase tracking-wide">
                {isAdmin ? 'ADMIN' : 'MANAGER'}
              </span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors">
              Cerrar Sesión
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
         {activeTab === 'events' && (
           <>
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{isAdmin ? 'Todos los Eventos' : 'Tus Eventos'}</h1>
                  <p className="text-sm text-gray-500 mt-1">Gestiona eventos en curso y consulta el historial de finalizados.</p>
                </div>
                <button 
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-gradient-to-r from-[#f304eb] to-[#ff7043] text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                   {showEventForm ? 'Cancelar' : '+ Crear Evento'}
                </button>
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
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Detalles del Nuevo Evento</h2>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre del Evento</label>
                        <input type="text" required value={newEventName} onChange={e => setNewEventName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#f304eb]" placeholder="Ej: Fiesta de Verano 2026" />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Descripción</label>
                        <textarea rows={2} value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#f304eb] resize-none" placeholder="Breve descripción del evento..." />
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-sm font-semibold text-gray-600 mb-1">Fecha de Inicio (Día, Mes, Año)</label>
                           <input type="date" required value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#f304eb]" />
                           <p className="text-xs text-gray-400 mt-1">Por defecto, iniciará a las 12:00 hs y durará 12 horas (hasta las 00:00 hs).</p>
                        </div>
                        <div className="flex-1">
                           <label className="block text-sm font-semibold text-gray-600 mb-1">Lista de Códigos (Opcional)</label>
                           <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Próximamente', body: 'La carga de CSV se integrará en la siguiente fase.' } }))} className="w-full bg-gray-100 border border-gray-200 border-dashed rounded-lg px-4 py-2.5 text-gray-500 font-medium hover:bg-gray-200 transition-colors">
                              Subir archivo .csv
                           </button>
                        </div>
                     </div>
                     <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={savingEvent} className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
                           {savingEvent ? 'Guardando...' : 'Guardar Evento'}
                        </button>
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
                   const isOngoing = !e.end_datetime || new Date(e.end_datetime).getTime() > Date.now()
                   return (
                     <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isOngoing ? 'bg-gradient-to-b from-[#f304eb] to-[#ff7043]' : 'bg-gray-300'}`} />
                       
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex-1 pr-2">
                           <h3 className="text-xl font-bold text-gray-900">{e.name}</h3>
                           <p className="text-gray-400 text-xs font-mono mt-0.5">#{e.code}</p>
                         </div>
                         {isOngoing ? (
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
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Managers</h1>
             </div>

             {/* Formulario de Creación */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Vincular Manager Existente</h2>
                <p className="text-sm text-gray-500 mb-4">Primero crea el usuario en Supabase (Authentication &gt; Users) y pega aquí su UID.</p>
                <form onSubmit={handleCreateManager} className="flex gap-4 items-end">
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">UID del Usuario (Supabase)</label>
                      <input type="text" required value={newAuthId} onChange={e => setNewAuthId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#f304eb]" placeholder="123e4567-e89b-12d3..." />
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Correo Electrónico</label>
                      <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#f304eb]" placeholder="nuevo@manager.com" />
                   </div>
                   <div className="w-40">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Rol</label>
                      <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-[#f304eb]">
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
                               <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${m.role === 'system_admin' ? 'bg-[#f304eb]/10 text-[#f304eb]' : 'bg-gray-100 text-gray-600'}`}>
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
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'

export function TicketManager({ event, onBack }: { event: any, onBack: () => void }) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generateCount, setGenerateCount] = useState(10)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('TicketCodes')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
    
    if (data) setTickets(data)
    setLoading(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (generateCount < 1 || generateCount > 1000) return
    setGenerating(true)

    const newTickets = []
    for (let i = 0; i < generateCount; i++) {
      // Generar código aleatorio de 6-8 caracteres alfanuméricos
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      newTickets.push({
        event_id: event.id,
        code: code,
        is_used: false
      })
    }

    const { error } = await supabase.from('TicketCodes').insert(newTickets)
    
    if (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error generando tickets: ' + error.message } }))
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: `${generateCount} tickets generados correctamente.` } }))
      setGenerateCount(10)
      loadTickets()
    }
    setGenerating(false)
  }

  const downloadCSV = () => {
    if (tickets.length === 0) return
    
    const headers = ['Código', 'Estado (Usado)']
    const csvContent = [
      headers.join(','),
      ...tickets.map(t => `${t.code},${t.is_used ? 'Si' : 'No'}`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `tickets_${event.name.replace(/\s+/g, '_')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const usedCount = tickets.filter(t => t.is_used).length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col h-full animate-fade-in relative">
      <button 
        onClick={onBack}
        className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Tickets</h2>
      <p className="text-gray-500 mb-8 font-medium">Evento: <span className="text-[#f304eb]">{event.name}</span></p>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Total Generados</p>
          <p className="text-4xl font-extrabold text-gray-900">{tickets.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
          <p className="text-sm font-bold text-green-600 uppercase tracking-wide mb-1">Tickets Usados</p>
          <p className="text-4xl font-extrabold text-green-700">{usedCount}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-1">Disponibles</p>
          <p className="text-4xl font-extrabold text-blue-700">{tickets.length - usedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Panel de Generación */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#f304eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Generar Nuevos Tickets
            </h3>
            <p className="text-sm text-gray-400 mb-6">El sistema creará códigos únicos alfanuméricos que tus invitados podrán usar en la app.</p>
            
            <form onSubmit={handleGenerate} className="flex gap-3">
              <input 
                type="number" 
                min="1" 
                max="1000"
                value={generateCount}
                onChange={e => setGenerateCount(Number(e.target.value))}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-white font-bold focus:outline-none focus:border-[#f304eb]" 
              />
              <button 
                type="submit" 
                disabled={generating}
                className="flex-1 bg-gradient-to-r from-[#f304eb] to-[#ff7043] text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar'}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Importar desde CSV</h3>
            <p className="text-xs text-gray-500 mb-4">¿Ya tienes códigos de Passline, Eventbrite u otra tiquetera?</p>
            <button disabled className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed">
              Próximamente
            </button>
          </div>
        </div>

        {/* Panel de Lista */}
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Lista de Códigos</h3>
            <button 
              onClick={downloadCSV}
              disabled={tickets.length === 0}
              className="text-sm font-bold text-[#f304eb] hover:text-[#ff7043] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar CSV
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <p className="text-center text-gray-400 text-sm mt-10">Cargando tickets...</p>
            ) : tickets.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-10 flex flex-col items-center">
                <svg className="w-10 h-10 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                <p>No hay tickets generados para este evento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map(t => (
                  <div key={t.id || t.code} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-mono font-bold text-gray-700 tracking-wider">{t.code}</span>
                    {t.is_used ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Usado</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-200 text-gray-500 text-[10px] font-bold rounded uppercase">Disponible</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

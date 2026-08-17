import { useState, useEffect } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'

export function AnalyticsDashboard({ eventId, onBack }: { eventId: string, onBack: () => void }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalytics()
  }, [eventId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const { data: analyticsData, error } = await supabase.rpc('get_event_analytics', { p_event_id: eventId })
      
      if (error) throw error
      setData(analyticsData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al cargar analíticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12 text-[var(--theme-color-1)] font-bold animate-pulse">Cargando métricas...</div>
  if (error) return <div className="p-6 text-red-500 bg-red-50 rounded-lg">{error}</div>
  if (!data || !data.summary) return <div className="p-6">No hay datos suficientes para este evento.</div>

  const { summary, top_spenders, top_receivers } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium">← Volver a Eventos</button>
        <h2 className="text-2xl font-bold text-gray-800">Analíticas: {summary.name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
            👥
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Asistentes únicos</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_attendees}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl">
            🍹
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tragos Invitados</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_drinks_sold}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl">
            💰
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
            <p className="text-2xl font-bold text-gray-900">${summary.total_revenue}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-2xl">
            📈
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Transacciones</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_transactions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🐳</span> Top Compradores (Whales)
          </h3>
          <p className="text-sm text-gray-500 mb-4">Usuarios que más invierten en la app.</p>
          {top_spenders.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay transacciones aún.</p>
          ) : (
            <div className="space-y-3">
              {top_spenders.map((s: any, i: number) => (
                <div key={s.profile_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--theme-color-1)]/10 text-[var(--theme-color-1)] rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{s.user_name}</p>
                      <p className="text-xs text-gray-500">{s.total_drinks_bought} tragos ({s.purchase_count} transacciones)</p>
                    </div>
                  </div>
                  <div className="font-bold text-green-600">${s.total_spent}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔥</span> Perfiles Más Atractivos
          </h3>
          <p className="text-sm text-gray-500 mb-4">Usuarios que más tragos reciben (Top Sedientos).</p>
          {top_receivers.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay interacciones aún.</p>
          ) : (
            <div className="space-y-3">
              {top_receivers.map((r: any, i: number) => (
                <div key={r.profile_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <p className="font-bold text-gray-900">{r.user_name}</p>
                  </div>
                  <div className="font-bold text-purple-600">{r.total_drinks_received} recibidos</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

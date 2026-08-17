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
      let rpcName = 'get_event_analytics'
      let params = { p_event_id: eventId }

      if (eventId === 'general') {
        rpcName = 'get_general_analytics'
        params = {} as any
      }

      const { data: analyticsData, error } = await supabase.rpc(rpcName, params)
      
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

  const { summary, top_spenders, top_receivers, top_drinks = [] } = data

  const isGeneral = !summary.name

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        {!isGeneral && <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium">← Volver a Eventos</button>}
        <h2 className="text-2xl font-bold text-gray-800">{isGeneral ? 'Métricas Generales' : `Analíticas: ${summary.name}`}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl" title="Cantidad de personas que se han unido al evento">
            👥
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500" title="Cantidad de perfiles distintos registrados en los eventos">Asistentes únicos</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_attendees || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl" title="Cantidad total de tragos regalados a través de la app">
            🍹
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tragos Invitados</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_drinks_sold || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl" title="Ganancia bruta generada por las ventas">
            💰
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
            <p className="text-2xl font-bold text-gray-900">${summary.total_revenue || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-2xl" title="Cantidad de pagos procesados y aprobados">
            📈
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ventas</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_transactions || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Top compradores</h3>
          <p className="text-sm text-gray-500 mb-4">Usuarios que invitan mas tragos.</p>
          
          {top_spenders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              <strong>Tip:</strong> Es una buena idea invitar a <strong>{top_spenders[0].user_name}</strong> al siguiente evento o regalarle un trago, ya que suele invertir mucho en tus eventos.
            </div>
          )}

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
                      <p className="text-xs text-gray-500">{s.total_drinks_bought} tragos ({s.purchase_count} compras)</p>
                    </div>
                  </div>
                  <div className="font-bold text-green-600">${s.total_spent}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Top tasa de conversion</h3>
          <p className="text-sm text-gray-500 mb-4">Usuarios que consiguen mas tragos.</p>
          
          {top_receivers.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-800">
              <strong>Tip:</strong> Puedes usar perfiles como el de <strong>{top_receivers[0].user_name}</strong> en tu marketing. Tienen un perfil muy atractivo que fomenta el gasto.
            </div>
          )}

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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Top tragos</h3>
          <p className="text-sm text-gray-500 mb-4">Tragos mas pedidos.</p>
          
          {top_drinks.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-800">
              <strong>Tip:</strong> Asegúrate de tener suficiente stock de <strong>{top_drinks[0].drink_name}</strong> para evitar quiebres de inventario.
            </div>
          )}

          {top_drinks.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay ventas aún.</p>
          ) : (
            <div className="space-y-3">
              {top_drinks.map((d: any, i: number) => (
                <div key={d.drink_name} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{d.drink_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{d.drink_icon}</span>
                    <div className="font-bold text-orange-600">{d.total_sold}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

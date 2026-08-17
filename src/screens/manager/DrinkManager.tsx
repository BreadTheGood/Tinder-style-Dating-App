import { useState, useEffect } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'

export function DrinkManager({ event, onBack }: { event: any, onBack: () => void }) {
  const [drinks, setDrinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [icon, setIcon] = useState('TR')

  const [saving, setSaving] = useState(false)

  const loadDrinks = async () => {
    setLoading(true)
    const { data } = await supabase.from('Drinks').select('*').eq('event_id', event.id).order('price', { ascending: true })
    if (data) setDrinks(data)
    setLoading(false)
  }

  useEffect(() => {
    loadDrinks()
  }, [event.id])

  const handleAddDrink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return
    
    setSaving(true)
    const { error } = await supabase.from('Drinks').insert({
      event_id: event.id,
      name,
      price: parseFloat(price),
      icon
    })

    setSaving(false)
    if (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: error.message } }))
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Trago añadido.' } }))
      setName('')
      setPrice('')
      setIcon('TR')
      loadDrinks()
    }
  }

  const handleDeleteDrink = async (id: string) => {
    if (!confirm('¿Eliminar este trago?')) return
    const { error } = await supabase.from('Drinks').delete().eq('id', id)
    if (error) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: error.message } }))
    } else {
      loadDrinks()
    }
  }

  return (
    <div className="bg-[#1a1b1e] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-gray-400 hover:text-white mb-2 text-sm transition-colors">
            ← Volver a Eventos
          </button>
          <h2 className="text-2xl font-bold text-white">Carta de Tragos</h2>
          <p className="text-gray-400 mt-1">Gestiona el menú de {event.name}</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleAddDrink} className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="font-bold text-white">Añadir Trago</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--theme-color-1)] transition-colors"
                placeholder="Ej. Fernet con Coca"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Precio ($)</label>
              <input 
                type="number" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--theme-color-1)] transition-colors"
                placeholder="5000"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Siglas</label>
              <input 
                type="text" 
                value={icon} 
                onChange={e => setIcon(e.target.value.toUpperCase())} 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--theme-color-1)] text-center text-xl transition-colors font-bold"
                maxLength={2}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--theme-color-1)] text-white font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Añadir al Menú'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-white mb-4">Menú Actual ({drinks.length})</h3>
          
          {loading ? (
            <p className="text-gray-400">Cargando...</p>
          ) : drinks.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5">
              <p className="text-gray-400">No hay tragos en la carta para este evento.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {drinks.map(drink => (
                  <div key={drink.id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5 hover:border-[var(--theme-color-1)]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 bg-white/5 rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-white/10">
                        {drink.icon}
                      </div>
                      <div>
                        <p className="font-bold text-white">{drink.name}</p>
                        <p className="text-[var(--theme-color-1)] font-semibold">${drink.price.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteDrink(drink.id)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-sm font-bold"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

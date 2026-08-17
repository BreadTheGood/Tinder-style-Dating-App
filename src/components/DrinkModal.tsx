import { useEffect, useState } from 'react'
import { XIcon } from './icons'
import { supabase } from '../lib/supabase'

export function DrinkModal({ partnerId, onClose }: { partnerId: string | number, onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [activeEvent, setActiveEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [drinkMenu, setDrinkMenu] = useState<any[]>([])
  const [selectedDrink, setSelectedDrink] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    async function fetchSharedEvents() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (!myProfile) return

      const { data: myEvents } = await supabase.from('ProfileEvents').select('event_id').eq('profile_id', myProfile.id)
      const { data: partnerEvents } = await supabase.from('ProfileEvents').select('event_id').eq('profile_id', partnerId)
      
      if (myEvents && partnerEvents) {
        const partnerEventIds = new Set(partnerEvents.map(e => e.event_id))
        const sharedEventIds = myEvents.map(e => e.event_id).filter(id => partnerEventIds.has(id))
        
        if (sharedEventIds.length > 0) {
           const { data: activeSharedEvents } = await supabase.from('Events').select('*').in('id', sharedEventIds)
           if (activeSharedEvents) {
             const validEvents = activeSharedEvents.filter(ev => ev.status !== 'suspendido' && (!ev.end_datetime || new Date(ev.end_datetime).getTime() > Date.now()))
             setEvents(validEvents)
             if (validEvents.length > 0) setActiveEvent(validEvents[0])
           }
        }
      }
      setLoading(false)
    }
    fetchSharedEvents()
  }, [partnerId])

  useEffect(() => {
    async function fetchDrinks() {
       if (activeEvent) {
          const { data } = await supabase.from('Drinks').select('*').eq('event_id', activeEvent.id).order('price', { ascending: true })
          if (data && data.length > 0) {
             setDrinkMenu(data)
             setSelectedDrink(data[0])
          } else {
             setDrinkMenu([])
             setSelectedDrink(null)
          }
          setQuantity(1)
       }
    }
    fetchDrinks()
  }, [activeEvent])

  const handleSend = async () => {
    if (!selectedDrink || paying) return
    setPaying(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://mqrymzfnnysjlnrufegb.supabase.co'}/functions/v1/mercadopago-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          drink_id: selectedDrink.id,
          quantity,
          receiver_id: partnerId,
          event_id: activeEvent.id
        })
      })

      const data = await response.json()
      
      if (response.ok && data.init_point) {
        window.location.href = data.init_point
      } else {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: data.error || 'No se pudo generar el pago.' } }))
      }
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'Error de red al procesar el pago.' } }))
    } finally {
      setPaying(false)
    }
  }

  if (loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-[#1a1b1e] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        {/* Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-white/5 relative bg-gradient-to-br from-white/5 to-transparent">
          <div>
            <h2 className="text-xl font-extrabold text-white">Regalar un trago</h2>
            <p className="text-xs text-white/50 font-medium mt-0.5">La mejor forma de romper el hielo</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-4 opacity-50">🎟️</div>
             <p className="text-white/60 font-medium">No comparten eventos activos para la barra.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Event Tabs */}
            {events.length > 1 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/5">
                {events.map((ev) => (
                  <button 
                    key={ev.id}
                    onClick={() => setActiveEvent(ev)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeEvent?.id === ev.id ? 'bg-[var(--theme-color-1)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--theme-color-1)_30%,transparent)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                  >
                    <span>{ev.name || 'Evento'}</span>
                    {activeEvent?.id === ev.id && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                ))}
              </div>
            )}

            {/* Menu */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {drinkMenu.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <p className="text-white/60 text-sm">Este evento aún no tiene menú disponible.</p>
                </div>
              ) : (
                drinkMenu.map(drink => (
                  <button 
                    key={drink.id}
                    onClick={() => setSelectedDrink(drink)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedDrink?.id === drink.id ? 'border-[var(--theme-color-1)] bg-[color-mix(in_srgb,var(--theme-color-1)_10%,transparent)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                        {drink.icon || '🍹'}
                      </div>
                      <div>
                        <h4 className={`font-bold ${selectedDrink?.id === drink.id ? 'text-white' : 'text-white/80'}`}>{drink.name}</h4>
                        <p className="text-[var(--theme-color-1)] font-extrabold mt-0.5">${drink.price.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedDrink?.id === drink.id ? 'border-[var(--theme-color-1)]' : 'border-white/20'}`}>
                      {selectedDrink?.id === drink.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme-color-1)]" />}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/5 bg-[#141517] flex flex-col gap-4">
              <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2 border border-white/5">
                <span className="pl-4 text-white/50 text-sm font-semibold">Cantidad</span>
                <div className="flex items-center gap-4 pr-2">
                  <button 
                    disabled={quantity <= 1 || !selectedDrink}
                    onClick={() => setQuantity(q => q - 1)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="text-white font-bold w-4 text-center">{quantity}</span>
                  <button 
                    disabled={!selectedDrink || quantity >= 10}
                    onClick={() => setQuantity(q => q < 10 ? q + 1 : 10)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                disabled={!selectedDrink || paying}
                onClick={handleSend}
                className="w-full bg-[var(--theme-color-1)] text-white font-bold py-4 rounded-2xl disabled:opacity-50 transition-all shadow-[0_4px_16px_color-mix(in_srgb,var(--theme-color-1)_40%,transparent)] flex items-center justify-center gap-2"
              >
                {paying ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  selectedDrink ? `Pagar MercadoPago $${(selectedDrink.price * quantity).toLocaleString('es-AR')}` : 'Selecciona un trago'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

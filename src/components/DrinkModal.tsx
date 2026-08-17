import { useState, useEffect } from 'react'
import { XIcon } from './icons'
import { supabase } from '../lib/supabase'

export function DrinkModal({ partnerId, onClose, onSend }: { partnerId: string | number, onClose: () => void, onSend: (msg: string) => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [activeEvent, setActiveEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedDrink, setSelectedDrink] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  // Fictitious drink menu since it's not defined in the DB yet
  const drinkMenu = [
    { id: '1', name: 'Fernet con Coca', price: 5000, icon: '🥃' },
    { id: '2', name: 'Gin Tonic', price: 6000, icon: '🍸' },
    { id: '3', name: 'Cerveza', price: 3000, icon: '🍺' },
    { id: '4', name: 'Vodka con Speed', price: 5500, icon: '🥤' }
  ]

  useEffect(() => {
    async function fetchSharedEvents() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: myProfile } = await supabase.from('Profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (!myProfile) return

      const { data: myEvents } = await supabase.from('ProfileEvents').select('event_id, Events(*)').eq('profile_id', myProfile.id)
      const { data: partnerEvents } = await supabase.from('ProfileEvents').select('event_id').eq('profile_id', partnerId)
      
      if (myEvents && partnerEvents) {
        const partnerEventIds = new Set(partnerEvents.map(e => e.event_id))
        const shared = myEvents
          .filter(e => partnerEventIds.has(e.event_id))
          .map(e => e.Events)
          .filter((ev: any) => {
            if (Array.isArray(ev)) ev = ev[0];
            if (!ev) return false;
            return !ev.is_suspended && (!ev.end_datetime || new Date(ev.end_datetime).getTime() > Date.now())
          })
          .map((ev: any) => Array.isArray(ev) ? ev[0] : ev)
        
        setEvents(shared)
        if (shared.length > 0) setActiveEvent(shared[0])
      }
      setLoading(false)
    }
    fetchSharedEvents()
  }, [partnerId])

  const handleSend = () => {
    if (!selectedDrink || !activeEvent) return
    const total = selectedDrink.price * quantity
    
    // Simulate payment gateway
    alert(`Redirigiendo a pasarela de pago... Total: $${total} para ${activeEvent.name}`)
    
    // Create random QR code for redemption
    const qrCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    
    const msg = `🍹 ¡Te he enviado ${quantity}x ${selectedDrink.name}! \nCanjéalo en la barra usando este código: ${qrCode}`
    onSend(msg)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Invitar un trago</h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full bg-white/5">
            <XIcon size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-white/50">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-white/50">No comparten eventos activos para enviar tragos.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {events.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-white/10 hide-scrollbar">
                {events.map(ev => (
                  <button 
                    key={ev.id}
                    onClick={() => setActiveEvent(ev)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                      activeEvent?.id === ev.id ? 'bg-[var(--theme-color-1)] text-white' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    {ev.name}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {drinkMenu.map(drink => (
                <button
                  key={drink.id}
                  onClick={() => setSelectedDrink(drink)}
                  className={`w-full flex items-center p-4 rounded-2xl border transition-all ${
                    selectedDrink?.id === drink.id 
                      ? 'border-[var(--theme-color-1)] bg-[var(--theme-color-1)]/10' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl mr-4">{drink.icon}</span>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-bold">{drink.name}</h3>
                    <p className="text-white/50 text-sm">${drink.price}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedDrink?.id === drink.id ? 'border-[var(--theme-color-1)]' : 'border-white/20'
                  }`}>
                    {selectedDrink?.id === drink.id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme-color-1)]" />}
                  </div>
                </button>
              ))}
            </div>

            {selectedDrink && (
              <div className="mt-6 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-white/70 font-medium">Cantidad</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="text-white font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                disabled={!selectedDrink}
                onClick={handleSend}
                className="w-full bg-[var(--theme-color-1)] text-white font-bold py-4 rounded-2xl disabled:opacity-50 transition-all shadow-[0_4px_16px_color-mix(in_srgb,var(--theme-color-1)_40%,transparent)]"
              >
                {selectedDrink ? `Pagar $${selectedDrink.price * quantity}` : 'Selecciona un trago'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

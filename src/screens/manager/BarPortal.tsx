import { useState } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'

export function BarPortal({ event }: { event: any }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [transaction, setTransaction] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const searchCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setErrorMsg('')
    setTransaction(null)

    const searchCodeStr = code.trim().toUpperCase()
    if (!searchCodeStr.startsWith('DRINK-')) {
       setErrorMsg('Formato inválido. El código debe empezar con DRINK-')
       setLoading(false)
       return
    }

    const { data: tx, error } = await supabase.rpc('get_drink_details', {
       p_qr_code: searchCodeStr,
       p_bar_password: event.bar_password
    })

    if (error || !tx) {
      setErrorMsg('Código no encontrado, inválido, o no pertenece a este evento.')
    } else {
      setTransaction(tx)
    }
    setLoading(false)
  }

  const markAsRedeemed = async () => {
    if (!transaction) return
    setLoading(true)
    
    const { data: success, error } = await supabase.rpc('redeem_drink', {
       p_qr_code: code.trim().toUpperCase(),
       p_bar_password: event.bar_password
    })

    if (error || !success) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'No se pudo canjear.' } }))
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Trago entregado y código invalidado.' } }))
      setTransaction({ ...transaction, status: 'redeemed' })
      setCode('')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-gray-500 mb-8">
        Ingresa el código que te muestra el usuario para validar su compra y entregar el trago.
      </p>

      <form onSubmit={searchCode} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4">
         <input 
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ej. DRINK-ABCDEF..."
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 font-bold uppercase tracking-wider outline-none focus:border-[var(--theme-color-1)]"
         />
         <button 
           type="submit" 
           disabled={loading}
           className="bg-[var(--theme-color-1)] text-white font-bold px-8 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
         >
            {loading ? 'Buscando...' : 'Verificar'}
         </button>
      </form>

      {errorMsg && (
         <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium">
            {errorMsg}
         </div>
      )}

      {transaction && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className={`p-6 border-b ${transaction.status === 'redeemed' ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl font-bold text-gray-800">Detalles del Trago</h2>
                 {transaction.status === 'approved' && (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full uppercase">Listo para Entregar</span>
                 )}
                 {transaction.status === 'redeemed' && (
                    <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full uppercase">Ya Entregado</span>
                 )}
                 {transaction.status === 'pending' && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full uppercase">Pago Pendiente</span>
                 )}
              </div>
              <p className="text-sm text-gray-500">Comprado por: <span className="font-bold text-gray-800">{transaction.buyer_name || 'Desconocido'}</span></p>
           </div>

           <div className="p-6">
              <div className="flex items-center gap-6 mb-8">
                 <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl">
                    {transaction.drink_icon || '🥃'}
                 </div>
                 <div>
                    <h3 className="text-3xl font-extrabold text-gray-800 mb-1">
                       {transaction.quantity}x {transaction.drink_name || 'Trago Eliminado'}
                    </h3>
                    
                    {/* CONFIRMACIÓN DE MERCADO PAGO */}
                    {transaction.mp_payment_id && (
                       <div className="flex items-center gap-2 mt-2 text-sm text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-lg w-max border border-green-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Pago de Mercado Pago #{transaction.mp_payment_id}
                       </div>
                    )}
                 </div>
              </div>

              {transaction.status === 'approved' && (
                 <button 
                   onClick={markAsRedeemed}
                   disabled={loading}
                   className="w-full bg-green-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50"
                 >
                    {loading ? 'Procesando...' : 'Entregar y Canjear Código'}
                 </button>
              )}
              {transaction.status === 'redeemed' && (
                 <div className="text-center p-4 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase">
                    Este trago ya fue entregado
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  )
}

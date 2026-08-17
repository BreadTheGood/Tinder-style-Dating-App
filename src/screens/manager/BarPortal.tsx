import { useState, useEffect } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'
import { Scanner } from '@yudiel/react-qr-scanner'

export function BarPortal({ event }: { event: any }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [transaction, setTransaction] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [transactionsList, setTransactionsList] = useState<any[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [closureCode, setClosureCode] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)

  const loadTransactions = async () => {
     const { data } = await supabase.rpc('get_event_transactions', {
        p_event_code: event.code,
        p_bar_password: event.bar_password
     })
     if (data) {
        setTransactionsList(data.transactions || [])
        setIsClosed(data.is_closed || false)
        setClosureCode(data.closure_code || '')
        setTotalAmount(data.total_amount || 0)
     }
  }

  useEffect(() => {
     loadTransactions()
  }, [event])

  const processCode = async (searchCodeStr: string) => {
    setLoading(true)
    setErrorMsg('')
    setTransaction(null)
    setCode(searchCodeStr)
    setShowScanner(false)

    if (!searchCodeStr.startsWith('DRINK-')) {
       setErrorMsg('Formato inválido. El código escaneado no es un trago (DRINK-...)')
       setLoading(false)
       return
    }

    if (isClosed) {
       setErrorMsg('El evento ya finalizó y la caja está cerrada. No se pueden canjear más tragos.')
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
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'No se pudo canjear el trago.' } }))
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Trago entregado y validado correctamente.' } }))
      setTransaction({ ...transaction, status: 'redeemed' })
      setCode('')
      loadTransactions()
    }
    setLoading(false)
  }

  const searchCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    processCode(code.trim().toUpperCase())
  }

  const handleScan = async (text: string) => {
    if (!text.trim()) return
    processCode(text.trim().toUpperCase())
  }

  const handleCloseRegister = async () => {
     if (window.confirm('¿Estás seguro de que quieres cerrar la caja? Ya no se podrán canjear más tragos en este evento.')) {
        setLoading(true)
        const { data, error } = await supabase.rpc('close_bar_register', {
           p_event_code: event.code,
           p_bar_password: event.bar_password
        })
        if (error || !data) {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'No se pudo cerrar la caja.' } }))
        } else {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Caja Cerrada', body: 'El evento ha finalizado exitosamente.' } }))
           setIsClosed(true)
           setClosureCode(data.code)
           setTotalAmount(data.total)
        }
        setLoading(false)
     }
  }

  const handleReopenRegister = async () => {
     if (window.confirm('¿Estás seguro de que quieres reabrir la caja? Se podrán volver a canjear tragos.')) {
        setLoading(true)
        const { data: success, error } = await supabase.rpc('reopen_bar_register', {
           p_event_code: event.code,
           p_bar_password: event.bar_password
        })
        if (error || !success) {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: 'No se pudo reabrir la caja.' } }))
        } else {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Caja Abierta', body: 'El evento vuelve a estar activo.' } }))
           setIsClosed(false)
           loadTransactions()
        }
        setLoading(false)
     }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <p className="text-gray-500 m-0">
          Ingresa el código que te muestra el usuario o escanea su QR para validar su compra y entregar el trago.
        </p>
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-black text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 whitespace-nowrap transition-colors shadow-lg"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Escanear QR
        </button>
      </div>

      {showScanner && (
         <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
            <div className="p-4 flex justify-between items-center bg-black/80 absolute top-0 left-0 right-0 z-10 backdrop-blur-md border-b border-white/10">
               <span className="text-white font-bold text-lg tracking-wide">Escáner de Tragos</span>
               <button onClick={() => setShowScanner(false)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>
            <div className="flex-1 flex items-center justify-center bg-black/90">
              <div className="w-full max-w-md aspect-square relative border-2 border-white/20 rounded-3xl overflow-hidden">
                <Scanner 
                  onScan={(result) => {
                     if (result && result.length > 0) {
                        handleScan(result[0].rawValue)
                     }
                  }}
                  onError={(error) => console.log(error?.message)}
                  formats={['qr_code']}
                />
                <div className="absolute inset-0 border-2 border-[var(--theme-color-1)] opacity-50 m-8 rounded-xl pointer-events-none" />
              </div>
            </div>
            <div className="p-8 text-center text-white/50 text-sm absolute bottom-0 left-0 right-0">Apunta la cámara al código QR</div>
         </div>
      )}

      <form onSubmit={searchCode} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
         <input 
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="O escribe manualmente: DRINK-ABCDEF..."
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 font-bold uppercase tracking-wider outline-none focus:border-[var(--theme-color-1)]"
         />
         <button 
           type="submit" 
           disabled={loading}
           className="bg-[var(--theme-color-1)] text-white font-bold px-8 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
           <div className={`p-6 border-b ${transaction.status === 'redeemed' ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl font-bold text-gray-800">Detalle de trago</h2>
                 {transaction.status === 'redeemed' && (
                    <span className="px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full uppercase">Ya Entregado</span>
                 )}
                 {transaction.status === 'pending' && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full uppercase">Pago Pendiente</span>
                 )}
              </div>
              <p className="text-sm text-gray-500">De <span className="font-bold text-gray-800">{transaction.buyer_name || 'Alguien'}</span> para <span className="font-bold text-gray-800">{transaction.receiver_name || 'Alguien'}</span></p>
           </div>

           <div className="p-6">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl">
                    {transaction.drink_icon || ''}
                 </div>
                 <div>
                    <h3 className="text-3xl font-extrabold text-gray-800 mb-1">
                       {transaction.quantity}x {transaction.drink_name || 'Trago'}
                    </h3>
                    
                    {transaction.mp_payment_id && (
                       <div className="flex items-start sm:items-center gap-2 mt-2 text-sm text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 w-full sm:w-fit max-w-full">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="break-all">Pago MP #{transaction.mp_payment_id}</span>
                       </div>
                    )}
                 </div>
              </div>

              {transaction.status === 'approved' && (
                 <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
                    <h3 className="text-2xl font-black text-green-800 mb-2 flex items-center justify-center gap-2">
                       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       ¡QR Válido!
                    </h3>
                    <p className="text-green-700 mb-6 font-medium">Confirma la entrega de {transaction.quantity}x {transaction.drink_name}</p>
                    <button 
                      onClick={markAsRedeemed}
                      disabled={loading}
                      className="w-full bg-green-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                       {loading ? 'Procesando...' : 'Aceptar'}
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      <div className="mt-12">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
           <h2 className="text-xl font-bold text-gray-800 m-0">Historial de Tragos del Evento</h2>
           {isClosed ? (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                 <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 text-center sm:text-left w-full sm:w-auto">
                    <p className="text-sm font-bold m-0 uppercase">Caja Cerrada</p>
                    <p className="text-xs m-0">Total: <span className="font-mono text-base font-black">${totalAmount}</span></p>
                    <p className="text-[10px] font-mono opacity-80 m-0 mt-0.5">CÓDIGO: {closureCode}</p>
                 </div>
                 <button 
                    onClick={handleReopenRegister}
                    disabled={loading}
                    className="bg-white text-gray-700 font-bold py-2 px-4 rounded-lg text-xs border border-gray-300 hover:bg-gray-50 transition-colors self-stretch sm:self-auto disabled:opacity-50"
                 >
                    Reabrir Caja
                 </button>
              </div>
           ) : (
              <button 
                 onClick={handleCloseRegister}
                 disabled={loading}
                 className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm self-start sm:self-auto disabled:opacity-50"
              >
                 Cerrar Caja
              </button>
           )}
        </div>
        {transactionsList.length === 0 ? (
           <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
             Todavía no hay compras en este evento.
           </div>
        ) : (
           <div className="grid gap-3">
             {transactionsList.map((tx: any) => (
                <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        {tx.drink_icon || ''}
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-800">{tx.quantity}x {tx.drink_name || 'Trago'}</h4>
                         <p className="text-xs text-gray-500">
                           De: {tx.buyer_name || 'Alguien'} para {tx.receiver_name || 'Alguien'} • {new Date(tx.created_at).toLocaleTimeString()}
                           {tx.mp_payment_id && <span className="text-gray-400 font-mono ml-1">• MP: {tx.mp_payment_id}</span>}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center sm:items-end justify-between sm:flex-col mt-2 sm:mt-0">
                      <div>
                         {tx.status === 'redeemed' && <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">Entregado</span>}
                         {tx.status === 'approved' && <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Listo para entrega</span>}
                         {tx.status === 'pending' && <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Pendiente</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 text-right">{tx.qr_code}</p>
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { managerSupabase as supabase } from './lib/managerSupabase'
import { BarPortal } from './screens/manager/BarPortal'

export function BarApp() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [eventData, setEventData] = useState<any>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !password) return
    setLoading(true)
    setErrorMsg('')

    // We use a regular Supabase RPC or direct query.
    // Since managerSupabase uses anon key if not logged in, we need to allow Bar access
    // Wait, the regular user can't query "Events.bar_password"!
    // The bar needs to authenticate. But how?
    // We can query Events where code = code and bar_password = password.
    // We must ensure the RLS allows querying Events by code and bar_password.
    // By default "Events" table is visible to everyone for SELECT!
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('bar_password', password.trim())
      .single()

    if (error || !data) {
       setErrorMsg('Código de evento o contraseña incorrectos.')
    } else {
       setEventData(data)
    }
    setLoading(false)
  }

  const handleLogout = () => {
     setEventData(null)
     setCode('')
     setPassword('')
  }

  if (eventData) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
           <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                 <h1 className="text-xl font-bold text-gray-800">BAR: {eventData.name}</h1>
                 <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Conectado exitosamente</p>
              </div>
              <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-lg">Salir</button>
           </header>
           <main className="flex-1 p-6">
              <BarPortal event={eventData} />
           </main>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-black text-white mb-2 text-center tracking-tight">🍷 Portal de Barra</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Ingresa las credenciales de tu evento para validar tragos</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Código del Evento</label>
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-color-1)] uppercase tracking-wider" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Contraseña de Barra</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-color-1)]" 
              required
            />
          </div>
          
          {errorMsg && <p className="text-red-400 text-sm font-medium mt-2">{errorMsg}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--theme-color-1)] hover:bg-[var(--theme-color-1)]/90 text-white font-bold py-3 rounded-lg mt-4 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar a la Barra'}
          </button>
        </form>
      </div>
    </div>
  )
}

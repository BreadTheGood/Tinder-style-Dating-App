import { useState, useEffect } from 'react'
import { managerSupabase as supabase } from './lib/managerSupabase'
import { BarPortal } from './screens/manager/BarPortal'

export function BarApp() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [eventData, setEventData] = useState<any>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const sessionStr = localStorage.getItem('bar_session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        if (Date.now() - session.lastActivity < 2 * 60 * 60 * 1000) {
          setEventData(session.eventData)
        } else {
          localStorage.removeItem('bar_session')
        }
      } catch (e) {
        localStorage.removeItem('bar_session')
      }
    }
    setIsInitializing(false)
  }, [])

  useEffect(() => {
    if (!eventData) return

    const updateActivity = () => {
      localStorage.setItem('bar_session', JSON.stringify({
         eventData,
         lastActivity: Date.now()
      }))
    }
    
    let lastUpdate = Date.now()
    const handleActivity = () => {
       if (Date.now() - lastUpdate > 60000) {
          updateActivity()
          lastUpdate = Date.now()
       }
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [eventData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !password) return
    setLoading(true)
    setErrorMsg('')

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
       localStorage.setItem('bar_session', JSON.stringify({
          eventData: data,
          lastActivity: Date.now()
       }))
    }
    setLoading(false)
  }

  const handleLogout = () => {
     setEventData(null)
     setCode('')
     setPassword('')
     localStorage.removeItem('bar_session')
  }

  if (isInitializing) {
     return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white font-bold">Cargando barra...</div>
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

import { useState } from 'react'
import { managerSupabase as supabase } from '../../lib/managerSupabase'

export function ManagerLoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({
       email,
       password
    })

    if (error) {
       setError(error.message)
       setLoading(false)
    }
    // Si tiene éxito, el onAuthStateChange de ManagerApp lo atrapará
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white">Portal de Managers</h2>
            <p className="text-gray-400 mt-2 text-sm">Inicia sesión para gestionar eventos</p>
          </div>
          
          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-color-1)]"
                placeholder="manager@app.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-color-1)]"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--theme-color-1)] to-[var(--theme-color-2)] text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { EyeIcon, FireIcon } from '../components/icons'
import { supabase } from '../lib/supabase'

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'ticket-code' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAuth = async () => {
    if (mode === 'login' || mode === 'register') {
      setLoading(true)
      setErrorMsg('')
      
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }
      } else {
        if (password !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden')
          setLoading(false)
          return
        }
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }
        // If sign up is successful, Supabase might require email confirmation depending on your settings.
        // If it doesn't, it will log the user in automatically.
      }

      setLoading(false)
      onLogin() // Proceed to the app
    } else {
      // Logic for ticket code
      onLogin() 
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#0d0d0f' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f304eb 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #b004f3 0%, transparent 70%)' }} />
      </div>

      <div className="relative flex flex-col items-center pt-16 pb-8 px-8">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-5 shadow-lg" style={{ boxShadow: '0 8px 32px rgba(255,62,108,0.4)' }}>
          <FireIcon size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">
          <span className="gradient-brand-text">swiper</span>
        </h1>
        <p className="text-sm text-white/40 font-medium tracking-wide">Swipea. Matchea. Conecta.</p>
      </div>

      <div className="relative flex-1 flex flex-col justify-start mx-5">
        <div className="glass rounded-3xl p-6 pb-8">
          {mode !== 'register' && (
            <div className="flex rounded-xl overflow-hidden mb-7" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {(['login', 'ticket-code'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-3 text-sm font-semibold transition-all duration-200"
                  style={mode === m ? { background: 'linear-gradient(135deg,#f304eb,#b004f3)', color: '#fff', borderRadius: 10 } : { color: 'rgba(255,255,255,0.4)' }}
                >
                  {m === 'login' ? 'Iniciar sesión' : 'Usar código'}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {mode === 'ticket-code' && (
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Codigo</label>
                <input
                  type="text"
                  placeholder="Ingresa el codigo de tu entrada"
                  className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            )}
          </div>

          {(mode === 'login' || mode === 'register') && (
            <>
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgb(249, 8, 165)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(165, 2, 183, 0.08)')}
                />
              </div>

              <br />

              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <button onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    <EyeIcon size={16} />
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <br />
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Confirmar Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <button className="text-xs font-semibold mt-3 block gradient-brand-text">¿Olvidaste tu contraseña?</button>
              )}
            </>
          )}

          {errorMsg && <p className="text-red-500 text-xs text-center mt-2">{errorMsg}</p>}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)', boxShadow: '0 8px 24px rgba(249, 0, 220, 0.35)' }}
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Crear cuenta' : 'Ingresar con código'}
          </button>
          
          {mode === 'login' && (
            <button onClick={() => setMode('register')} className="w-full mt-4 text-xs font-semibold text-white/50 hover:text-white transition-colors">
              ¿No tienes cuenta? <span className="gradient-brand-text">Regístrate</span>
            </button>
          )}
          {mode === 'register' && (
            <button onClick={() => setMode('login')} className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all">
              Volver
            </button>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6 pb-8 leading-relaxed">
          Al continuar, aceptas nuestros{' '}
          <span className="gradient-brand-text font-semibold">Términos de uso</span>{' '}
          y{' '}
          <span className="gradient-brand-text font-semibold">Política de privacidad</span>
        </p>
      </div>
    </div>
  )
}

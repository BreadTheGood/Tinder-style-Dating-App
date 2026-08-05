import { useState } from 'react'
import { EyeIcon, FireIcon } from '../components/icons'
import { supabase } from '../lib/supabase'

export function LoginScreen({ onLogin }: { onLogin: (requiresPassword?: boolean) => void }) {
  const [mode, setMode] = useState<'login' | 'ticket-code' | 'register'>('login')
  const [ticketCode, setTicketCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Flotante de contraseña para código de evento
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [modalPassword, setModalPassword] = useState('')
  const [validEvent, setValidEvent] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const handleAuth = async () => {
    setErrorMsg('')
    
    if (mode === 'login' || mode === 'register') {
      if (!email || !email.includes('@')) {
        setErrorMsg('Por favor, ingresa un email válido.')
        return
      }
      if (!password) {
        setErrorMsg('Por favor, ingresa tu contraseña.')
        return
      }

      setLoading(true)
      
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setErrorMsg('Credenciales incorrectas. Verifica tu email y contraseña.')
          setLoading(false)
          return
        }
      } else {
        if (password !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }
      }

      setLoading(false)
      onLogin()
    } else {
      // Modo: Usar Código de Evento
      if (!ticketCode.trim()) {
        setErrorMsg('Por favor, ingresa el código del evento.')
        return
      }
      if (!email || !email.includes('@')) {
        setErrorMsg('Por favor, ingresa un email válido.')
        return
      }

      setLoading(true)
      const cleanCode = ticketCode.trim().toUpperCase()

      // Validar el código de evento en Supabase real
      const { data: eventData, error: eventErr } = await supabase
        .from('Events')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle()

      if (eventErr || !eventData) {
        setErrorMsg('Código de evento no válido o inexistente.')
        setLoading(false)
        return
      }

      if (eventData.is_suspended) {
        setErrorMsg('Este evento se encuentra suspendido actualmente.')
        setLoading(false)
        return
      }

      if (eventData.end_datetime && new Date(eventData.end_datetime).getTime() <= Date.now()) {
        setErrorMsg('Este evento ya ha finalizado.')
        setLoading(false)
        return
      }

      // El código es válido: Abrir el Flotante para pedir la Contraseña
      setValidEvent(eventData)
      setModalError('')
      setModalPassword('')
      setShowPasswordModal(true)
      setLoading(false)
    }
  }

  const handleConfirmCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalPassword) {
      setModalError('Por favor, ingresa una contraseña.')
      return
    }

    setModalLoading(true)
    setModalError('')

    // 1. Intentar iniciar sesión
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: modalPassword
    })

    if (!signInErr && signInData.session) {
       // Usuario existente inició sesión
       await joinEventAfterLogin(signInData.session.user.id, validEvent.id)
       setModalLoading(false)
       setShowPasswordModal(false)
       onLogin()
       return
    }

    // 2. Si falló el inicio de sesión, intentar registrar como nuevo usuario
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: modalPassword
    })

    if (signUpErr) {
       if (signUpErr.message.toLowerCase().includes('already registered')) {
          setModalError('Contraseña incorrecta. Ya existe una cuenta registrada con este correo.')
       } else {
          setModalError('Error: ' + signUpErr.message)
       }
       setModalLoading(false)
       return
    }

    if (signUpData.session) {
       await joinEventAfterLogin(signUpData.session.user.id, validEvent.id)
       setModalLoading(false)
       setShowPasswordModal(false)
       onLogin()
    } else {
       // Si requiere confirmación de email
       setModalError('Registro iniciado. Por favor verifica tu correo para ingresar.')
       setModalLoading(false)
    }
  }

  const joinEventAfterLogin = async (userId: string, eventId: string) => {
    try {
      const { data: profile } = await supabase.from('Profiles').select('id').eq('user_id', userId).maybeSingle()
      if (profile) {
        await supabase.from('ProfileEvents').insert({
          profile_id: profile.id,
          event_id: eventId
        })
      }
    } catch {
      // Ignorar errores si ya estaba unido
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
          <span className="gradient-brand-text notranslate" translate="no">swiper</span>
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
                  onClick={() => { setMode(m); setErrorMsg(''); }}
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
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Código del evento</label>
                  <input
                    type="text"
                    placeholder="Ej. ABC123"
                    value={ticketCode}
                    onChange={e => setTicketCode(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all uppercase"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
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

          {errorMsg && <p className="text-red-500 text-xs text-center mt-3">{errorMsg}</p>}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)', boxShadow: '0 8px 24px rgba(249, 0, 220, 0.35)' }}
          >
            {loading ? 'Validando...' : mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Crear cuenta' : 'Ingresar con código'}
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

      {/* Flotante (Modal) para ingresar Contraseña al usar Código */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-white/10" style={{ background: '#18181f' }}>
             <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[#f304eb] to-[#ff7043] text-white uppercase tracking-wider">
                  {validEvent?.name || 'Evento'}
                </span>
             </div>
             
             <h3 className="text-xl font-extrabold text-white mb-1">Ingresa tu contraseña</h3>
             <p className="text-xs text-white/60 mb-5 leading-relaxed">
               Accediendo con <span className="text-white font-semibold">{email}</span> al evento <span className="text-[#ff6b8a] font-semibold">{validEvent?.name}</span>.
             </p>

             <form onSubmit={handleConfirmCodeLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 block">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="••••••••"
                      value={modalPassword}
                      onChange={(e) => setModalPassword(e.target.value)}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      <EyeIcon size={16} />
                    </button>
                  </div>
                </div>

                {modalError && (
                  <p className="text-red-400 text-xs font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{modalError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-white/70 text-sm hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)', boxShadow: '0 4px 16px rgba(249, 0, 220, 0.3)' }}
                  >
                    {modalLoading ? 'Ingresando...' : 'Confirmar'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}

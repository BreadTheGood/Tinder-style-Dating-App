import { useState } from 'react'
import { EyeIcon } from '../components/icons'
import { supabase } from '../lib/supabase'
import { LegalModal } from '../components/LegalModal'

export function LoginScreen({ onLogin }: { onLogin: (requiresPassword?: boolean) => void }) {
  const [mode, setMode] = useState<'login' | 'ticket-code' | 'register'>('login')
  const [ticketCode, setTicketCode] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showLegalModal, setShowLegalModal] = useState<'terms' | 'privacy' | null>(null)

  // Flotante de contraseña para código de evento
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [modalStep, setModalStep] = useState<'email' | 'password'>('email')
  const [modalPassword, setModalPassword] = useState('')
  const [validEvent, setValidEvent] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Flotante de recuperación de contraseña
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)

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
        const { data: userExists } = await supabase.rpc('check_email_exists', { user_email: email })
        if (!userExists) {
          setErrorMsg('Este email no está registrado.')
          setLoading(false)
          return
        }

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
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin + window.location.pathname
          }
        })
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setErrorMsg('Este email ya está registrado.')
          setLoading(false)
          return
        }
        if (!data.session) {
          // Email confirmation is required
          window.dispatchEvent(new CustomEvent('app-toast', { 
            detail: { 
              title: 'Revisa tu correo', 
              body: 'Te hemos enviado un enlace para confirmar tu cuenta. Ábrelo para poder iniciar sesión.' 
            } 
          }))
          setMode('login')
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

      setLoading(true)
      const cleanCode = ticketCode.trim().toUpperCase()

      let eventData = null
      let matchedTicket = null

      // 1. Buscar en TicketCodes
      const { data: ticketData, error: ticketErr } = await supabase
        .from('TicketCodes')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle()

      if (ticketErr && ticketErr.code !== 'PGRST116') {
         console.error('Error TicketCodes:', ticketErr)
      }

      // 2. Buscar directo en Events
      const { data: eData, error: eErr } = await supabase
        .from('Events')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle()

      if (eErr && eErr.code !== 'PGRST116') {
         console.error('Error Events:', eErr)
      }

      if (ticketData) {
         if (ticketData.is_redeemed) {
            setErrorMsg('Este ticket ya ha sido reclamado.')
            setLoading(false)
            return
         }
         
         // Buscar el evento asociado a este ticket
         const { data: relatedEvent } = await supabase
           .from('Events')
           .select('*')
           .eq('id', ticketData.event_id)
           .maybeSingle()

         if (relatedEvent) {
            eventData = relatedEvent
            matchedTicket = ticketData
         } else {
            setErrorMsg('El evento de este ticket ya no existe.')
            setLoading(false)
            return
         }
      } else if (eData) {
         eventData = eData
      } else {
         setErrorMsg('Código no válido o inexistente.')
         setLoading(false)
         return
      }

      if (eventData.status !== 'en curso') {
        setErrorMsg('Este evento no se encuentra activo ("en curso").')
        setLoading(false)
        return
      }

      if (eventData.end_datetime && new Date(eventData.end_datetime).getTime() <= Date.now()) {
        setErrorMsg('Este evento ya ha finalizado por horario.')
        setLoading(false)
        return
      }

      // El código es válido: Abrir el Flotante para pedir Email
      setValidEvent(eventData)
      setModalError('')
      setModalStep('email')
      // Store matched ticket in a ref or state if needed for later redemption
      ;(window as any)._matchedTicket = matchedTicket
      setShowPasswordModal(true)
      setLoading(false)
    }
  }

  const handleModalEmailNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setModalError('Por favor, ingresa un email válido.')
      return
    }

    setModalLoading(true)
    setModalError('')

    const { data: userExists } = await supabase.rpc('check_email_exists', { user_email: email })
    
    setModalLoading(false)
    
    if (userExists) {
       setModalStep('password')
    } else {
       setShowPasswordModal(false)
       setMode('register')
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

    setModalError('Contraseña incorrecta.')
    setModalLoading(false)
  }

  const joinEventAfterLogin = async (userId: string, eventId: string) => {
    try {
      const { data: profile } = await supabase.from('Profiles').select('id').eq('user_id', userId).maybeSingle()
      if (profile) {
        await supabase.from('ProfileEvents').insert({
          profile_id: profile.id,
          event_id: eventId
        })
        
        // Redimir el ticket si se usó uno
        const matchedTicket = (window as any)._matchedTicket
        if (matchedTicket) {
           await supabase.from('TicketCodes').update({ is_redeemed: true }).eq('id', matchedTicket.id)
           ;(window as any)._matchedTicket = null
        }
      }
    } catch {
      // Ignorar errores si ya estaba unido
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Ingresa un email válido.')
      setForgotLoading(false)
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + window.location.pathname
    })
    if (error) {
      setForgotError(error.message)
    } else {
      setForgotSuccess(true)
    }
    
    setForgotLoading(false)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden overflow-y-auto custom-scrollbar" style={{ background: '#0d0d0f' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, var(--theme-color-1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, var(--theme-color-2) 0%, transparent 70%)' }} />
      </div>

      <div className="relative flex flex-col items-center pt-16 pb-8 px-8">
        <h1 className="text-4xl font-extrabold tracking-[0.2em] mb-1 mt-6">
          <span className="gradient-brand-text notranslate" translate="no">G I R A</span>
        </h1>
        <p className="text-sm text-white/40 font-medium tracking-wide">Conectá. Matcheá. Girá.</p>
      </div>

      <div className="relative flex-1 flex flex-col justify-start mx-5">
        <div className="glass rounded-3xl p-6 pb-8">
          {mode !== 'register' && (
            <div className="flex rounded-xl overflow-hidden mb-7" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {(['login', 'ticket-code'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrorMsg(''); }}
                  className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${mode === m ? 'gradient-brand text-white' : 'text-white/40'}`}
                  style={mode === m ? { borderRadius: 10 } : {}}
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
                    className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all uppercase focus:border-[var(--theme-color-1)] border border-transparent"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
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
                  className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all focus:border-[var(--theme-color-1)] border border-transparent"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
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
                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all focus:border-[var(--theme-color-1)] border border-transparent"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
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
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Confirmar contraseña</label>
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
                <button 
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotSuccess(false)
                    setForgotError('')
                    setShowForgotModal(true)
                  }}
                  className="text-xs font-semibold mt-3 block text-[var(--theme-color-1)]"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </>
          )}

          {errorMsg && <p className="text-red-500 text-xs text-center mt-3">{errorMsg}</p>}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50 gradient-brand"
            style={{ boxShadow: '0 8px 24px color-mix(in srgb, var(--theme-color-1) 35%, transparent)' }}
          >
            {loading ? 'Validando...' : mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Crear cuenta' : 'Ingresar con código'}
          </button>
          
          {mode === 'login' && (
            <button onClick={() => setMode('register')} className="w-full mt-4 text-xs font-semibold text-white/50 hover:text-white transition-colors">
              ¿No tienes cuenta? <span className="text-[var(--theme-color-1)]">Regístrate</span>
            </button>
          )}
          {mode === 'register' && (
            <button onClick={() => setMode('login')} className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all">
              Volver
            </button>
          )}
        </div>

        <div className="text-center text-xs text-white/20 mt-8 leading-relaxed">
          Al continuar, aceptas nuestros{' '}
          <button type="button" onClick={() => setShowLegalModal('terms')} className="text-[var(--theme-color-1)] font-semibold hover:underline cursor-pointer relative z-20">Términos de uso</button>{' '}
          y{' '}
          <button type="button" onClick={() => setShowLegalModal('privacy')} className="text-[var(--theme-color-1)] font-semibold hover:underline cursor-pointer relative z-20">Política de privacidad</button>
        </div>

        <div className="text-center text-xs text-white/40 mt-6 pb-8 leading-relaxed font-medium">
          <a href="mailto:contacto@gira.app" className="text-[var(--theme-color-1)] font-bold hover:underline cursor-pointer relative z-20">
            Contactanos
          </a>
        </div>
      </div>

      {/* Flotante (Modal) para ingresar Contraseña al usar Código */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-white/10" style={{ background: '#18181f' }}>
             <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[var(--theme-color-1)] to-[var(--theme-color-2)] text-white uppercase tracking-wider">
                  {validEvent?.name || 'Evento'}
                </span>
             </div>
             
             <h3 className="text-xl font-extrabold text-white mb-1">{modalStep === 'email' ? 'Ingresa tu email' : 'Ingresa tu contraseña'}</h3>
             {modalStep === 'email' ? (
               <form onSubmit={handleModalEmailNext} className="space-y-4">
                 <div>
                   <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 block">Tu email</label>
                   <input
                     type="email"
                     required
                     autoFocus
                     placeholder="tu@email.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                     style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                   />
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
                     className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 gradient-brand"
                   >
                     {modalLoading ? 'Buscando...' : 'Siguiente'}
                   </button>
                 </div>
               </form>
             ) : (
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
                      onClick={() => setModalStep('email')}
                      className="flex-1 py-3.5 rounded-xl font-semibold text-white/70 text-sm hover:bg-white/5 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 gradient-brand"
                    >
                      {modalLoading ? 'Entrando...' : 'Ingresar'}
                    </button>
                  </div>
               </form>
             )}
          </div>
        </div>
      )}

      {/* Flotante (Modal) para Recuperar Contraseña */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-white/10" style={{ background: '#18181f' }}>
             <h3 className="text-xl font-extrabold text-white mb-4">Recuperar contraseña</h3>

             {forgotSuccess ? (
                <div className="text-center py-4">
                   <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <p className="text-sm text-white/80 font-medium mb-6">
                     Te hemos enviado un correo con un enlace. Haz clic en él para crear tu nueva contraseña.
                   </p>
                   <button
                     type="button"
                     onClick={() => setShowForgotModal(false)}
                     className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 gradient-brand"
                   >
                     Entendido
                   </button>
                </div>
             ) : (
               <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 block">Email registrado</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="tu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>

                  {forgotError && (
                    <p className="text-red-400 text-xs font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{forgotError}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3.5 rounded-xl font-semibold text-white/70 text-sm hover:bg-white/5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 gradient-brand"
                    >
                      {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                  </div>
               </form>
             )}
          </div>
        </div>
      )}

      {showLegalModal && (
        <LegalModal 
          type={showLegalModal} 
          onClose={() => setShowLegalModal(null)} 
        />
      )}
    </div>
  )
}

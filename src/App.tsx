import { useEffect, useState, useRef } from 'react'
import { BottomNav } from './components/BottomNav'
import { ChatScreen } from './screens/ChatScreen'
import { LoginScreen } from './screens/LoginScreen'
import { MatchModal } from './screens/MatchModal'
import { ViewProfileModal } from './screens/ViewProfileModal'
import { MessagesScreen } from './screens/MessagesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { EditProfileScreen } from './screens/EditProfileScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { SwipeScreen } from './screens/SwipeScreen'
import { loadAppData, mockAppDataService } from './services/appDataService'
import { supabaseAppDataService } from './services/supabaseAppDataService'
import type { Conversation, Profile, Screen, UserProfile, Message } from './types'
import { supabase } from './lib/supabase'

import { audio } from './utils/audio'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [navTab, setNavTab] = useState<'swipe' | 'messages' | 'profile'>('swipe')
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [toastMessage, setToastMessage] = useState<{title: string; body: string; image?: string} | null>(null)
  
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryConfirm, setRecoveryConfirm] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  
  const activeChatIdRef = useRef<string | number | null>(null)
  const currentUserRef = useRef<UserProfile | null>(null)

  useEffect(() => {
     activeChatIdRef.current = (screen === 'chat' && activeConversation) ? (activeConversation.id || null) : null
  }, [screen, activeConversation])

  useEffect(() => {
     currentUserRef.current = currentUser
  }, [currentUser])



  const loadUserData = async (userId: string) => {
    console.log('[loadUserData] Starting for', userId)
    try {
      console.log('[loadUserData] Checking if manager...')
      // 1. Evitar que un manager ingrese a la app de usuarios
      const { data: managerData, error: managerErr } = await supabase.from('Managers').select('id').eq('id', userId).maybeSingle()
      if (managerErr && managerErr.code !== 'PGRST116') {
         console.warn('[loadUserData] Manager check error:', managerErr)
      }
      if (managerData) {
         console.log('[loadUserData] User is manager, redirecting...')
         // Usar URL absoluta para GitHub Pages
         window.location.href = window.location.origin + window.location.pathname + '?manage=true'
         return
      }

      console.log('[loadUserData] Fetching app data...')
      // Timeout de 7 segundos para evitar carga infinita si la red se cuelga
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('El tiempo de espera ha caducado.')), 7000)
      )

      const snap = await Promise.race([
        loadAppData(supabaseAppDataService),
        timeoutPromise
      ])
      
      console.log('[loadUserData] App data loaded:', snap ? 'SUCCESS' : 'NULL')

        if (snap && snap.currentUser) {
          setProfiles(snap.profiles)
          setConversations(snap.conversations)
          setCurrentUser(snap.currentUser)

          const pendingEventCode = localStorage.getItem('pending_join_event_code')
          if (pendingEventCode && supabaseAppDataService.joinEvent) {
             localStorage.removeItem('pending_join_event_code')
             supabaseAppDataService.joinEvent(pendingEventCode).then(res => {
                if (res.success) {
                   window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Exito!', body: 'Te has unido al evento exitosamente.' } }))
                } else if (res.error !== 'Ya estabas unido a este evento') {
                   window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Aviso', body: res.error } }))
                }
             })
          }

          if (!snap.currentUser.images || snap.currentUser.images.length === 0) {
          console.log('[loadUserData] No images, routing to onboarding')
          setScreen('onboarding')
          setNavTab('profile')
        } else {
          console.log('[loadUserData] Routing to swipe')
          setScreen('swipe')
          setNavTab('swipe')
        }
      } else {
        throw new Error('No se pudo cargar el perfil del usuario.')
      }
    } catch (err: any) {
      console.error('[loadUserData] Error:', err)
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { title: 'Error de Carga', body: err.message || 'Error al conectar con la base de datos.' } 
      }))
      setScreen('login')
    } finally {
      console.log('[loadUserData] Finally, setting isLoading to false')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    // Timeout máximo global de seguridad (8s) para asegurar que NUNCA quede en pantalla de carga
    const globalLoadingGuard = setTimeout(() => {
      if (mounted) {
        setIsLoading(loading => {
          if (loading) {
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Atención', body: 'Conexión lenta. Por favor, intenta de nuevo.' } }))
          }
          return false
        })
      }
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      console.log('[AuthEvent]', event, 'Session ID:', session?.user?.id)

      if (event === 'PASSWORD_RECOVERY') {
        setShowRecoveryModal(true)
      }

      if (event === 'SIGNED_OUT') {
        console.log('[AuthEvent] Signed out, loading mock data...')
        const mockSnap = await loadAppData(mockAppDataService).catch(() => null)
        if (mounted && mockSnap) {
          setProfiles(mockSnap.profiles)
          setConversations(mockSnap.conversations)
        }
        setCurrentUser(null)
        setScreen('login')
        setIsLoading(false)
        return
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session) {
          if (!currentUserRef.current) {
            console.log('[AuthEvent] Starting loadUserData for', session.user.id)
            setIsLoading(true)
            await loadUserData(session.user.id)
          }
        } else {
          console.log('[AuthEvent] No session, loading mock data...')
          const mockSnap = await loadAppData(mockAppDataService).catch(() => null)
          if (mounted && mockSnap) {
            setProfiles(mockSnap.profiles)
            setConversations(mockSnap.conversations)
          }
          setCurrentUser(null)
          setScreen('login')
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(globalLoadingGuard)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleToast = (e: any) => {
       setToastMessage(e.detail)
       setTimeout(() => setToastMessage(null), 4000)
    }
    const handleReload = async () => {
       if (currentUser) {
         const snap = await loadAppData(supabaseAppDataService).catch(() => null)
         if (snap) {
           setProfiles(snap.profiles)
           setConversations(snap.conversations)
           setActiveConversation(prev => {
              if (prev) {
                 return snap.conversations.find((c: Conversation) => c.id === prev.id) || prev
              }
              return prev
           })
         }
       }
    }
    const handleMatchDeleted = (e: any) => {
       if (activeChatIdRef.current === e.detail.matchId) {
          setScreen('messages')
          setActiveConversation(null)
          setToastMessage({ title: 'Chat eliminado', body: 'El match o evento ha finalizado.' })
       }
    }
    window.addEventListener('app-toast', handleToast)
    window.addEventListener('app-reload-data', handleReload)
    window.addEventListener('app-match-deleted', handleMatchDeleted)

    const interval = setInterval(() => {
       handleReload()
    }, 60000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('app-toast', handleToast)
      window.removeEventListener('app-reload-data', handleReload)
      window.removeEventListener('app-match-deleted', handleMatchDeleted)
    }
  }, [currentUser])

  // Listen for real-time matches
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('public:Matches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Matches' }, async (payload) => {
        const match = payload.new
        if (match.profile1_id === currentUser.id || match.profile2_id === currentUser.id) {
          const otherId = match.profile1_id === currentUser.id ? match.profile2_id : match.profile1_id
          const { data: otherProfile } = await supabase.from('Profiles').select('*, Photos(*)').eq('id', otherId).single()
          
          if (otherProfile) {
            const photos = otherProfile.Photos ? otherProfile.Photos.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []
            const images = photos.map((img: any) => img.photo_url)

            let age = 25
            if (otherProfile.birthdate) {
               const diff = Date.now() - new Date(otherProfile.birthdate).getTime()
               age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
            }

            const mappedProfile: Profile = {
              id: otherProfile.id,
              name: otherProfile.name || 'Usuario',
              age: age,
              bio: otherProfile.bio || '',
              distance: 'Cerca',
              job: '',
              image: images.length > 0 ? images[0] : 'https://placehold.co/600x700?text=Sin+Foto',
              images: images,
              tags: otherProfile.tags || []
            }
            
            setConversations(prev => {
              if (prev.find(c => c.id === match.id)) return prev
              return [{ id: match.id, profile: mappedProfile, messages: [], unread: 0 }, ...prev]
            })

            // Show Match Modal solo si nosotros NO fuimos los que swipeamos (para evitar doble modal)
            if (match.profile2_id === currentUser.id) {
               audio.playMatch()
               setMatchedProfile(mappedProfile)
               window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: '¡Nuevo Match!', body: `Has hecho match con ${mappedProfile.name}`, image: mappedProfile.image } }))
            }
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'Matches' }, (payload) => {
        const deletedMatch = payload.old
        if (deletedMatch) {
           setConversations(prev => {
             const newConvs = prev.filter(c => c.id !== deletedMatch.id)
             if (newConvs.length !== prev.length) {
                window.dispatchEvent(new CustomEvent('app-match-deleted', { detail: { matchId: deletedMatch.id } }))
             }
             return newConvs
           })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Blocks' }, () => {
        window.dispatchEvent(new CustomEvent('app-reload-data'))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // Listen for real-time messages
  useEffect(() => {
    if (!currentUser || conversations.length === 0) return

    const channel = supabase
      .channel('public:Messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Messages' }, payload => {
        const newMessage = payload.new
        
        if (newMessage.sender_id === currentUser.id) return

        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === newMessage.match_id) {
              if (conv.blockedByMe) return conv;
              const msg: Message = {
                id: newMessage.id,
                text: newMessage.content,
                from: 'them',
                time: new Date(newMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
              
              // Only append if it doesn't already exist
              if (!conv.messages.find(m => m.id === msg.id)) {
                 const isUserInThisChat = activeChatIdRef.current === conv.id
                 
                 if (msg.text.includes('DRINK-')) {
                    audio.playDrink()
                 } else {
                    audio.playReceive()
                 }

                 if (!isUserInThisChat) {
                    window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: conv.profile.name, body: msg.text, image: conv.profile.image } }))
                 }
                 
                 return {
                   ...conv,
                   messages: [...conv.messages, msg],
                   unread: !isUserInThisChat ? conv.unread + 1 : conv.unread
                 }
              }
            }
            return conv
          })
          
          if (!prev.find(c => c.id === newMessage.match_id)) {
             window.dispatchEvent(new CustomEvent('app-reload-data'))
          }
          
          return updated
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, conversations.length])

  // Keep active conversation in sync
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find(c => c.id === activeConversation.id)
      if (updated && updated.messages.length !== activeConversation.messages.length) {
        setActiveConversation(updated)
      }
    }
  }, [conversations, activeConversation?.id])

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  const go = (s: Screen) => setScreen(s)


  const handleMatchMessage = () => {
    setMatchedProfile(null)
    if (matchedProfile) {
      const convo = conversations.find((c) => c.profile.id === matchedProfile.id) || conversations[0]
      setActiveConversation(convo)
      setNavTab('messages')
      go('chat')
    }
  }

  const handleOpenChat = (c: Conversation) => {
    setConversations((prev) => prev.map((cv) => (cv.profile.id === c.profile.id ? { ...cv, unread: 0 } : cv)))
    setActiveConversation(c)
    go('chat')
  }

  const handleNavChange = (s: 'swipe' | 'messages' | 'profile') => {
    setNavTab(s)
    go(s)
    setActiveConversation(null) // Si tocamos la barra inferior, salimos de cualquier chat
  }

  const showNav = !isLoading && screen !== 'login' && screen !== 'chat' && screen !== 'onboarding'

  const renderScreen = () => {
    if (isLoading) {
      return (
        <div className="relative h-full flex flex-col items-center justify-center overflow-hidden" style={{ background: '#0d0d0f' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, var(--theme-color-1) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, var(--theme-color-2) 0%, transparent 70%)' }} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-[0.2em] mb-2 mt-8">
            <span className="gradient-brand-text notranslate" translate="no">G I R A</span>
          </h1>
          <p className="text-xs text-white/40 font-semibold tracking-widest uppercase animate-pulse">Cargando...</p>
        </div>
      )
    }

    switch (screen) {
      case 'login':
        return (
          <LoginScreen 
            onLogin={(requires) => {
              setRequiresPassword(!!requires)
            }} 
          />
        )
      case 'swipe':
        return <SwipeScreen profiles={profiles} isLoading={isLoading} onMatchLocally={(profile, matchId) => {
          setConversations(prev => {
            if (prev.find(c => c.id === matchId)) return prev
            return [{ id: matchId, profile, messages: [], unread: 0 }, ...prev]
          })
          setMatchedProfile(profile)
        }} onSwipe={(id) => {
          setProfiles(prev => prev.filter(p => p.id !== id))
        }} onViewProfile={(p) => setViewingProfile(p)} />
      case 'messages':
        return <MessagesScreen conversations={conversations} onOpenChat={handleOpenChat} onViewProfile={(p) => setViewingProfile(p)} />
      case 'chat':
        return activeConversation ? (
          <ChatScreen
            conversation={activeConversation}
            onBack={() => { setActiveConversation(null); go('messages'); setNavTab('messages') }}
            onUpdate={(msgs) => {
              setConversations((prev) => prev.map((c) => (c.profile.id === activeConversation.profile.id ? { ...c, messages: msgs } : c)))
              setActiveConversation((a) => (a ? { ...a, messages: msgs } : a))
            }}
            onViewProfile={(p) => setViewingProfile(p)}
          />
        ) : null
      case 'profile':
        return currentUser ? <ProfileScreen user={currentUser} onEdit={() => go('edit_profile')} /> : null
      case 'edit_profile':
        return currentUser ? (
          <EditProfileScreen
            user={currentUser}
            onBack={() => go('profile')}
            onSave={async (data) => {
              const { data: { session } } = await supabase.auth.getSession()
              const service = session ? supabaseAppDataService : mockAppDataService
              const success = await service.updateProfile?.(data)
              if (success) {
                setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev))
                go('profile')
              }
            }}
          />
        ) : null
      case 'onboarding':
        return currentUser ? (
          <OnboardingScreen
            user={currentUser}
            requiresPassword={requiresPassword}
            onComplete={async (data, password, files) => {
              try {
                if (requiresPassword && password) {
                  const { error } = await supabase.auth.updateUser({ password })
                  if (error) return 'Error al actualizar contraseña: ' + error.message
                }
                
                const uploadedUrls = []
                for (const f of files || []) {
                  const url = await supabaseAppDataService.uploadPhoto!(f)
                  if (url) uploadedUrls.push(url)
                }
                
                // Append existing images if editing
                data.images = [...(currentUser.images || []), ...uploadedUrls]

                const success = await supabaseAppDataService.updateProfile?.(data)
                if (success) {
                  setRequiresPassword(false)
                  setIsLoading(true)
                  const { data: { session } } = await supabase.auth.getSession()
                  if (session) {
                    await loadUserData(session.user.id)
                  } else {
                    setIsLoading(false)
                    setScreen('swipe')
                    setNavTab('swipe')
                  }
                } else {
                  return 'Error al actualizar el perfil'
                }
              } catch (err: any) {
                return err.message
              }
            }}
          />
        ) : null
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#050507' }}>
      <div className="relative w-full max-w-[390px] h-full max-h-[844px] overflow-hidden" style={{ background: '#0d0d0f' }}>
        
        {/* Global Toast Notification */}
        <div 
          className={`absolute top-6 left-4 right-4 z-[9999] transition-all duration-500 ease-in-out ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}
        >
          {toastMessage && (
            <div 
              className="p-3.5 rounded-2xl flex items-center gap-3.5 shadow-2xl cursor-pointer"
              style={{ background: 'rgba(30,30,35,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
              onClick={() => {
                 setToastMessage(null)
                 const conv = conversations.find(c => c.profile.name === toastMessage.title)
                 if (conv) handleOpenChat(conv)
              }}
            >
              {toastMessage.image ? (
                <img src={toastMessage.image} alt={toastMessage.title} className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid rgba(255,62,108,0.5)' }} />
              ) : (
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shadow-lg">
                  <span className="text-white font-extrabold text-lg">!</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm mb-0.5">{toastMessage.title}</p>
                <p className="text-white/70 text-xs font-medium truncate">{toastMessage.body}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-[var(--theme-color-1)] flex-shrink-0" />
            </div>
          )}
        </div>

        {showRecoveryModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-white/10" style={{ background: '#18181f' }}>
               <h3 className="text-xl font-extrabold text-white mb-4">Nueva contraseña</h3>
               <p className="text-xs text-white/60 mb-5 leading-relaxed">
                 Has verificado tu correo exitosamente. Por favor ingresa tu nueva contraseña.
               </p>

               <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (recoveryPassword.length < 6) {
                     setRecoveryError('La contraseña debe tener al menos 6 caracteres.')
                     return
                  }
                  if (recoveryPassword !== recoveryConfirm) {
                     setRecoveryError('Las contraseñas no coinciden.')
                     return
                  }
                  setRecoveryLoading(true)
                  setRecoveryError('')
                  const { error } = await supabase.auth.updateUser({ password: recoveryPassword })
                  setRecoveryLoading(false)
                  if (error) {
                     setRecoveryError(error.message)
                  } else {
                     setShowRecoveryModal(false)
                     window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Éxito', body: 'Contraseña actualizada.' } }))
                  }
               }} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 block">Contraseña</label>
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="••••••••"
                      value={recoveryPassword}
                      onChange={(e) => setRecoveryPassword(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5 block">Confirmar</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={recoveryConfirm}
                      onChange={(e) => setRecoveryConfirm(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>

                  {recoveryError && (
                    <p className="text-red-400 text-xs font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{recoveryError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 mt-2 gradient-brand"
                  >
                    {recoveryLoading ? 'Guardando...' : 'Guardar y entrar'}
                  </button>
               </form>
            </div>
          </div>
        )}

        {renderScreen()}

        {showNav && <BottomNav active={navTab} onChange={handleNavChange} unread={totalUnread} />}

        {matchedProfile && currentUser && <MatchModal profile={matchedProfile} currentUser={currentUser} onClose={() => setMatchedProfile(null)} onMessage={handleMatchMessage} />}
        
        {viewingProfile && (
          <ViewProfileModal 
            profile={viewingProfile} 
            onClose={() => setViewingProfile(null)} 
            onMessage={conversations.some(c => c.profile.id === viewingProfile.id) ? () => {
              setViewingProfile(null)
              const convo = conversations.find(c => c.profile.id === viewingProfile.id)
              if (convo) handleOpenChat(convo)
            } : undefined}
          />
        )}
      </div>
    </div>
  )
}


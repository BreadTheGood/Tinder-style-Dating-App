import { useEffect, useState, useRef } from 'react'
import { BottomNav } from './components/BottomNav'
import { ChatScreen } from './screens/ChatScreen'
import { LoginScreen } from './screens/LoginScreen'
import { MatchModal } from './screens/MatchModal'
import { MessagesScreen } from './screens/MessagesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { EditProfileScreen } from './screens/EditProfileScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { SwipeScreen } from './screens/SwipeScreen'
import { loadAppData, mockAppDataService } from './services/appDataService'
import { supabaseAppDataService } from './services/supabaseAppDataService'
import type { Conversation, Profile, Screen, UserProfile, Message } from './types'
import { supabase } from './lib/supabase'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [navTab, setNavTab] = useState<'swipe' | 'messages' | 'profile'>('swipe')
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [toastMessage, setToastMessage] = useState<{title: string; body: string; image?: string} | null>(null)
  
  // Ref para saber exactamente en qué chat está el usuario sin reiniciar el WebSocket
  const activeChatIdRef = useRef<string | number | null>(null)
  useEffect(() => {
     activeChatIdRef.current = (screen === 'chat' && activeConversation) ? (activeConversation.id || null) : null
  }, [screen, activeConversation])

  useEffect(() => {
    let mounted = true

    const hydrate = async () => {
      setIsLoading(true)
      
      // Check current session first
      const { data: { session } } = await supabase.auth.getSession()
      
      let snapshot;
      if (session) {
        // Evitar que un manager ingrese a la app de usuarios
        const { data: managerData } = await supabase.from('Managers').select('id').eq('id', session.user.id).maybeSingle()
        if (managerData) {
           await supabase.auth.signOut()
           setScreen('login')
           setIsLoading(false)
           setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Acceso Denegado', body: 'Las cuentas de Manager deben ingresar por el Portal (/manage).' } }))
           }, 500)
           return
        }

        try {
          snapshot = await loadAppData(supabaseAppDataService)
          // Eliminamos el fallback a perfiles falsos para que la app dependa 100% de la BD real
        } catch (error) {
          console.error("Error loading Supabase data, logging out", error)
          await supabase.auth.signOut()
          setScreen('login')
          setIsLoading(false)
          return
        }
        
        if (mounted) {
          if (snapshot.currentUser && snapshot.currentUser.images.length === 0) {
            setScreen('onboarding')
            setNavTab('profile')
          } else {
            setScreen('swipe')
            setNavTab('swipe')
          }
        }
      } else {
        const mockSnap = await loadAppData(mockAppDataService)
        snapshot = {
          profiles: mockSnap.profiles,
          conversations: mockSnap.conversations,
          currentUser: null as any,
        }
        if (mounted) {
          setScreen('login')
        }
      }
      
      if (!mounted) return
      setProfiles(snapshot.profiles)
      setConversations(snapshot.conversations)
      setCurrentUser(snapshot.currentUser)
      setIsLoading(false)
    }

    hydrate()
    
    // Listen for auth changes (like login or logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Fetch to see if they need onboarding
        const { data: managerData } = await supabase.from('Managers').select('id').eq('id', session.user.id).maybeSingle()
        if (managerData) {
           await supabase.auth.signOut()
           setScreen('login')
           setIsLoading(false)
           setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Acceso Denegado', body: 'Las cuentas de Manager deben ingresar por el Portal (/manage).' } }))
           }, 500)
           return
        }

        const snap = await loadAppData(supabaseAppDataService).catch((err) => {
          console.error("Auth state change fetch error:", err)
          return null
        })
        if (snap) {
          setProfiles(snap.profiles)
          setConversations(snap.conversations)
          setCurrentUser(snap.currentUser)

          if (snap.currentUser && snap.currentUser.images.length === 0) {
            setScreen('onboarding')
            setNavTab('profile')
          } else {
            setScreen('swipe')
            setNavTab('swipe')
          }
        }
        setIsLoading(false)
      } else {
        setScreen('login')
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleToast = (e: any) => {
       setToastMessage(e.detail)
       setTimeout(() => setToastMessage(null), 4000)
    }
    window.addEventListener('app-toast', handleToast)
    return () => window.removeEventListener('app-toast', handleToast)
  }, [])

  // Listen for real-time messages
  useEffect(() => {
    if (!currentUser || conversations.length === 0) return

    const channel = supabase
      .channel('public:Messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Messages' }, payload => {
        const newMessage = payload.new
        
        if (newMessage.sender_id === currentUser.id) return

        setConversations(prev => prev.map(conv => {
          if (conv.id === newMessage.match_id) {
            const msg: Message = {
              id: newMessage.id,
              text: newMessage.content,
              from: 'them',
              time: new Date(newMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            if (!conv.messages.find(m => m.id === msg.id)) {
               const isUserInThisChat = activeChatIdRef.current === conv.id
               
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
        }))
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

  const handleMatch = (p: Profile) => setMatchedProfile(p)

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

  const showNav = screen !== 'login' && screen !== 'chat' && screen !== 'onboarding'

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return (
          <LoginScreen 
            onLogin={(requires) => {
              setRequiresPassword(!!requires)
              setIsLoading(true)
            }} 
          />
        )
      case 'swipe':
        return <SwipeScreen onMatch={handleMatch} conversations={conversations} setConversations={setConversations} profiles={profiles} isLoading={isLoading} />
      case 'messages':
        return <MessagesScreen conversations={conversations} onOpenChat={handleOpenChat} />
      case 'chat':
        return activeConversation ? (
          <ChatScreen
            conversation={activeConversation}
            onBack={() => { setActiveConversation(null); go('messages'); setNavTab('messages') }}
            onUpdate={(msgs) => {
              setConversations((prev) => prev.map((c) => (c.profile.id === activeConversation.profile.id ? { ...c, messages: msgs } : c)))
              setActiveConversation((a) => (a ? { ...a, messages: msgs } : a))
            }}
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
                  setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev))
                  setScreen('swipe')
                  setNavTab('swipe')
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
        
        {/* Notificación Toast (Estilo celular) */}
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
              <div className="w-2 h-2 rounded-full bg-[#f304eb] flex-shrink-0" />
            </div>
          )}
        </div>

        {renderScreen()}

        {showNav && <BottomNav active={navTab} onChange={handleNavChange} unread={totalUnread} />}

        {matchedProfile && currentUser && <MatchModal profile={matchedProfile} currentUser={currentUser} onClose={() => setMatchedProfile(null)} onMessage={handleMatchMessage} />}
      </div>
    </div>
  )
}

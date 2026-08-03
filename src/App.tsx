import { useEffect, useState } from 'react'
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
import type { Conversation, Profile, Screen, UserProfile } from './types'
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

  useEffect(() => {
    let mounted = true

    const hydrate = async () => {
      setIsLoading(true)
      
      // Check current session first
      const { data: { session } } = await supabase.auth.getSession()
      
      let snapshot;
      if (session) {
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
            onBack={() => { go('messages'); setNavTab('messages') }}
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
        {isLoading && screen === 'swipe' ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(5,5,7,0.8)' }}>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-xl">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-[#f304eb] border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-white/70">Cargando experiencia…</p>
            </div>
          </div>
        ) : null}
        {renderScreen()}

        {showNav && <BottomNav active={navTab} onChange={handleNavChange} unread={totalUnread} />}

        {matchedProfile && <MatchModal profile={matchedProfile} onClose={() => setMatchedProfile(null)} onMessage={handleMatchMessage} />}
      </div>
    </div>
  )
}

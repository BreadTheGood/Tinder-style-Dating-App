import { useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { INITIAL_CONVERSATIONS } from './data/mockData'
import { ChatScreen } from './screens/ChatScreen'
import { LoginScreen } from './screens/LoginScreen'
import { MatchModal } from './screens/MatchModal'
import { MessagesScreen } from './screens/MessagesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SwipeScreen } from './screens/SwipeScreen'
import type { Conversation, Profile, Screen } from './types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [navTab, setNavTab] = useState<'swipe' | 'messages' | 'profile'>('swipe')
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

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

  const showNav = screen !== 'login' && screen !== 'chat' && screen !== 'settings'

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen onLogin={() => { setNavTab('swipe'); go('swipe') }} />
      case 'swipe':
        return (
          <SwipeScreen
            onMatch={handleMatch}
            conversations={conversations}
            setConversations={setConversations}
            profiles={conversations.map((c) => c.profile)}
            isLoading={false}
          />
        )
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
        return <ProfileScreen user={conversations[0]?.profile ?? ({} as any)} onSettings={() => go('settings')} />
      case 'settings':
        return <SettingsScreen onBack={() => { go('profile'); setNavTab('profile') }} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#050507' }}>
      <div className="relative w-full max-w-[390px] h-full max-h-[844px] overflow-hidden" style={{ background: '#0d0d0f' }}>
        {renderScreen()}

        {showNav && <BottomNav active={navTab} onChange={handleNavChange} unread={totalUnread} />}

        {matchedProfile && <MatchModal profile={matchedProfile} onClose={() => setMatchedProfile(null)} onMessage={handleMatchMessage} />}
      </div>
    </div>
  )
}

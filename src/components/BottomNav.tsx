import { ChatIcon, FireIcon, UserIcon } from './icons'

export function BottomNav({ active, onChange, unread }: { active: 'swipe' | 'messages' | 'profile'; onChange: (s: 'swipe' | 'messages' | 'profile') => void; unread: number }) {
  const items = [
    { key: 'swipe' as const, icon: <FireIcon size={22} />, label: 'Explorar' },
    { key: 'messages' as const, icon: <ChatIcon size={22} />, label: 'Chats' },
    { key: 'profile' as const, icon: <UserIcon size={22} />, label: 'Perfil' },
  ]

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-6 pb-1 pt-1" style={{ background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {items.map((item) => {
        const isActive = active === item.key
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="relative flex flex-col items-center gap-1 transition-all active:scale-90"
            style={{ color: isActive ? 'var(--theme-color-1)' : 'rgba(255,255,255,0.3)' }}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
            {item.key === 'messages' && unread > 0 && (
              <div className="absolute -top-1 -right-2 w-4 h-4 rounded-full gradient-brand flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">{unread}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

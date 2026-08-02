import type { Conversation } from '../types'

export function MessagesScreen({ conversations, onOpenChat }: { conversations: Conversation[]; onOpenChat: (c: Conversation) => void }) {
  const recentMatches = conversations.slice(0, 4)

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-white font-extrabold text-2xl tracking-tight">Mensajes</h1>
        <p className="text-white/40 text-sm font-medium mt-0.5">{conversations.reduce((s, c) => s + c.unread, 0)} sin leer</p>
      </div>

      <div className="px-5 mb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Nuevos matches</p>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {recentMatches.map((c) => (
            <button key={c.profile.id} onClick={() => onOpenChat(c)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #ff3ef9', padding: 2, background: '#0d0d0f' }}>
                  <img src={c.profile.image} alt={c.profile.name} className="w-full h-full rounded-full object-cover" />
                </div>
                {c.unread > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-brand flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{c.unread}</span>
                  </div>
                )}
              </div>
              <span className="text-white/70 text-xs font-semibold">{c.profile.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-5 mb-4" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      <div className="flex-1 overflow-y-auto px-5 space-y-1">
        {conversations.map((c) => {
          const last = c.messages[c.messages.length - 1]
          return (
            <button
              key={c.profile.id}
              onClick={() => onOpenChat(c)}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all active:scale-98 text-left"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800">
                  <img src={c.profile.image} alt={c.profile.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[#4ade80] border-2 border-[#0d0d0f]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-bold ${c.unread > 0 ? 'text-white' : 'text-white/70'}`}>{c.profile.name}</span>
                  <span className="text-white/30 text-xs font-medium">{last?.time}</span>
                </div>
                <p className={`text-xs truncate font-medium ${c.unread > 0 ? 'text-white/70' : 'text-white/35'}`}>{last?.text}</p>
              </div>
              {c.unread > 0 && (
                <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">{c.unread}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

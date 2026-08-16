import { useEffect, useRef, useState } from 'react'
import { BackIcon, SendIcon } from '../components/icons'
import { supabaseAppDataService } from '../services/supabaseAppDataService'
import type { Conversation, Message, Profile } from '../types'

export function ChatScreen({ conversation, onBack, onUpdate, onViewProfile }: { conversation: Conversation; onBack: () => void; onUpdate: (msgs: Message[]) => void; onViewProfile?: (p: Profile) => void }) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages])

  const send = async () => {
    if (!text.trim()) return
    const msgText = text.trim()
    setText('')
    
    // Optimistic UI update
    const msg: Message = { id: Date.now(), text: msgText, from: 'me', time: 'Ahora' }
    onUpdate([...conversation.messages, msg])
    
    // Send to DB
    if (conversation.id) {
       await supabaseAppDataService.sendMessage!(conversation.id, msgText)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full glass flex items-center justify-center flex-shrink-0">
          <BackIcon size={18} className="text-white/70" />
        </button>
        <div 
          onClick={() => onViewProfile?.(conversation.profile)}
          className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 cursor-pointer" 
          style={{ border: '1.5px solid rgba(255,62,108,0.4)' }}
        >
          <img src={conversation.profile.image} alt={conversation.profile.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 cursor-pointer" onClick={() => onViewProfile?.(conversation.profile)}>
          <p className="text-white font-bold text-sm">{conversation.profile.name}</p>
          <p className="text-white/40 text-xs font-medium">En línea ahora</p>
        </div>
        <button className="w-9 h-9 rounded-full glass flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="text-center mb-4">
          <div 
            onClick={() => onViewProfile?.(conversation.profile)}
            className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 shadow-lg cursor-pointer" 
            style={{ border: '2px solid rgba(255,62,108,0.4)' }}
          >
            <img src={conversation.profile.image} alt={conversation.profile.name} className="w-full h-full object-cover" />
          </div>
          <p className="text-white font-bold">{conversation.profile.name}</p>
          <p className="text-white/30 text-xs font-medium mt-0.5">¡Hicieron match! Empieza la conversación</p>
        </div>

        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${m.from === 'me' ? 'gradient-brand text-white' : ''}`}
              style={m.from === 'me'
                ? { borderBottomRightRadius: 4 }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 4 }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-3 rounded-full text-sm font-medium text-white placeholder-white/25 outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={send}
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${text.trim() ? 'gradient-brand' : ''}`}
          style={text.trim() ? { boxShadow: '0 4px 16px rgba(255,62,108,0.4)' } : { background: 'rgba(255,255,255,0.07)' }}
        >
          <SendIcon size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}

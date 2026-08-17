import { useEffect, useRef, useState } from 'react'
import { DrinkModal } from '../components/DrinkModal'
import { BackIcon, SendIcon, GlassWaterIcon } from '../components/icons'
import { supabaseAppDataService } from '../services/supabaseAppDataService'
import type { Conversation, Message, Profile } from '../types'
import { QRCodeSVG } from 'qrcode.react'

export function ChatScreen({ conversation, onBack, onUpdate, onViewProfile }: { conversation: Conversation; onBack: () => void; onUpdate: (msgs: Message[]) => void; onViewProfile?: (p: Profile) => void }) {
  const [text, setText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showDrinkModal, setShowDrinkModal] = useState(false)
  const [showQR, setShowQR] = useState<string | null>(null)
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
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full glass flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => { setShowMenu(false); alert('Usuario bloqueado'); onBack(); }}
                className="w-full text-left px-4 py-3 text-sm text-red-500 font-semibold hover:bg-gray-800 transition-colors"
              >
                Bloquear al usuario
              </button>
            </div>
          )}
        </div>
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

        {conversation.messages.map((m) => {
          const codeMatch = m.text.match(/(DRINK-[A-Z0-9]+)/)
          const isDrink = codeMatch !== null
          
          let drinkTitle = m.text.split('\n')[0]
          if (isDrink) {
             const inviteMatch = m.text.match(/¡Te he invitado (\d+)x (.+)!/)
             if (inviteMatch) {
                const qty = inviteMatch[1]
                const name = inviteMatch[2]
                if (m.from === 'me') {
                   drinkTitle = `🍹 Has invitado ${qty}x ${name}`
                } else {
                   drinkTitle = `🍹 ${conversation.profile.name} te ha invitado ${qty}x ${name}`
                }
             }
          }

          return (
            <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${m.from === 'me' ? 'gradient-brand text-white' : ''}`}
                style={m.from === 'me'
                  ? { borderBottomRightRadius: 4 }
                  : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 4 }
                }
              >
                {isDrink ? (
                   <div>
                      <p className="font-bold">{drinkTitle}</p>
                      <button 
                        onClick={() => setShowQR(codeMatch[1])}
                        className={`w-full mt-2 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${m.from === 'me' ? 'bg-white/20 hover:bg-white/30' : 'bg-black/20 hover:bg-black/30'}`}
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                         Presiona para mostrar el QR
                      </button>
                   </div>
                ) : (
                   m.text
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6 pt-3 flex items-center gap-3 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => setShowDrinkModal(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-800 text-[var(--theme-color-1)] border border-[var(--theme-color-1)] hover:bg-gray-700 transition-colors flex-shrink-0"
        >
          <GlassWaterIcon size={20} />
        </button>
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
          style={text.trim() ? { boxShadow: '0 4px 16px color-mix(in srgb, var(--theme-color-1) 40%, transparent)' } : { background: 'rgba(255,255,255,0.07)' }}
        >
          <SendIcon size={16} className="text-white" />
        </button>
      </div>
      {showDrinkModal && (
        <DrinkModal 
          partnerId={conversation.profile.id} 
          onClose={() => setShowDrinkModal(false)}
        />
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl relative animate-scale-up">
              <button 
                onClick={() => setShowQR(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
              >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              
              <h2 className="text-2xl font-black text-gray-800 mb-2 mt-2">Tu Código de Trago</h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">Muestra este código al empleado de la barra para que te entregue el trago.</p>
              
              <div className="bg-gray-50 p-4 rounded-2xl mb-6 shadow-inner border border-gray-100">
                 <QRCodeSVG value={showQR} size={200} />
              </div>
              
              <p className="text-lg font-mono font-bold text-gray-800 tracking-widest bg-gray-100 px-6 py-3 rounded-xl border border-gray-200">
                 {showQR}
              </p>
           </div>
        </div>
      )}
    </div>
  )
}

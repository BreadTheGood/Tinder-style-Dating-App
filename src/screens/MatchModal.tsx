import { type CSSProperties } from 'react'
import { HeartIcon } from '../components/icons'
import type { Profile, UserProfile } from '../types'

export function MatchModal({ profile, currentUser, onClose, onMessage }: { profile: Profile; currentUser: UserProfile; onClose: () => void; onMessage: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fade-in w-full max-w-sm text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #f304eb, transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <div className="animate-heart mb-4 inline-block">
            <HeartIcon filled size={64} className="text-[#f304eb]" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 0, 149, 0.8))' } as CSSProperties} />
          </div>

          <div className="gradient-brand-text font-extrabold text-4xl tracking-tight mb-1">¡Match!</div>
          <p className="text-white/60 text-sm font-medium mb-8">
            Tú y <span className="text-white font-semibold">{profile.name}</span> se gustaron mutuamente
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl">
              <img src={currentUser?.images?.[0] || 'https://placehold.co/200?text=Tu'} alt="Tú" className="w-full h-full object-cover" />
            </div>
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center shadow-lg">
              <HeartIcon filled size={14} className="text-white" />
            </div>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#f304eb]/50 shadow-xl" style={{ boxShadow: '0 0 24px rgba(255,62,108,0.4)' }}>
              <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <button
            onClick={onMessage}
            className="w-full py-4 rounded-xl font-bold text-white text-base mb-3 transition-all active:scale-95 gradient-brand"
            style={{ boxShadow: '0 8px 24px rgba(255,62,108,0.35)' }}
          >
            Enviar mensaje 💬
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-xl font-semibold text-white/50 text-sm transition-all active:scale-95 glass">
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  )
}

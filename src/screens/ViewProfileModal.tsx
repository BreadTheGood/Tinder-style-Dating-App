import { XIcon } from '../components/icons'
import type { Profile } from '../types'

export function ViewProfileModal({ profile, onClose, onMessage }: { profile: Profile; onClose: () => void; onMessage?: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0f] animate-fade-in overflow-y-auto" style={{ height: '100dvh' }}>
      <div className="relative w-full h-[60vh] flex-shrink-0">
        <img src={profile.images?.[0] || profile.image} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d0d0f 0%, transparent 40%)' }} />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
        >
          <XIcon size={20} className="text-white" />
        </button>
      </div>

      <div className="px-6 pb-24 relative z-10 -mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-white font-extrabold text-4xl tracking-tight leading-none mb-1">{profile.name}, {profile.age}</h2>
            <p className="text-white/60 text-base font-medium">{profile.job}</p>
          </div>
        </div>

        <div className="w-full h-px bg-white/10 my-6" />

        <h3 className="text-white font-bold text-lg mb-3">Sobre mí</h3>
        <p className="text-white/80 text-base leading-relaxed mb-6 whitespace-pre-wrap">{profile.bio}</p>

        {profile.tags && profile.tags.length > 0 && (
          <>
            <h3 className="text-white font-bold text-lg mb-3">Intereses</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {profile.tags.map((t) => (
                <span key={t} className="px-4 py-2 rounded-full text-sm font-semibold text-white/80" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {t}
                </span>
              ))}
            </div>
          </>
        )}

        {profile.images && profile.images.length > 1 && (
          <div className="space-y-4 mb-8">
            {profile.images.slice(1).map((img, idx) => (
              <img key={idx} src={img} alt={`${profile.name} photo ${idx + 2}`} className="w-full rounded-3xl object-cover" />
            ))}
          </div>
        )}

        {onMessage && (
          <button
            onClick={onMessage}
            className="w-full py-4 rounded-xl font-bold text-white text-lg mt-4 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f304eb,#ff7043)', boxShadow: '0 8px 24px rgba(255,62,108,0.35)' }}
          >
            Enviar mensaje
          </button>
        )}
      </div>
    </div>
  )
}

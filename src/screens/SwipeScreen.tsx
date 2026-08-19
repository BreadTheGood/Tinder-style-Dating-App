import { useEffect, useState } from 'react'
import { HeartIcon, XIcon } from '../components/icons'
import { SwipeCard } from '../components/SwipeCard'
import type { Profile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'

export function SwipeScreen({ profiles, isLoading, onMatchLocally, onSwipe, onViewProfile }: { profiles: Profile[]; isLoading: boolean; onMatchLocally?: (profile: Profile, matchId: string) => void; onSwipe?: (id: string | number) => void; onViewProfile?: (p: Profile) => void }) {
  const [queue, setQueue] = useState<Profile[]>([])
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setQueue(profiles)
  }, [profiles])

  const handleLike = () => {
    if (animating) return
    setAnimating(true)
    const liked = queue[0]

    supabaseAppDataService.recordSwipe?.(liked.id, 'like').then(res => {
      if (res?.matchId && onMatchLocally) {
        onMatchLocally(liked, res.matchId)
      }
    })

    setTimeout(() => {
      setQueue((q) => q.slice(1))
      setAnimating(false)
      if (onSwipe) onSwipe(liked.id)
      window.dispatchEvent(new CustomEvent('app-reload-data'))
    }, 400)
  }

  const handleDislike = () => {
    if (animating) return
    setAnimating(true)
    const disliked = queue[0]

    supabaseAppDataService.recordSwipe?.(disliked.id, 'pass')

    setTimeout(() => {
      setQueue((q) => q.slice(1))
      setAnimating(false)
      if (onSwipe) onSwipe(disliked.id)
      window.dispatchEvent(new CustomEvent('app-reload-data'))
    }, 400)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-4">
        <div className="w-9" />
        <div className="flex items-center">
          <span className="text-white font-extrabold text-xl tracking-[0.2em] notranslate" translate="no">G I R A</span>
        </div>
      </div>

      <div className="flex-1 relative mx-4 mb">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-white/40 font-semibold text-center animate-pulse">Preparando tus matches…</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <span className="text-3xl">🍻</span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white mb-2">¡La noche es joven!</h3>
              <p className="text-white/60 text-sm font-medium">Invita a tus amigos para que se sumen a la app y haya más perfiles para conocer.</p>
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
              <a 
                href={`https://wa.me/?text=${encodeURIComponent('¡Ey! Descargate GIRA para conocer gente hoy. 🚀 https://giraapp.com')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-bold text-white text-sm bg-[#25D366] hover:bg-[#1DA851] transition-all flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          [...queue].slice(0, 3).reverse().map((p, i, arr) => {
            const fromTop = arr.length - 1 - i
            return (
              <SwipeCard
                key={p.id}
                profile={p}
                onLike={handleLike}
                onDislike={handleDislike}
                isTop={fromTop === 0}
                offset={fromTop}
                onViewProfile={() => onViewProfile?.(p)}
              />
            )
          })
        )}
      </div>

      {queue.length > 0 && (
        <div className="flex items-center justify-center gap-8 pb-16 px-8">
          <button
            onClick={handleDislike}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)' }}
          >
            <XIcon size={22} className="text-white/60" />
          </button>
          <button
            onClick={handleLike}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg gradient-brand"
            style={{ boxShadow: '0 8px 24px rgba(249, 0, 220, 0.35)' }}
          >
            <HeartIcon filled size={24} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

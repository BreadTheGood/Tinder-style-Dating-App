import { useEffect, useState } from 'react'
import { HeartIcon, StarIcon, XIcon } from '../components/icons'
import { SwipeCard } from '../components/SwipeCard'
import type { Profile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'

export function SwipeScreen({ profiles, isLoading }: { profiles: Profile[]; isLoading: boolean }) {
  const [queue, setQueue] = useState<Profile[]>([])
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setQueue(profiles)
  }, [profiles])

  const handleLike = () => {
    if (animating) return
    setAnimating(true)
    const liked = queue[0]

    supabaseAppDataService.recordSwipe?.(liked.id, 'like')

    setTimeout(() => {
      setQueue((q) => q.slice(1))
      setAnimating(false)
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-white/40 font-semibold text-center">No hay más perfiles por ahora.<br />Vuelve más tarde ✨</p>
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
            onClick={handleDislike}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,200,0,0.12)', border: '1.5px solid rgba(255,200,0,0.2)' }}
          >
            <StarIcon size={16} className="text-yellow-400" />
          </button>
          <button
            onClick={handleLike}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)', boxShadow: '0 8px 24px rgb(255, 0, 200)' }}
          >
            <HeartIcon filled size={24} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

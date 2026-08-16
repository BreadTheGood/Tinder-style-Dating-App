import { useRef, useState, type PointerEvent, type CSSProperties } from 'react'

import type { Profile } from '../types'

export function SwipeCard({
  profile,
  onLike,
  onDislike,
  isTop,
  offset = 0,
  onViewProfile,
}: {
  profile: Profile
  onLike: () => void
  onDislike: () => void
  isTop: boolean
  offset?: number
  onViewProfile?: () => void
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false })
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const startRef = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: PointerEvent) => {
    if (!isTop) return
    startRef.current = { x: e.clientX, y: e.clientY }
    setDrag((d) => ({ ...d, dragging: true }))
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (!drag.dragging || !isTop) return
    setDrag((d) => ({ ...d, x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y }))
  }

  const handlePointerUp = () => {
    if (!drag.dragging) return
    setDrag((d) => ({ ...d, dragging: false }))
    if (drag.x > 80) {
      setSwipeDir('right')
      setTimeout(onLike, 380)
    } else if (drag.x < -80) {
      setSwipeDir('left')
      setTimeout(onDislike, 380)
    } else {
      setDrag({ x: 0, y: 0, dragging: false })
    }
  }

  const rotate = drag.x * 0.06
  const likeOpacity = Math.min(drag.x / 80, 1)
  const nopeOpacity = Math.min(-drag.x / 80, 1)

  const style: CSSProperties = {
    transform: swipeDir ? undefined : `translate(${drag.x}px, ${drag.y * 0.3}px) rotate(${rotate}deg) translateY(${offset * 12}px) scale(${1 - offset * 0.04})`,
    transition: drag.dragging ? 'none' : 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
    zIndex: 10 - offset,
  }

  return (
    <div
      ref={cardRef}
      className={`absolute inset-x-0 drag-card select-none rounded-3xl overflow-hidden shadow-2xl ${swipeDir === 'left' ? 'card-swipe-left' : swipeDir === 'right' ? 'card-swipe-right' : ''}`}
      style={{ ...style, top: 0, bottom: 10, background: '#1a1a1f' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-0 bg-zinc-900">
        <img src={profile.images[imgIdx] || profile.image} alt={profile.name} className="w-full h-full object-cover" draggable={false} />
      </div>

      {profile.images.length > 1 && (
        <div className="absolute top-4 inset-x-4 flex gap-1.5 z-30">
          {profile.images.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
               <div className="h-full w-full rounded-full transition-all duration-300" style={{ background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: i === imgIdx ? '0 0 4px rgba(255,255,255,0.8)' : 'none' }} />
            </div>
          ))}
        </div>
      )}

      {/* Tap zones for photo navigation */}
      {profile.images.length > 1 && (
        <>
          <div 
            className="absolute top-0 bottom-32 left-0 w-1/2 z-20"
            onClick={(e) => {
               if (drag.dragging) return
               e.stopPropagation()
               setImgIdx(prev => Math.max(0, prev - 1))
            }}
          />
          <div 
            className="absolute top-0 bottom-32 right-0 w-1/2 z-20"
            onClick={(e) => {
               if (drag.dragging) return
               e.stopPropagation()
               setImgIdx(prev => Math.min(profile.images.length - 1, prev + 1))
            }}
          />
        </>
      )}

      <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

      {isTop && (
        <>
          <div className="absolute top-16 left-6 z-30 border-4 border-[#4ade80] rounded-xl px-4 py-1.5 rotate-[-15deg] transition-all" style={{ opacity: likeOpacity }}>
            <span className="text-[#4ade80] font-extrabold text-2xl tracking-widest">LIKE</span>
          </div>
          <div className="absolute top-16 right-6 z-30 border-4 border-[#ff3e6c] rounded-xl px-4 py-1.5 rotate-[15deg] transition-all" style={{ opacity: nopeOpacity }}>
            <span className="text-[#ff3e6c] font-extrabold text-2xl tracking-widest">NOPE</span>
          </div>
        </>
      )}

      <div className="absolute bottom-0 inset-x-0 p-5 z-20">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2 className="text-white font-extrabold text-3xl tracking-tight leading-tight">{profile.name}, {profile.age}</h2>
            <p className="text-white/70 text-sm font-medium mt-0.5">{profile.job}</p>
          </div>
        </div>
        <p className="text-white/75 text-sm leading-relaxed mb-3">
          {profile.bio && profile.bio.length > 70 ? `${profile.bio.substring(0, 70)}...` : profile.bio}
          {(profile.bio?.length > 70 || profile.images?.length > 1 || profile.tags?.length > 0) && (
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewProfile?.(); }}
              className="text-white font-bold ml-1 hover:underline"
            >
              (ver más)
            </button>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.tags.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold text-white/80" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect, CSSProperties } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = 'login' | 'swipe' | 'match' | 'messages' | 'chat' | 'profile' | 'settings'

interface Profile {
  id: number
  name: string
  age: number
  bio: string
  distance: string
  job: string
  image: string
  images: string[]
  tags: string[]
}

interface Message {
  id: number
  text: string
  from: 'me' | 'them'
  time: string
}

interface Conversation {
  profile: Profile
  messages: Message[]
  unread: number
}

// ─── Data ────────────────────────────────────────────────────────────────────
const PROFILES: Profile[] = [
  {
    id: 1,
    name: 'Valentina',
    age: 26,
    bio: 'Arquitecta de día, cocinera italiana de noche 🍝 Amante de los museos, el jazz y los domingos lentos.',
    distance: '3 km',
    job: 'Arquitecta',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Jazz', 'Cocina', 'Viajes'],
  },
  {
    id: 2,
    name: 'Camila',
    age: 24,
    bio: 'Fotógrafa freelance. Si no estoy mirando por el visor, estoy en alguna librería perdida 📚',
    distance: '1 km',
    job: 'Fotógrafa',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Fotografía', 'Libros', 'Café'],
  },
  {
    id: 3,
    name: 'Sofía',
    age: 28,
    bio: 'Doctora que cura y baila salsa los fines de semana 💃 Buscando alguien con quien compartir madrugadas de películas.',
    distance: '5 km',
    job: 'Médica',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Salsa', 'Cine', 'Senderismo'],
  },
  {
    id: 4,
    name: 'Isabella',
    age: 25,
    bio: 'Diseñadora UX con obsesión por las plantas 🌿 Colecciono viniles y hago yoga en la azotea.',
    distance: '2 km',
    job: 'Diseñadora UX',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Diseño', 'Plantas', 'Yoga'],
  },
  {
    id: 5,
    name: 'Daniela',
    age: 27,
    bio: 'Abogada de dia, guitarrista en noches de vino 🍷🎸 Amo los debates, el buen café y los viajes sin itinerario.',
    distance: '8 km',
    job: 'Abogada',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&auto=format',
    ],
    tags: ['Guitarra', 'Vino', 'Debates'],
  },
]

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    profile: PROFILES[0],
    unread: 2,
    messages: [
      { id: 1, text: 'Hola! Me encantó tu perfil 😊', from: 'them', time: '10:24' },
      { id: 2, text: 'Hola Valentina! Gracias 😄 Vi que eres arquitecta, ¿qué tipo de proyectos diseñas?', from: 'me', time: '10:26' },
      { id: 3, text: 'Mainly residencial, pero me encanta el diseño de interiores también ✨', from: 'them', time: '10:28' },
      { id: 4, text: '¿Tienes planes este finde?', from: 'them', time: '10:29' },
    ],
  },
  {
    profile: PROFILES[2],
    unread: 0,
    messages: [
      { id: 1, text: 'Match! 🎉', from: 'them', time: 'Ayer' },
      { id: 2, text: 'Hola Sofía! Qué bueno hacer match 😄', from: 'me', time: 'Ayer' },
    ],
  },
  {
    profile: PROFILES[1],
    unread: 1,
    messages: [
      { id: 1, text: 'Tus fotos son increíbles 📸', from: 'me', time: 'Lun' },
      { id: 2, text: 'Gracias!! Son de mi viaje a Lisboa el año pasado', from: 'them', time: 'Lun' },
    ],
  },
]

// ─── Icons ───────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled = false, size = 24, className = '', style }: { filled?: boolean; size?: number; className?: string; style?: CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const XIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const StarIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const ChatIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const UserIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SettingsIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const BackIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const SendIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

const LocationIcon = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

const FireIcon = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Tarjeta 1 (Inicio del movimiento - Izquierda) */}
    <rect x="2" y="6" width="14" height="20" rx="3" opacity="0.15" />
    
    {/* Tarjeta 2 (Intermedia 1 - Mayor separación y ángulo) */}
    <rect x="2" y="6" width="14" height="20" rx="3" transform="rotate(7 16 16) translate(3, -1)" opacity="0.35" />
    
    {/* Tarjeta 3 (Intermedia 2 - Mayor separación y ángulo) */}
    <rect x="2" y="6" width="14" height="20" rx="3" transform="rotate(14 16 16) translate(6, -2)" opacity="0.65" />
    
    {/* Tarjeta 4 (Final del movimiento - Destacada) */}
    <rect x="2" y="6" width="14" height="20" rx="3" transform="rotate(21 16 16) translate(9, -3)" />
  </svg>
);

const EyeIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)


// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'ticket-code'>('login')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#0d0d0f' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f304eb 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #b004f3 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative flex flex-col items-center pt-16 pb-8 px-8">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-5 shadow-lg" style={{ boxShadow: '0 8px 32px rgba(255,62,108,0.4)' }}>
          <FireIcon size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">
          <span className="gradient-brand-text">swiper</span>
        </h1>
        <p className="text-sm text-white/40 font-medium tracking-wide">Swipea. Matchea. Conecta.</p>
      </div>

      {/* Card */}
      <div className="relative flex-1 flex flex-col justify-start mx-5">
        <div className="glass rounded-3xl p-6 pb-8">
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mb-7" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['login', 'ticket-code'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-3 text-sm font-semibold transition-all duration-200"
                style={mode === m ? { background: 'linear-gradient(135deg,#f304eb,#b004f3)', color: '#fff', borderRadius: 10 } : { color: 'rgba(255,255,255,0.4)' }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Usar código'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'ticket-code' && (
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Codigo</label>
                <input
                  type="text"
                  placeholder="Ingresa el codigo de tu entrada"
                  className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            )}

            
          </div>

          {mode === 'login' && (
            <>
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgb(249, 8, 165)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(165, 2, 183, 0.08)')}
                />
              </div>

              <br />

              <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(249, 8, 165, 0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <EyeIcon size={16} />
                </button>
              </div>
            </div>

              <button className="text-xs font-semibold mt-3 block gradient-brand-text">
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          <button
            onClick={onLogin}
            className="w-full mt-6 py-4 rounded-xl font-bold text-white text-base transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)', boxShadow: '0 8px 24px rgba(249, 0, 220, 0.35)' }}
          >
            {mode === 'login' ? 'Ingresar' : 'Ingresar con código'}
          </button>
         
        </div>

        <p className="text-center text-xs text-white/20 mt-6 pb-8 leading-relaxed">
          Al continuar, aceptas nuestros{' '}
          <span className="gradient-brand-text font-semibold">Términos de uso</span>{' '}
          y{' '}
          <span className="gradient-brand-text font-semibold">Política de privacidad</span>
        </p>
      </div>
    </div>
  )
}

// ─── Swipe Card ───────────────────────────────────────────────────────────────
function SwipeCard({
  profile,
  onLike,
  onDislike,
  isTop,
  offset = 0,
}: {
  profile: Profile
  onLike: () => void
  onDislike: () => void
  isTop: boolean
  offset?: number
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false })
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const startRef = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isTop) return
    startRef.current = { x: e.clientX, y: e.clientY }
    setDrag(d => ({ ...d, dragging: true }))
    cardRef.current?.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.dragging || !isTop) return
    setDrag(d => ({ ...d, x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y }))
  }
  const handlePointerUp = () => {
    if (!drag.dragging) return
    setDrag(d => ({ ...d, dragging: false }))
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

  const style: React.CSSProperties = {
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
      {/* Image */}
      <div className="absolute inset-0 bg-zinc-900">
        <img
          src={profile.images[imgIdx] || profile.image}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Image dots */}
      {profile.images.length > 1 && (
        <div className="absolute top-3 inset-x-3 flex gap-1.5 z-20">
          {profile.images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setImgIdx(i) }}
              className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.35)' }}
            />
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

      {/* Like / Nope badge */}
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

      {/* Info */}
      <div className="absolute bottom-0 inset-x-0 p-5 z-20">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2 className="text-white font-extrabold text-3xl tracking-tight leading-tight">{profile.name}, {profile.age}</h2>
            <p className="text-white/70 text-sm font-medium mt-0.5">{profile.job}</p>
          </div>
          <div className="flex items-center gap-1 text-white/50 text-xs font-semibold">
            <LocationIcon size={12} className="text-white/40" />
            {profile.distance}
          </div>
        </div>
        <p className="text-white/75 text-sm leading-relaxed mb-3">{profile.bio}</p>
        <div className="flex flex-wrap gap-2">
          {profile.tags.map(t => (
            <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold text-white/80" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Swipe Screen ─────────────────────────────────────────────────────────────
function SwipeScreen({ onMatch, conversations, setConversations }: { onMatch: (p: Profile) => void; conversations: Conversation[]; setConversations: React.Dispatch<React.SetStateAction<Conversation[]>> }) {
  const [queue, setQueue] = useState([...PROFILES])
  const [animating, setAnimating] = useState(false)

  const handleLike = () => {
    if (animating) return
    setAnimating(true)
    const liked = queue[0]
    setTimeout(() => {
      setQueue(q => q.slice(1))
      setAnimating(false)
      if (Math.random() > 0.4) {
        onMatch(liked)
        setConversations(c => [{
          profile: liked,
          unread: 1,
          messages: [{ id: 1, text: `Hola! Soy ${liked.name} 👋 ¡Hacemos buen match!`, from: 'them', time: 'Ahora' }]
        }, ...c])
      }
    }, 400)
  }

  const handleDislike = () => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setQueue(q => q.slice(1))
      setAnimating(false)
    }, 400)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4">
        <div className="w-9" />
        <div className="flex items-center gap-2">
          <FireIcon size={22} className="text-[#f304eb]" />
          <span className="text-white font-extrabold text-xl tracking-tight">swiper</span>
        </div>
        
      </div>

      {/* Cards area */}
      <div className="flex-1 relative mx-4 mb">
        {queue.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center opacity-30">
              <FireIcon size={36} className="text-white" />
            </div>
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

      {/* Action buttons */}
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

// ─── Match Modal ──────────────────────────────────────────────────────────────
function MatchModal({ profile, onClose, onMessage }: { profile: Profile; onClose: () => void; onMessage: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fade-in w-full max-w-sm text-center">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #f304eb, transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <div className="animate-heart mb-4 inline-block">
            <HeartIcon filled size={64} className="text-[#f304eb]" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 0, 149, 0.8))' } as React.CSSProperties} />
          </div>

          <div className="gradient-brand-text font-extrabold text-4xl tracking-tight mb-1">¡Match!</div>
          <p className="text-white/60 text-sm font-medium mb-8">
            Tú y <span className="text-white font-semibold">{profile.name}</span> se gustaron mutuamente
          </p>

          {/* Avatars */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format" alt="Tú" className="w-full h-full object-cover" />
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
            className="w-full py-4 rounded-xl font-bold text-white text-base mb-3 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#f304eb,#ff7043)', boxShadow: '0 8px 24px rgba(255,62,108,0.35)' }}
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

// ─── Messages Screen ──────────────────────────────────────────────────────────
function MessagesScreen({ conversations, onOpenChat }: { conversations: Conversation[]; onOpenChat: (c: Conversation) => void }) {
  const recentMatches = conversations.slice(0, 4)

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-white font-extrabold text-2xl tracking-tight">Mensajes</h1>
        <p className="text-white/40 text-sm font-medium mt-0.5">{conversations.reduce((s, c) => s + c.unread, 0)} sin leer</p>
      </div>

      {/* New matches row */}
      <div className="px-5 mb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Nuevos matches</p>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {recentMatches.map(c => (
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

      {/* Divider */}
      <div className="mx-5 mb-4" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-5 space-y-1">
        {conversations.map(c => {
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

// ─── Chat Screen ──────────────────────────────────────────────────────────────
function ChatScreen({ conversation, onBack, onUpdate }: { conversation: Conversation; onBack: () => void; onUpdate: (msgs: Message[]) => void }) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conversation.messages])

  const send = () => {
    if (!text.trim()) return
    const msg: Message = { id: Date.now(), text: text.trim(), from: 'me', time: 'Ahora' }
    onUpdate([...conversation.messages, msg])
    setText('')
    setTimeout(() => {
      const replies = ['Qué interesante! 😊', '¡Me encanta!', 'Cuéntame más ✨', 'Totalmente de acuerdo 😄', '🥰', 'Ja! Sí, es muy así']
      const reply: Message = { id: Date.now() + 1, text: replies[Math.floor(Math.random() * replies.length)], from: 'them', time: 'Ahora' }
      onUpdate([...conversation.messages, msg, reply])
    }, 1200)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0f' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full glass flex items-center justify-center flex-shrink-0">
          <BackIcon size={18} className="text-white/70" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0" style={{ border: '1.5px solid rgba(255,62,108,0.4)' }}>
          <img src={conversation.profile.image} alt={conversation.profile.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{conversation.profile.name}</p>
          <p className="text-white/40 text-xs font-medium">En línea ahora</p>
        </div>
        <button className="w-9 h-9 rounded-full glass flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 shadow-lg" style={{ border: '2px solid rgba(255,62,108,0.4)' }}>
            <img src={conversation.profile.image} alt={conversation.profile.name} className="w-full h-full object-cover" />
          </div>
          <p className="text-white font-bold">{conversation.profile.name}</p>
          <p className="text-white/30 text-xs font-medium mt-0.5">¡Hicieron match! Empieza la conversación</p>
        </div>

        {conversation.messages.map(m => (
          <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[72%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed"
              style={m.from === 'me'
                ? { background: 'linear-gradient(135deg,#ff3e6c,#ff7043)', color: '#fff', borderBottomRightRadius: 4 }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 4 }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-3 rounded-full text-sm font-medium text-white placeholder-white/25 outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={send}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={text.trim() ? { background: 'linear-gradient(135deg,#ff3e6c,#ff7043)', boxShadow: '0 4px 16px rgba(255,62,108,0.4)' } : { background: 'rgba(255,255,255,0.07)' }}
        >
          <SendIcon size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({ onSettings }: { onSettings: () => void }) {
  const me = {
    name: 'Alejandro',
    age: 28,
    job: 'Ingeniero de software',
    bio: 'Apasionado por la tecnología, el café y los viajes ☕🌍 Buscando a alguien con quien explorar el mundo.',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=700&fit=crop&auto=format',
    ],
    tags: ['Tecnología', 'Viajes', 'Café', 'Senderismo'],
    stats: [{ label: 'Likes', value: '142' }, { label: 'Matches', value: '23' }, { label: 'Visitas', value: '891' }],
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0d0d0f' }}>
      {/* Header image */}
      <div className="relative h-80 flex-shrink-0">
        <img src={me.images[0]} alt={me.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d0d0f 0%, transparent 60%)' }} />
        <button
          onClick={onSettings}
          className="absolute top-12 right-4 w-10 h-10 glass rounded-full flex items-center justify-center"
        >
          <SettingsIcon size={18} className="text-white/70" />
        </button>
        <div className="absolute bottom-4 left-5">
          <h2 className="text-white font-extrabold text-3xl tracking-tight">{me.name}, {me.age}</h2>
          <p className="text-white/60 text-sm font-medium">{me.job}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        {me.stats.map(s => (
          <div key={s.label} className="glass rounded-2xl py-4 text-center">
            <div className="gradient-brand-text font-extrabold text-2xl">{s.value}</div>
            <div className="text-white/40 text-xs font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="mx-5 mt-4 glass rounded-2xl p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Sobre mí</p>
        <p className="text-white/80 text-sm leading-relaxed">{me.bio}</p>
      </div>

      {/* Tags */}
      <div className="mx-5 mt-4 glass rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Intereses</p>
        <div className="flex flex-wrap gap-2">
          {me.tags.map(t => (
            <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,62,108,0.15)', color: '#ff6b8a', border: '1px solid rgba(255,62,108,0.2)' }}>
              {t}
            </span>
          ))}
          <button className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/40" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Edit button */}
      <div className="mx-5 mb-28">
        <button className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all active:scale-95 glass">
          Editar perfil
        </button>
      </div>
    </div>
  )
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [ageRange, setAgeRange] = useState([22, 35])
  const [distance, setDistance] = useState(25)
  const [notifications, setNotifications] = useState(true)
  const [showMe, setShowMe] = useState(true)

  const sections = [
    {
      title: 'Cuenta',
      items: [
        { label: 'Número de teléfono', value: '+52 55 1234 5678', icon: '📱' },
        { label: 'Email', value: 'ale@email.com', icon: '✉️' },
        { label: 'Conectar con Instagram', value: 'Conectar', icon: '📸', action: true },
      ],
    },
    {
      title: 'Seguridad',
      items: [
        { label: 'Verificación de perfil', value: '✅ Verificado', icon: '🛡️' },
        { label: 'Bloquear contactos', value: '0 bloqueados', icon: '🚫' },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0d0d0f' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full glass flex items-center justify-center">
          <BackIcon size={18} className="text-white/70" />
        </button>
        <h1 className="text-white font-extrabold text-xl tracking-tight">Configuración</h1>
      </div>

      <div className="px-5 space-y-5 pb-28">
        {/* Discovery prefs */}
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Preferencias de búsqueda</p>

          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-white/80">Rango de edad</span>
              <span className="text-sm font-semibold gradient-brand-text">{ageRange[0]}–{ageRange[1]}</span>
            </div>
            <input
              type="range" min={18} max={60} value={ageRange[1]}
              onChange={e => setAgeRange([ageRange[0], +e.target.value])}
              className="w-full accent-[#ff3e6c]"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-white/80">Distancia máxima</span>
              <span className="text-sm font-semibold gradient-brand-text">{distance} km</span>
            </div>
            <input
              type="range" min={1} max={100} value={distance}
              onChange={e => setDistance(+e.target.value)}
              className="w-full accent-[#ff3e6c]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white/80">Mostrar mi perfil</p>
              <p className="text-xs text-white/35 mt-0.5">Aparece en los resultados de búsqueda</p>
            </div>
            <button
              onClick={() => setShowMe(p => !p)}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: showMe ? 'linear-gradient(135deg,#ff3e6c,#ff7043)' : 'rgba(255,255,255,0.12)' }}
            >
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: showMe ? '26px' : '2px' }} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white/80">Notificaciones</p>
              <p className="text-xs text-white/35 mt-0.5">Matches, mensajes, etc.</p>
            </div>
            <button
              onClick={() => setNotifications(p => !p)}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: notifications ? 'linear-gradient(135deg,#ff3e6c,#ff7043)' : 'rgba(255,255,255,0.12)' }}
            >
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: notifications ? '26px' : '2px' }} />
            </button>
          </div>
        </div>

        {/* Other sections */}
        {sections.map(sec => (
          <div key={sec.title} className="glass rounded-2xl overflow-hidden">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest px-5 pt-4 pb-2">{sec.title}</p>
            {sec.items.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/80">{item.label}</p>
                    <p className={`text-xs mt-0.5 font-medium ${item.action ? 'gradient-brand-text' : 'text-white/35'}`}>{item.value}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                {i < sec.items.length - 1 && <div className="mx-5" style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />}
              </div>
            ))}
          </div>
        ))}

        {/* Subscription */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,62,108,0.2), rgba(255,112,67,0.2))', border: '1px solid rgba(255,62,108,0.2)' }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <FireIcon size={18} className="text-[#f304eb]" />
              <span className="font-bold text-white">swiper Gold</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,62,108,0.3)', color: '#ff6b8a' }}>PRO</span>
            </div>
            <p className="text-white/50 text-xs mb-4">Likes ilimitados, ver quién te dio like y más</p>
            <button className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)' }}>
              Actualizar a Gold — $199/mes
            </button>
          </div>
        </div>

        <button className="w-full py-4 rounded-xl font-bold text-[#f304eb] text-sm glass">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange, unread }: { active: 'swipe' | 'messages' | 'profile'; onChange: (s: 'swipe' | 'messages' | 'profile') => void; unread: number }) {
  const items = [
    { key: 'swipe' as const, icon: <FireIcon size={22} />, label: 'Explorar' },
    { key: 'messages' as const, icon: <ChatIcon size={22} />, label: 'Chats' },
    { key: 'profile' as const, icon: <UserIcon size={22} />, label: 'Perfil' },
  ]
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-6 pb-1 pt-1" style={{ background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {items.map(item => {
        const isActive = active === item.key
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="relative flex flex-col items-center gap-1 transition-all active:scale-90"
            style={{ color: isActive ? '#f304eb' : 'rgba(255,255,255,0.3)' }}
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

// ─── App ──────────────────────────────────────────────────────────────────────
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
      const convo = conversations.find(c => c.profile.id === matchedProfile.id) || conversations[0]
      setActiveConversation(convo)
      setNavTab('messages')
      go('chat')
    }
  }

  const handleOpenChat = (c: Conversation) => {
    setConversations(prev => prev.map(cv => cv.profile.id === c.profile.id ? { ...cv, unread: 0 } : cv))
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
          />
        )
      case 'messages':
        return <MessagesScreen conversations={conversations} onOpenChat={handleOpenChat} />
      case 'chat':
        return activeConversation ? (
          <ChatScreen
            conversation={activeConversation}
            onBack={() => { go('messages'); setNavTab('messages') }}
            onUpdate={msgs => {
              setConversations(prev => prev.map(c => c.profile.id === activeConversation.profile.id ? { ...c, messages: msgs } : c))
              setActiveConversation(a => a ? { ...a, messages: msgs } : a)
            }}
          />
        ) : null
      case 'profile':
        return <ProfileScreen onSettings={() => go('settings')} />
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

        {showNav && (
          <BottomNav active={navTab} onChange={handleNavChange} unread={totalUnread} />
        )}

        {matchedProfile && (
          <MatchModal
            profile={matchedProfile}
            onClose={() => setMatchedProfile(null)}
            onMessage={handleMatchMessage}
          />
        )}
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import type { UserProfile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'
import { PhotoEditor } from '../components/PhotoEditor'

const AVAILABLE_TAGS = ['Música', 'Deportes', 'Cine', 'Viajes', 'Lectura', 'Arte', 'Cocina', 'Fotografía', 'Videojuegos', 'Naturaleza', 'Mascotas', 'Fiesta']

export function OnboardingScreen({
  user,
  guestEmail,
  onComplete,
}: {
  user?: UserProfile | null
  guestEmail?: string
  onComplete: (data: Partial<UserProfile>, password?: string, files?: File[]) => Promise<string | void>
}) {
  const [step, setStep] = useState(1)
  
  const [name, setName] = useState(user?.name || '')
  const [birthdate, setBirthdate] = useState(user?.birthdate || '')
  const [gender, setGender] = useState(user?.gender || 'female')
  
  const [bio, setBio] = useState(user?.bio || '')
  const [tags, setTags] = useState<string[]>(user?.tags || [])
  
  const [localImages, setLocalImages] = useState<{ url: string, file: File }[]>([])
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const handleSaveCropped = async (croppedFile: File) => {
    setEditingPhoto(null)
    const url = URL.createObjectURL(croppedFile)
    setLocalImages(prev => [...prev, { url, file: croppedFile }])
  }

  const handleNext = async () => {
    setErrorMsg('')
    if (step === 1) {
      if (!name || !birthdate) return setErrorMsg('Por favor, completa todos los campos para continuar.')
      const age = Math.floor((Date.now() - new Date(birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      if (age < 18) return setErrorMsg('Debes ser mayor de 18 años para usar la aplicación.')
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (localImages.length === 0) return setErrorMsg('Debes subir al menos una foto para continuar.')
      if (guestEmail) {
        setStep(4)
      } else {
        await finishOnboarding()
      }
    } else if (step === 4) {
      if (!password || password.length < 6) return setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      await finishOnboarding()
    }
  }

  const finishOnboarding = async () => {
    setIsSaving(true)
    const error = await onComplete(
      { name, birthdate, gender, bio, tags },
      password,
      localImages.map(img => img.file)
    )
    if (error) {
      setErrorMsg(error)
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] text-white">
      <div className="p-5 flex items-center justify-between border-b border-white/10">
         <div className="text-white/40 text-sm font-semibold">Paso {step} de {guestEmail ? '4' : '3'}</div>
         <span className="font-bold text-[#f304eb]">Completar Perfil</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6">Tus Datos</h2>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] transition-colors" placeholder="¿Cómo te llamas?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Fecha de nacimiento</label>
              <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Género</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] appearance-none">
                <option value="female" className="text-black">Mujer</option>
                <option value="male" className="text-black">Hombre</option>
                <option value="other" className="text-black">Otro</option>
              </select>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6">Sobre Ti</h2>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Biografía</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-[#f304eb] transition-colors" placeholder="Cuéntanos un poco sobre tus gustos, hobbies..." maxLength={500} />
              <div className="text-right text-white/40 text-xs mt-1">{bio.length}/500</div>
            </div>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Intereses (Etiquetas)</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${tags.includes(tag) ? 'bg-[#f304eb] border-[#f304eb] text-white' : 'bg-white/5 border-white/20 text-white/60 hover:text-white'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6">Tus Fotos</h2>
            <div className="grid grid-cols-3 gap-3">
              {localImages.map((img, idx) => (
                <div key={idx} className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden relative border border-white/10">
                  <img src={img.url} alt="Profile" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setLocalImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <div onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-white/40 cursor-pointer hover:bg-white/10 hover:border-[#f304eb] transition-all">
                <span className="text-3xl pb-1">+</span>
              </div>
            </div>
            <p className="text-xs text-white/40 text-center mt-4">Sube al menos una foto para que los demás puedan verte.</p>
          </div>
        )}

        {step === 4 && guestEmail && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6">Protege tu cuenta</h2>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Estás ingresando con la entrada del evento. Por favor, crea una contraseña para asociarla a tu correo <strong className="text-white">{guestEmail}</strong> y proteger tu perfil.
            </p>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] transition-colors" 
                placeholder="Mínimo 6 caracteres" 
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="p-5 border-t border-white/10 bg-[#0d0d0f]">
        {errorMsg && <p className="text-red-500 text-xs text-center mb-3 font-medium animate-fade-in">{errorMsg}</p>}
        <button onClick={handleNext} disabled={isSaving} className="w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)' }}>
          {isSaving ? 'Guardando...' : (step === 3 && !guestEmail) || step === 4 ? 'Finalizar y Entrar' : 'Siguiente'}
        </button>
      </div>

      {/* Photo Editor */}
      {editingPhoto && (
        <PhotoEditor 
          imageSrc={editingPhoto} 
          onCancel={() => setEditingPhoto(null)} 
          onSave={handleSaveCropped} 
        />
      )}
    </div>
  )
}

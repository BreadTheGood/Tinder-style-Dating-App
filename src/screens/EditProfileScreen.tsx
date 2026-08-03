import { useState, useRef } from 'react'
import type { UserProfile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'

const AVAILABLE_TAGS = ['Música', 'Deportes', 'Cine', 'Viajes', 'Lectura', 'Arte', 'Cocina', 'Fotografía', 'Videojuegos', 'Naturaleza', 'Mascotas', 'Fiesta']

export function EditProfileScreen({
  user,
  onBack,
  onSave,
}: {
  user: UserProfile
  onBack: () => void
  onSave: (data: Partial<UserProfile>) => Promise<void>
}) {
  const [name, setName] = useState(user.name || '')
  const [bio, setBio] = useState(user.bio || '')
  const [birthdate, setBirthdate] = useState(user.birthdate || '')
  const [gender, setGender] = useState(user.gender || 'female')
  const [tags, setTags] = useState<string[]>(user.tags || [])
  const [images, setImages] = useState(user.images || [])
  
  const [errorMsg, setErrorMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const handleSave = async () => {
    setErrorMsg('')
    if (!name || !birthdate) return setErrorMsg('Por favor, completa tu nombre y fecha de nacimiento.')
    const age = Math.floor((Date.now() - new Date(birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    if (age < 18) return setErrorMsg('Debes ser mayor de 18 años para usar la aplicación.')
    
    if (images.length === 0) return setErrorMsg('Debes tener al menos 1 foto en tu perfil.')

    setIsSaving(true)
    await onSave({ name, bio, birthdate, gender, images, tags })
    setIsSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg('')
    setIsSaving(true)
    try {
      if (!supabaseAppDataService.uploadPhoto) throw new Error('Servicio de subida no disponible')
      const publicUrl = await supabaseAppDataService.uploadPhoto(file)
      if (publicUrl) {
        setImages((prev) => [...prev, publicUrl])
      } else {
        setErrorMsg('Error al subir la foto. Por favor, intenta nuevamente.')
      }
    } catch (error: any) {
      setErrorMsg(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] text-white">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/10">
        <button onClick={onBack} className="text-[#f304eb] font-semibold active:scale-95 transition-all">
          Cancelar
        </button>
        <span className="font-extrabold text-lg tracking-tight">Editar Perfil</span>
        <button onClick={handleSave} disabled={isSaving} className="text-[#f304eb] font-bold active:scale-95 transition-all disabled:opacity-50">
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {errorMsg && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 text-xs text-center">{errorMsg}</div>}

        <div className="space-y-6">
          {/* Name input */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] transition-colors"
              placeholder="¿Cómo te llamas?"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Fecha de nacimiento</label>
            <input 
              type="date" 
              value={birthdate} 
              onChange={e => setBirthdate(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] [color-scheme:dark]" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Género</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] appearance-none">
              <option value="female" className="text-black">Mujer</option>
              <option value="male" className="text-black">Hombre</option>
              <option value="other" className="text-black">Otro</option>
            </select>
          </div>

          {/* Bio input */}
          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Sobre mí</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] transition-colors resize-none"
              placeholder="Cuéntanos un poco sobre ti..."
              maxLength={500}
            />
            <div className="text-right text-white/40 text-xs mt-1">{bio.length}/500</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Intereses</label>
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

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Fotos</label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden relative border border-white/10">
                  <img src={img} alt="Profile" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handlePhotoUpload} 
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-white/40 cursor-pointer hover:bg-white/10 hover:border-[#f304eb] transition-all"
              >
                <span className="text-3xl pb-1">+</span>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3 text-center">
              {images.length === 0 ? "Debes subir al menos una foto para que los demás puedan verte." : ""}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

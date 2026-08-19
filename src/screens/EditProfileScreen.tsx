import { useState, useRef } from 'react'
import type { UserProfile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'
import { PhotoEditor } from '../components/PhotoEditor'
import { DatePicker } from '../components/DatePicker'

const AVAILABLE_TAGS = ['Bailar', 'Hacer previa', 'Ir de after', 'Vino', 'Vodka', 'Fernet', 'Gin', 'Cerveza', 'Reggaet�n', 'Cumbia', 'RKT', 'Cuarteto', 'Electr�nica', 'Techno', 'Pop', 'Rock', 'Trap', 'Hip Hop']

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
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const handleSave = async () => {
    setErrorMsg('')
    if (!name || !birthdate) return setErrorMsg('Por favor, completa tu nombre y FECHA DE NACIMIENTO.')
    const age = Math.floor((Date.now() - new Date(birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    if (age < 18) return setErrorMsg('Debes ser mayor de 18 años para usar la aplicación.')
    
    if (images.length === 0) return setErrorMsg('Debes tener al menos 1 foto en tu perfil.')

    setIsSaving(true)
    await onSave({ name, bio, birthdate, gender, images, tags })
    setIsSaving(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setEditingPhoto(url)
    }
    e.target.value = '' // Reset input so same file can be chosen again
  }

  const handleSaveCropped = async (croppedFile: File) => {
    setEditingPhoto(null)
    setErrorMsg('')
    setIsSaving(true)
    try {
      if (!supabaseAppDataService.uploadPhoto) throw new Error('Servicio de subida no disponible')
      const publicUrl = await supabaseAppDataService.uploadPhoto(croppedFile)
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

  const handleDeletePhoto = async (photoUrl: string, idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
    if (supabaseAppDataService.deletePhoto) {
      await supabaseAppDataService.deletePhoto(photoUrl)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] text-white">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/10">
        <button onClick={onBack} className="text-[var(--theme-color-1)] font-semibold active:scale-95 transition-all">
          Cancelar
        </button>
        <span className="font-extrabold text-lg tracking-tight">Editar perfil</span>
        <button onClick={handleSave} disabled={isSaving} className="text-[var(--theme-color-1)] font-bold active:scale-95 transition-all disabled:opacity-50">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--theme-color-1)] transition-colors"
              placeholder="¿Cómo te llamas?"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm font-medium">FECHA DE NACIMIENTO</label>
            <DatePicker value={birthdate} onChange={setBirthdate} />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Género</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--theme-color-1)] appearance-none">
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
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[var(--theme-color-1)] transition-colors resize-none"
              placeholder="Cuéntanos un poco sobre ti..."
              maxLength={150}
            />
            <div className="text-right text-white/40 text-xs mt-1">{bio.length}/150</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Intereses</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${tags.includes(tag) ? 'bg-[var(--theme-color-1)] border-[var(--theme-color-1)] text-white' : 'bg-white/5 border-white/20 text-white/60 hover:text-white'}`}
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
                    onClick={() => handleDeletePhoto(img, idx)}
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
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-white/40 cursor-pointer hover:bg-white/10 hover:border-[var(--theme-color-1)] transition-all"
              >
                <span className="text-3xl pb-1">+</span>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3 text-center">
              {images.length === 0 ? "Debes subir al menos una foto para que los demás puedan verte." : ""}
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3.5 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all text-sm"
          >
            Eliminar mi cuenta
          </button>
        </div>

      </div>

      {/* Photo Editor */}
      {editingPhoto && (
        <PhotoEditor 
          imageSrc={editingPhoto} 
          onCancel={() => setEditingPhoto(null)} 
          onSave={handleSaveCropped} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-white/10" style={{ background: '#18181f' }}>
            <h3 className="text-xl font-extrabold text-white mb-4">¿Eliminar cuenta?</h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              Esta acción es irreversible. Se borrarán permanentemente todas tus fotos, chats, matches y toda la información de tu perfil.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                   setShowDeleteConfirm(false)
                   const { supabase } = await import('../lib/supabase')
                   const { error } = await supabase.rpc('delete_user_account')
                   if (error) {
                      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', body: error.message } }))
                   } else {
                      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Cuenta eliminada', body: 'Tu cuenta ha sido borrada exitosamente.' } }))
                      supabase.auth.signOut()
                   }
                }}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



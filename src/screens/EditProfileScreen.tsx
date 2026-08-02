import { useState, useRef } from 'react'
import type { UserProfile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'

export function EditProfileScreen({
  user,
  onBack,
  onSave,
}: {
  user: UserProfile
  onBack: () => void
  onSave: (data: Partial<UserProfile>) => Promise<void>
}) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [images, setImages] = useState(user.images || [])
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (images.length === 0) {
      alert('Debes subir al menos 1 foto para poder continuar.')
      return
    }
    setIsSaving(true)
    await onSave({ name, bio, images })
    setIsSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSaving(true)
    const publicUrl = await supabaseAppDataService.uploadPhoto?.(file)
    if (publicUrl) {
      setImages((prev) => [...prev, publicUrl])
    } else {
      alert('Error al subir la foto. Revisa la conexión o prueba con otra imagen.')
    }
    setIsSaving(false)
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
        
        {/* Name input */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] transition-colors"
            placeholder="Tu nombre"
          />
        </div>

        {/* Bio input */}
        <div className="mb-6">
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

        <div className="mb-6">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Fotos</label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden relative">
                <img src={img} alt="Profile" className="w-full h-full object-cover" />
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
              className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-white/40 cursor-pointer hover:bg-white/10 transition-colors"
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
  )
}

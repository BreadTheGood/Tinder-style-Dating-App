import { useState } from 'react'
import type { UserProfile } from '../types'

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
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave({ name, bio })
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

        {/* Placeholder para fotos */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Fotos</label>
          <div className="grid grid-cols-3 gap-2">
            {user.images.map((img, idx) => (
              <div key={idx} className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden relative">
                <img src={img} alt="Profile" className="w-full h-full object-cover" />
                <button className="absolute bottom-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-xs pb-0.5">&times;</button>
              </div>
            ))}
            {/* Botón para añadir foto */}
            <div className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/40 text-3xl pb-1 cursor-pointer hover:bg-white/10 transition-colors">
              +
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3 text-center">La subida de fotos estará disponible muy pronto.</p>
        </div>

      </div>
    </div>
  )
}

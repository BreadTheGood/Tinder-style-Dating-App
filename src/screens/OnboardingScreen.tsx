import { useState, useRef } from 'react'
import type { UserProfile } from '../types'
import { supabaseAppDataService } from '../services/supabaseAppDataService'

export function OnboardingScreen({
  user,
  onComplete,
}: {
  user: UserProfile
  onComplete: (data: Partial<UserProfile>) => Promise<void>
}) {
  const [step, setStep] = useState(1)
  
  const [name, setName] = useState(user.name || '')
  const [birthdate, setBirthdate] = useState(user.birthdate || '')
  const [gender, setGender] = useState(user.gender || 'female')
  
  const [bio, setBio] = useState(user.bio || '')
  
  const [images, setImages] = useState<string[]>(user.images || [])
  
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNext = () => {
    if (step === 1) {
      if (!name || !birthdate) return alert('Por favor, completa todos los campos para continuar.')
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (images.length === 0) return alert('Debes subir al menos una foto para continuar.')
      setIsSaving(true)
      onComplete({ name, birthdate, gender, bio, images }).finally(() => setIsSaving(false))
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSaving(true)
    const publicUrl = await supabaseAppDataService.uploadPhoto?.(file)
    if (publicUrl) {
      setImages((prev) => [...prev, publicUrl])
    } else {
      alert('Error al subir la foto.')
    }
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] text-white">
      <div className="p-5 flex items-center justify-between border-b border-white/10">
         <div className="text-white/40 text-sm font-semibold">Paso {step} de 3</div>
         <span className="font-bold text-[#f304eb]">Completar Perfil</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6">Tus Datos</h2>
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] transition-colors" placeholder="Tu nombre" />
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
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-[#f304eb] transition-colors" placeholder="Cuéntanos un poco sobre tus gustos, hobbies..." maxLength={500} />
              <div className="text-right text-white/40 text-xs mt-1">{bio.length}/500</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6">Tus Fotos</h2>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="aspect-[3/4] bg-white/10 rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <img src={img} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ))}
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
              <div onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/40 cursor-pointer text-3xl pb-1 hover:bg-white/10 hover:border-[#f304eb] transition-all">
                +
              </div>
            </div>
            <p className="text-xs text-white/40 text-center mt-4">Sube al menos una foto para que los demás puedan verte.</p>
          </div>
        )}
      </div>
      
      <div className="p-5 border-t border-white/10 bg-[#0d0d0f]">
        <button onClick={handleNext} disabled={isSaving} className="w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#f304eb,#b004f3)' }}>
          {isSaving ? 'Guardando...' : step === 3 ? 'Comenzar a Swipear' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}

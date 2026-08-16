import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

// Helper to create a cropped image
const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<File | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const bBoxWidth =
    Math.abs(Math.cos(getRadianAngle(rotation)) * image.width) +
    Math.abs(Math.sin(getRadianAngle(rotation)) * image.height)
  const bBoxHeight =
    Math.abs(Math.sin(getRadianAngle(rotation)) * image.width) +
    Math.abs(Math.cos(getRadianAngle(rotation)) * image.height)

  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(getRadianAngle(rotation))
  ctx.translate(-image.width / 2, -image.height / 2)

  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    return null
  }

  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      if (file) {
        resolve(new File([file], 'cropped.jpeg', { type: 'image/jpeg' }))
      } else {
        resolve(null)
      }
    }, 'image/jpeg')
  })
}

interface PhotoEditorProps {
  imageSrc: string
  onCancel: () => void
  onSave: (croppedFile: File) => void
}

export function PhotoEditor({ imageSrc, onCancel, onSave }: PhotoEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      if (croppedFile) {
        onSave(croppedFile)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#050507' }}>
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
        />
      </div>
      <div className="bg-[#0d0d0f] p-6 pb-8 border-t border-white/10 space-y-6">
        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#f304eb]"
          />
        </div>
        <div>
          <label className="text-white/70 text-xs font-semibold mb-2 block">Rotación</label>
          <input
            type="range"
            value={rotation}
            min={0}
            max={360}
            step={1}
            aria-labelledby="Rotation"
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full accent-[#f304eb]"
          />
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4 rounded-xl font-bold text-white glass border border-white/10 active:scale-95 transition-transform">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 rounded-xl font-bold text-white active:scale-95 transition-transform disabled:opacity-50 gradient-brand">
            {isSaving ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

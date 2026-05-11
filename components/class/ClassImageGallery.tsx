'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  thumbnailUrl: string | null
  title: string
}

export default function ClassImageGallery({ images, thumbnailUrl, title }: Props) {
  const allImages = images.length > 0
    ? images
    : thumbnailUrl
    ? [thumbnailUrl]
    : []

  const [current, setCurrent] = useState(0)

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-gradient-to-br from-brand-blush/30 to-brand-mist/30 rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="text-6xl opacity-30">🎨</div>
      </div>
    )
  }

  const prev = () => setCurrent(i => (i - 1 + allImages.length) % allImages.length)
  const next = () => setCurrent(i => (i + 1) % allImages.length)

  return (
    <div className="space-y-2">
      {/* 메인 이미지 */}
      <div className="relative aspect-video bg-gradient-to-br from-brand-blush/30 to-brand-mist/30 rounded-2xl overflow-hidden group">
        <img
          src={allImages[current]}
          alt={`${title} ${current + 1}`}
          className="w-full h-full object-cover"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 썸네일 목록 */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-brand-amber' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <img src={img} alt={`썸네일 ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

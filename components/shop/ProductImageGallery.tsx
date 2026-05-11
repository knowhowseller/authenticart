'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  name: string
}

export default function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [current, setCurrent] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 flex items-center justify-center">
        <span className="text-6xl opacity-20">📦</span>
      </div>
    )
  }

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div className="space-y-3">
      {/* 메인 이미지 */}
      <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 group">
        <img src={images[current]} alt={`${name} ${current + 1}`} className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} className="text-brand-ink" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} className="text-brand-ink" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-brand-amber w-4' : 'bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 썸네일 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === current ? 'border-brand-amber' : 'border-brand-mist/30'
              }`}
            >
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

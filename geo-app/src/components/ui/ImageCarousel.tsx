'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageCarousel({ images }: { images?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const prev = () => setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="relative w-full h-64 sm:h-96 rounded-xl overflow-hidden mb-6 group bg-black/5 dark:bg-white/5">
      <img 
        src={images[currentIndex]} 
        alt={`Preview ${currentIndex + 1}`} 
        className="w-full h-full object-contain"
      />
      {images.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
            {images.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

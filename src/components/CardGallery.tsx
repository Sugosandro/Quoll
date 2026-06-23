'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

interface CardGalleryProps {
  images: string[]
  alt: string
}

const SWIPE_THRESHOLD = 40 // px minimi per cambiare immagine
const MOVE_TOLERANCE = 10 // px oltre i quali consideriamo il gesto uno swipe (non un tap)

/**
 * Carousel di immagini per la card del catalogo.
 * Mobile: swipe col dito per scorrere le foto; il tap apre la scheda prodotto.
 * Desktop: frecce al passaggio del mouse.
 * Quando si rileva uno swipe, il click di navigazione del <Link> genitore viene bloccato.
 */
export default function CardGallery({ images, alt }: CardGalleryProps) {
  const [idx, setIdx] = useState(0)
  const startX = useRef<number | null>(null)
  const swiped = useRef(false)
  const n = images.length

  if (n === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  const clamp = (i: number) => Math.max(0, Math.min(n - 1, i))

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    swiped.current = false
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return
    if (Math.abs(e.touches[0].clientX - startX.current) > MOVE_TOLERANCE) swiped.current = true
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      setIdx((i) => clamp(dx < 0 ? i + 1 : i - 1))
    }
  }

  // Se è appena avvenuto uno swipe, blocca la navigazione del Link genitore
  function onClickCapture(e: React.MouseEvent) {
    if (swiped.current) {
      e.preventDefault()
      e.stopPropagation()
      swiped.current = false
    }
  }

  // Frecce desktop: cambiano immagine senza navigare
  function go(e: React.MouseEvent, dir: -1 | 1) {
    e.preventDefault()
    e.stopPropagation()
    setIdx((i) => clamp(i + dir))
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ width: `${n * 100}%`, transform: `translateX(-${idx * (100 / n)}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="relative h-full" style={{ width: `${100 / n}%` }}>
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          {/* Pallini indicatori */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Frecce desktop (visibili all'hover, nascoste su touch) */}
          {idx > 0 && (
            <button
              type="button"
              onClick={(e) => go(e, -1)}
              aria-label="Immagine precedente"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {idx < n - 1 && (
            <button
              type="button"
              onClick={(e) => go(e, 1)}
              aria-label="Immagine successiva"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  )
}

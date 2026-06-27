'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImageSource } from '@sanity/image-url'
import VideoEmbed from '@/components/VideoEmbed'

function parseVideo(url: string): { platform: 'youtube' | 'vimeo'; id: string } | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { platform: 'youtube', id: yt[1] }
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return { platform: 'vimeo', id: vm[1] }
  return null
}

type GalleryItem =
  | { kind: 'image'; source: SanityImageSource; index: number }
  | { kind: 'video'; url: string; platform: 'youtube' | 'vimeo'; id: string }

interface ProductGalleryProps {
  immagini: SanityImageSource[]
  nome: string
  videoUrls?: string[]
}

export default function ProductGallery({ immagini, nome, videoUrls }: ProductGalleryProps) {
  const imgs = immagini ?? []
  const vids = videoUrls ?? []
  const items: GalleryItem[] = [
    ...imgs.map((source, index) => ({ kind: 'image' as const, source, index })),
    ...vids
      .map((url) => { const p = parseVideo(url); return p ? { kind: 'video' as const, url, ...p } : null })
      .filter((x): x is GalleryItem & { kind: 'video' } => x !== null),
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const active = items[activeIndex]
  const isVideo = active?.kind === 'video'

  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + items.length) % items.length), [items.length])
  const next = useCallback(() => setActiveIndex((i) => (i + 1) % items.length), [items.length])

  // Le immagini occupano i primi indici di `items`, quindi activeIndex coincide con la
  // posizione tra le immagini quando l'elemento attivo è un'immagine (es. nel lightbox).
  const imageCount = imgs.length
  const prevImage = useCallback(() => setActiveIndex((i) => (i - 1 + imageCount) % imageCount), [imageCount])
  const nextImage = useCallback(() => setActiveIndex((i) => (i + 1) % imageCount), [imageCount])

  // Swipe touch (mobile): scorre tra le immagini. Distingue lo swipe dal tap e
  // ignora i gesti prevalentemente verticali (così lo scroll della pagina resta libero).
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    swiped.current = false
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return
    if (Math.abs(e.touches[0].clientX - touchStart.current.x) > 10) swiped.current = true
  }, [])
  const handleSwipeEnd = useCallback(
    (e: React.TouchEvent, goPrev: () => void, goNext: () => void) => {
      const s = touchStart.current
      touchStart.current = null
      if (!s) return
      const dx = e.changedTouches[0].clientX - s.x
      const dy = e.changedTouches[0].clientY - s.y
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext()
        else goPrev()
      }
    },
    []
  )

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prevImage, nextImage])

  if (items.length === 0) return null

  return (
    <>
      <div className="space-y-3">
        {/* Main display */}
        <div
          className={`relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 ${!isVideo ? 'cursor-zoom-in' : ''}`}
          onClick={() => {
            if (swiped.current) { swiped.current = false; return } // era uno swipe, non aprire lo zoom
            if (!isVideo) setLightbox(true)
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={(e) => handleSwipeEnd(e, prev, next)}
        >
          {/* Nastro scorrevole: stessa animazione del catalogo */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ width: `${items.length * 100}%`, transform: `translateX(-${activeIndex * (100 / items.length)}%)` }}
          >
            {items.map((item, i) => (
              <div key={i} className="relative h-full" style={{ width: `${100 / items.length}%` }}>
                {item.kind === 'image' ? (
                  <Image
                    src={urlFor(item.source).width(900).height(900).fit('crop').auto('format').url()}
                    alt={`${nome} - immagine ${item.index + 1}`}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <VideoEmbed
                      platform={item.platform}
                      id={item.id}
                      title={`Video ${nome}`}
                      className="relative w-full aspect-video"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isVideo && (
            <div className="absolute bottom-2 right-2 bg-black/40 text-white rounded-lg p-1.5 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          )}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                aria-label="Precedente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                aria-label="Successiva"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item, i) => (
              <button key={i} onClick={() => setActiveIndex(i)}
                className={`relative flex-none w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeIndex ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'}`}>
                {item.kind === 'image' ? (
                  <Image src={urlFor(item.source).width(160).height(160).fit('crop').auto('format').url()}
                    alt={`${nome} thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    {item.platform === 'youtube' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://img.youtube.com/vi/${item.id}/mqdefault.jpg`}
                        alt="video" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    )}
                    {item.platform === 'vimeo' && <div className="absolute inset-0 bg-blue-800/80" />}
                    <svg className="relative z-10 w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && active?.kind === 'image' && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <div className="relative w-full h-full max-w-5xl max-h-screen overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={(e) => handleSwipeEnd(e, prevImage, nextImage)}>
            {/* Nastro scorrevole anche a schermo intero */}
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ width: `${imageCount * 100}%`, transform: `translateX(-${activeIndex * (100 / imageCount)}%)` }}
            >
              {imgs.map((source, i) => (
                <div key={i} className="relative h-full p-4" style={{ width: `${100 / imageCount}%` }}>
                  <Image
                    src={urlFor(source).width(1800).height(1800).fit('max').auto('format').url()}
                    alt={`${nome} - fullscreen ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Close */}
          <button onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Nav arrows */}
          {imageCount > 1 && (
            <>
              <button onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/40 rounded-full p-3 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/40 rounded-full p-3 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

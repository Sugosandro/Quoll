'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import type { HeroSlide } from '@/types/miniatura'
import VideoEmbed from '@/components/VideoEmbed'

function parseVideo(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { platform: 'youtube' as const, id: yt[1] }
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return { platform: 'vimeo' as const, id: vm[1] }
  return null
}

function SlideBackground({ slide }: { slide: HeroSlide | undefined }) {
  const video = slide?.videoUrl ? parseVideo(slide.videoUrl) : null
  const imageUrl = slide?.immagine
    ? urlFor(slide.immagine).width(1920).height(1080).fit('crop').auto('format').url()
    : null
  if (video) return (
    <VideoEmbed platform={video.platform} id={video.id}
      className="absolute inset-0 w-full h-full scale-110" background title="hero video" />
  )
  if (imageUrl) return (
    <Image src={imageUrl} alt={slide?.titolo ?? ''} fill priority sizes="100vw" className="object-cover" />
  )
  return <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')" }} />
}

interface HeroCarouselProps { slides: HeroSlide[] }

const DURATION = 650

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const n = slides.length

  // Nastro infinito: [clone_ultimo, slide_0, slide_1, ..., clone_primo]
  const strip = n > 1 ? [slides[n - 1], ...slides, slides[0]] : slides
  const stripLen = strip.length

  // vIdx: posizione corrente nel nastro (parte da 1 = il primo slide reale)
  const [vIdx, setVIdx] = useState(n > 1 ? 1 : 0)
  const [jumping, setJumping] = useState(false) // true durante il salto invisibile
  const [paused, setPaused] = useState(false)
  const busy = useRef(false)
  const vIdxRef = useRef(n > 1 ? 1 : 0)

  const realIdx = n > 1 ? ((vIdx - 1 + n) % n) : 0

  const moveTo = useCallback((target: number) => {
    if (busy.current || n <= 1) return
    busy.current = true
    vIdxRef.current = target
    setVIdx(target)

    setTimeout(() => {
      // Se siamo sul clone del primo (fine nastro), saltiamo al vero primo
      if (target >= stripLen - 1) {
        setJumping(true)
        vIdxRef.current = 1
        setVIdx(1)
        setTimeout(() => { setJumping(false); busy.current = false }, 30)
      // Se siamo sul clone dell'ultimo (inizio nastro), saltiamo al vero ultimo
      } else if (target <= 0) {
        setJumping(true)
        vIdxRef.current = n
        setVIdx(n)
        setTimeout(() => { setJumping(false); busy.current = false }, 30)
      } else {
        busy.current = false
      }
    }, DURATION)
  }, [n, stripLen])

  const next = useCallback(() => moveTo(vIdxRef.current + 1), [moveTo])
  const prev = useCallback(() => moveTo(vIdxRef.current - 1), [moveTo])

  useEffect(() => {
    if (n <= 1 || paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [n, paused, next])

  const titolo    = slides[realIdx]?.titolo ?? 'Stampa 3D'
  const sottotitolo = slides[realIdx]?.sottotitolo

  return (
    <div className="relative h-full overflow-hidden bg-gray-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Nastro */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        width: `${stripLen * 100}%`,
        height: '100%',
        transform: `translateX(-${vIdx * (100 / stripLen)}%)`,
        transition: jumping ? 'none' : `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: 'transform',
      }}>
        {strip.map((s, i) => (
          <div key={i} style={{
            position: 'relative',
            width: `${100 / stripLen}%`,
            height: '100%',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <SlideBackground slide={s} />
          </div>
        ))}
      </div>

      {/* Overlay scuro */}
      <div className="absolute inset-0 bg-gray-950/65" style={{ zIndex: 2 }} />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        zIndex: 2,
      }} />

      {/* Testo */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center" style={{ zIndex: 3 }}>
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-widest uppercase animate-fade-up">
          Stampa 3D professionale
        </span>
        <h1 className="text-5xl sm:text-7xl font-bold text-white leading-tight animate-fade-up" style={{ animationDelay: '80ms' }}>
          {titolo}<br /><span className="text-indigo-400">su ordinazione</span>
        </h1>
        <p className="mt-5 text-lg text-gray-300 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '160ms' }}>
          {sottotitolo ?? <>Dai vita alle tue idee.<br className="hidden sm:block" />Ogni pezzo stampato e rifinito con cura.</>}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: '240ms' }}>
          <Link href="/catalogo"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-colors shadow-lg shadow-indigo-900/40">
            Esplora il catalogo
          </Link>
          <Link href="/calcolatore"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold text-base transition-colors backdrop-blur">
            Calcola il prezzo
          </Link>
          <a href="https://wa.me/393338479871" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold text-base transition-colors backdrop-blur">
            Richiedi un preventivo
          </a>
        </div>
      </div>

      {/* Frecce */}
      {n > 1 && (
        <>
          <button onClick={prev} aria-label="Slide precedente"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 text-white rounded-full p-3 transition-colors"
            style={{ zIndex: 4 }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={next} aria-label="Slide successiva"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 text-white rounded-full p-3 transition-colors"
            style={{ zIndex: 4 }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {n > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 4 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => moveTo(i + 1)} aria-label={`Vai a slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === realIdx ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-up"
        style={{ animationDelay: '400ms', zIndex: 4 }}>
        <span className="text-xs text-white/40 tracking-widest uppercase">Scorri</span>
        <svg className="w-5 h-5 text-white/40" style={{ animation: 'scrollBounce 1.6s ease-in-out infinite' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface HeroCarouselProps {
  slides: HeroSlide[]
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const hasSlides = slides.length > 0

  const next = useCallback(() => setCurrent(i => (i + 1) % Math.max(slides.length, 1)), [slides.length])
  const prev = useCallback(() => setCurrent(i => (i - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [slides.length, paused, next])

  const slide = slides[current]
  const video = slide?.videoUrl ? parseVideo(slide.videoUrl) : null
  const imageUrl = slide?.immagine
    ? urlFor(slide.immagine).width(1920).height(1080).fit('crop').auto('format').url()
    : null

  const titolo = slide?.titolo ?? 'Stampa 3D'
  const sottotitolo = slide?.sottotitolo

  return (
    <div
      className="relative h-full overflow-hidden bg-gray-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background — cambia con le slide */}
      <div key={current} className="absolute inset-0" style={{ animation: 'fadeIn 0.7s ease' }}>
        {video ? (
          <VideoEmbed
            platform={video.platform}
            id={video.id}
            className="absolute inset-0 w-full h-full scale-110"
            background
            title="hero video"
          />
        ) : imageUrl ? (
          <Image src={imageUrl} alt={titolo} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero.jpg')" }}
          />
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-950/65" />
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Testo hero */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-widest uppercase animate-fade-up">
          Stampa 3D professionale
        </span>
        <h1 className="text-5xl sm:text-7xl font-bold text-white leading-tight animate-fade-up" style={{ animationDelay: '80ms' }}>
          {titolo}<br />
          <span className="text-indigo-400">su ordinazione</span>
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
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold text-base transition-colors backdrop-blur">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Calcola il prezzo
          </Link>
          <a href="https://wa.me/393338479871" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold text-base transition-colors backdrop-blur">
            Richiedi un preventivo
          </a>
        </div>
      </div>

      {/* Frecce (solo con più slide) */}
      {hasSlides && slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Slide precedente"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 text-white rounded-full p-3 transition-colors z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={next} aria-label="Slide successiva"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/55 text-white rounded-full p-3 transition-colors z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {hasSlides && slides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} aria-label={`Vai a slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-up" style={{ animationDelay: '400ms' }}>
        <span className="text-xs text-white/40 tracking-widest uppercase">Scorri</span>
        <svg className="w-5 h-5 text-white/40" style={{ animation: 'scrollBounce 1.6s ease-in-out infinite' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

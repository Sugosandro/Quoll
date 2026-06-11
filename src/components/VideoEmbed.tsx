'use client'
import { useState } from 'react'

interface VideoEmbedProps {
  platform: 'youtube' | 'vimeo'
  id: string
  title?: string
  className?: string
  background?: boolean
}

export default function VideoEmbed({
  platform,
  id,
  title,
  className = '',
  background = false,
}: VideoEmbedProps) {
  const [active, setActive] = useState(background)

  function embedUrl() {
    if (platform === 'youtube') {
      if (background) {
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&playsinline=1`
      }
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${id}&playsinline=1`
    }
    if (background) {
      return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1`
    }
    return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&color=6366f1&title=0&byline=0&portrait=0`
  }

  if (active) {
    return (
      <iframe
        src={embedUrl()}
        className={className}
        style={{ border: 'none', ...(background ? { pointerEvents: 'none' } : {}) }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen={!background}
        title={title ?? 'Video'}
      />
    )
  }

  const thumbnailUrl = platform === 'youtube'
    ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    : null

  return (
    <div
      className={`group cursor-pointer overflow-hidden ${className}`}
      onClick={() => setActive(true)}
    >
      {thumbnailUrl
        ? <img src={thumbnailUrl} alt={title ?? 'Video'} className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-gray-900" />
      }
      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl">
          <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

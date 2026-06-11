'use client'

import { useEffect, useRef } from 'react'

interface ModelViewerProps {
  src: string
  poster?: string
}

export default function ModelViewer({ src, poster }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    async function setup() {
      // 1. Carica model-viewer
      await import('@google/model-viewer')

      // 2. Configura Meshopt decoder PRIMA di creare l'elemento
      try {
        const { MeshoptDecoder } = await import('meshoptimizer')
        await MeshoptDecoder.ready  // aspetta che il WASM sia caricato
        const ModelViewerElement = customElements.get('model-viewer') as any
        if (ModelViewerElement) {
          // Passa il decoder già inizializzato (non la Promise vuota .ready)
          ModelViewerElement.meshoptDecoder = Promise.resolve(MeshoptDecoder)
        }
      } catch {
        // meshoptimizer non disponibile — file senza Meshopt funzionano comunque
      }

      if (cancelled) return

      // 3. Solo ora crea l'elemento (il decoder è già pronto)
      const el = document.createElement('model-viewer')
      el.setAttribute('src', src)
      if (poster) el.setAttribute('poster', poster)
      el.setAttribute('alt', 'Visualizzazione 3D della miniatura')
      el.setAttribute('auto-rotate', '')
      el.setAttribute('camera-controls', '')
      el.setAttribute('shadow-intensity', '4')
      el.setAttribute('shadow-softness', '0.25')
      el.setAttribute('exposure', '0.44')
      el.setAttribute('environment-image', 'neutral')
      el.setAttribute('tone-mapping', 'neutral')
      el.style.cssText = 'width:100%;height:420px;display:block;background:linear-gradient(160deg,#d6d6d8 0%,#c8c8cc 100%);'
      container.appendChild(el)
    }

    setup()

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [src, poster])

  return (
    <div className="w-full rounded-xl overflow-hidden bg-[#c8c8cc] border border-gray-300">
      <div ref={containerRef} />
      <p className="text-xs text-center text-gray-500 py-2">
        Trascina per ruotare · Pizzica per zoomare
      </p>
    </div>
  )
}

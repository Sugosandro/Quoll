'use client'

import { useEffect, useState } from 'react'

const WHATSAPP_NUMBER = '393338479871'

/**
 * Pagina-ponte verso WhatsApp.
 * Serve a contare i click come visualizzazioni di pagina in Vercel Web Analytics:
 * ogni apertura di "/vai/whatsapp" è una pageview, quindi nella sezione "Pages"
 * vedi quante persone hanno cliccato un pulsante WhatsApp (anche col piano gratuito).
 * Legge il testo precompilato dal parametro `text` e reindirizza al numero.
 */
export default function VaiWhatsApp() {
  const [target, setTarget] = useState(`https://wa.me/${WHATSAPP_NUMBER}`)

  useEffect(() => {
    const text = new URLSearchParams(window.location.search).get('text')
    const url = text
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
      : `https://wa.me/${WHATSAPP_NUMBER}`
    setTarget(url)
    // Breve attesa per dar tempo al beacon di analytics di partire, poi redirect
    const t = setTimeout(() => window.location.replace(url), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      <p className="text-gray-600">Ti sto reindirizzando a WhatsApp…</p>
      <a href={target} className="text-sm font-medium text-green-600 hover:text-green-700 underline">
        Se non vieni reindirizzato, clicca qui
      </a>
    </div>
  )
}

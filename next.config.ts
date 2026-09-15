import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
    // Le immagini arrivano già ridimensionate/ottimizzate da Sanity (width/height/auto-format
    // sono già nell'URL, vedi src/sanity/lib/image.ts) — farle ripassare anche dal servizio a
    // pagamento di Vercel è ridondante e ha esaurito la quota gratuita mensile (errore 402),
    // rompendo il caricamento delle immagini in produzione. Disattivato: next/image ora renderizza
    // un <img> diretto verso Sanity invece di proxare tramite /_next/image.
    unoptimized: true,
  },
}

export default nextConfig

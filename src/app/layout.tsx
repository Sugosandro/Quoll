import type { Metadata } from 'next'
import { Geist, Cinzel } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { SITE_URL } from '@/lib/siteUrl'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Quoll · Miniature 3D per D&D e tabletop, stampate a Roma',
  description: 'Miniature stampate in 3D per D&D e altri giochi da tavolo: personaggi, mostri, veicoli ed edifici fantasy, sci-fi, storici e horror. Prodotte a Roma su ordinazione, spedizioni in tutta Italia.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Quoll · Miniature 3D per D&D e tabletop, stampate a Roma',
    description: 'Miniature stampate in 3D per D&D e altri giochi da tavolo: personaggi, mostri, veicoli ed edifici fantasy, sci-fi, storici e horror. Prodotte a Roma su ordinazione, spedizioni in tutta Italia.',
    images: [{ url: '/logo.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${geist.variable} ${cinzel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <GoogleAnalytics />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

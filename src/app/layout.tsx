import type { Metadata } from 'next'
import { Geist, Cinzel } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: 'Quoll · Stampa 3D professionale su ordinazione',
  description: 'Miniature 3D stampate in PLA e resina su ordinazione: personaggi, veicoli, edifici fantasy, sci-fi, storici e horror.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Quoll · Stampa 3D professionale su ordinazione',
    description: 'Miniature 3D stampate in PLA e resina su ordinazione: personaggi, veicoli, edifici fantasy, sci-fi, storici e horror.',
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

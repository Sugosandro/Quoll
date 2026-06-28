import type { Metadata } from 'next'

// Pagina-ponte tecnica: non deve finire nei motori di ricerca
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function VaiWhatsAppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

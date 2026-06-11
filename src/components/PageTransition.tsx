'use client'

import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div key={path} style={{ animation: 'pageFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
      {children}
    </div>
  )
}

import CalcolatoreClient from '@/components/CalcolatoreClient'
import { getProfiliPrezzo } from '@/sanity/lib/queries'
import Link from 'next/link'

export const revalidate = 60

export default async function AdminCalcolatorePage() {
  const profili = await getProfiliPrezzo(false) // tutti i profili, anche admin-only

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calcolatore costi</h1>
            <p className="text-sm text-gray-400 mt-0.5">Calcolo interno — non visibile agli utenti</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Gestisci profili →
            </Link>
            <Link href="/admin" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
        <CalcolatoreClient profili={profili} />
      </div>
    </div>
  )
}

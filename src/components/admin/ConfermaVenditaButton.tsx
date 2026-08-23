'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfermaVenditaButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function convert() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/converti-vendita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Errore')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      setError('Errore di rete')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={convert}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Creo ordine…' : 'Crea ordine ufficiale'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

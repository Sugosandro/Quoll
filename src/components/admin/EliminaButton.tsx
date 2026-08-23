'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EliminaButton({
  id,
  endpoint,
  conferma = 'Eliminare questa voce? Non si può annullare.',
}: {
  id: string
  endpoint: string
  conferma?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function elimina() {
    if (!window.confirm(conferma)) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
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
    <span className="inline-flex items-center gap-1">
      <button
        onClick={elimina}
        disabled={loading}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-base text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Elimina"
      >
        {loading ? '…' : '🗑'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}

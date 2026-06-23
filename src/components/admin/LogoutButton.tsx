'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/admin-login', { method: 'DELETE' })
    } catch {
      // ignora: procediamo comunque al redirect
    }
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="text-sm text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Esco…' : 'Esci'}
    </button>
  )
}

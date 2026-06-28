'use client'

import { useState } from 'react'
import type { Variante } from '@/types/miniatura'

interface VariantSelectorProps {
  varianti: Variante[]
  nomeMiniatura: string
}

function isValidSconto(v: Variante): boolean {
  if (v.prezzoScontato == null || v.prezzoScontato >= v.prezzo) return false
  if (!v.scadenzaSconto) return true
  return new Date(v.scadenzaSconto) > new Date()
}

function formatScadenza(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'Scade tra < 1h'
  if (hours < 48) return `Scade tra ${hours}h`
  if (days < 7) return `Scade tra ${days}g ${Math.floor((diff - days * 86400000) / 3600000)}h`
  const d = new Date(iso)
  return `Scade il ${d.getDate()}/${d.getMonth() + 1}`
}

export default function VariantSelector({ varianti, nomeMiniatura }: VariantSelectorProps) {
  const available = varianti.filter((v) => v.disponibilita !== 'esaurito')
  const [selected, setSelected] = useState<Variante | null>(available[0] ?? null)

  const whatsappText = encodeURIComponent(
    `Ciao! Sono interessato alla miniatura "${nomeMiniatura}"${selected ? ` - variante: ${selected.nome}` : ''}. Potete darmi più informazioni?`
  )
  const whatsappUrl = `/vai/whatsapp?text=${whatsappText}`

  const scontoValido = selected ? isValidSconto(selected) : false

  return (
    <div className="space-y-5">
      {varianti.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Scegli variante</p>
          <div className="flex flex-wrap gap-2">
            {varianti.map((v) => {
              const isEsaurito = v.disponibilita === 'esaurito'
              const isUltimi = v.disponibilita === 'ultimi'
              const isSelected = selected?._key === v._key
              const hasSconto = isValidSconto(v)
              return (
                <button
                  key={v._key}
                  onClick={() => !isEsaurito && setSelected(v)}
                  disabled={isEsaurito}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isEsaurito
                      ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 line-through'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <span>{v.nome}</span>
                  {v.materiale && (
                    <span className="ml-1.5 text-xs opacity-60">({v.materiale})</span>
                  )}
                  {hasSconto && (
                    <span className="ml-1.5 text-xs font-bold text-red-500">
                      -{Math.round((1 - v.prezzoScontato! / v.prezzo) * 100)}%
                    </span>
                  )}
                  {isUltimi && (
                    <span className="ml-1.5 text-xs font-semibold text-orange-500">
                      {v.quantita != null ? `ultimi ${v.quantita}` : 'ultimi pezzi'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selected && (
        <div className="bg-indigo-50 rounded-xl p-4 space-y-1">
          <p className="text-xs text-indigo-500 font-medium">Prezzo selezionato</p>
          <div className="flex items-baseline gap-3">
            {scontoValido ? (
              <>
                <p className="text-2xl font-bold text-red-500">
                  €{selected.prezzoScontato!.toFixed(2)}
                </p>
                <p className="text-base text-gray-400 line-through">
                  €{selected.prezzo.toFixed(2)}
                </p>
                <span className="text-xs font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                  -{Math.round((1 - selected.prezzoScontato! / selected.prezzo) * 100)}%
                </span>
              </>
            ) : (
              <p className="text-2xl font-bold text-indigo-700">€{selected.prezzo.toFixed(2)}</p>
            )}
          </div>
          {scontoValido && selected.scadenzaSconto && (
            <p className="text-xs text-orange-500 font-medium">
              {formatScadenza(selected.scadenzaSconto)}
            </p>
          )}
          {selected.disponibilita === 'ultimi' && (
            <p className="text-xs text-orange-500 font-medium">
              {selected.quantita != null ? `Ultimi ${selected.quantita} pezzi disponibili` : 'Ultimi pezzi disponibili'}
            </p>
          )}
          {selected.materiale && (
            <p className="text-sm text-indigo-400">{selected.materiale}</p>
          )}
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Contattami su WhatsApp
      </a>
    </div>
  )
}

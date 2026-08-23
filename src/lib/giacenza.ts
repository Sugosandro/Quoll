import type { MovimentoGiacenza, GiacenzaNegozio } from '@/types/negozio'
import type { MiniatureListItem } from '@/types/miniatura'

/**
 * Calcola la giacenza attuale per miniatura/variante sommando lo storico dei
 * movimenti (consegne positive, ritiri/vendite negative), invece di leggere
 * un singolo numero sovrascrivibile: così non si perde la storia dei movimenti.
 */
export function computeGiacenzaCorrente(movimenti: MovimentoGiacenza[]): GiacenzaNegozio[] {
  const map = new Map<string, GiacenzaNegozio>()
  for (const m of movimenti) {
    if (!m.miniatura) continue
    const key = `${m.miniatura._id}::${m.varianteNome ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.quantita += m.quantita
    } else {
      map.set(key, {
        _key: key,
        miniatura: m.miniatura,
        varianteNome: m.varianteNome,
        quantita: m.quantita,
      })
    }
  }
  return Array.from(map.values()).filter((g) => g.quantita > 0)
}

/** Arricchisce le righe di giacenza con il prezzo attuale della variante, per mostrarlo nell'interfaccia. */
export function arricchisciConPrezzo(righe: GiacenzaNegozio[], miniature: MiniatureListItem[]): GiacenzaNegozio[] {
  const byId = new Map(miniature.map((m) => [m._id, m]))
  return righe.map((riga) => {
    const mini = riga.miniatura ? byId.get(riga.miniatura._id) : undefined
    const variante = mini?.varianti?.find((v) => v.nome === riga.varianteNome)
    return variante ? { ...riga, prezzo: variante.prezzo, prezzoScontato: variante.prezzoScontato } : riga
  })
}

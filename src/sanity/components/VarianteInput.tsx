import { useCallback, useEffect, useState } from 'react'
import { set, unset, useClient, useFormValue, type StringInputProps } from 'sanity'
import { Select, Stack, TextInput } from '@sanity/ui'

const CUSTOM = '__custom__'

/**
 * Input personalizzato per il campo "varianteNome" dell'ordine.
 * Legge la miniatura referenziata nell'ordine, ne carica le varianti e le
 * propone in un menu a tendina. L'opzione "Personalizzata" sblocca un campo
 * di testo libero per richieste fuori catalogo.
 * Il valore salvato resta una semplice stringa (nessuna migrazione necessaria).
 */
export function VarianteInput(props: StringInputProps) {
  const { value, onChange, elementProps } = props
  const ref = useFormValue(['miniatura']) as { _ref?: string } | undefined
  const client = useClient({ apiVersion: '2024-01-01' })

  const [varianti, setVarianti] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [custom, setCustom] = useState(false)

  const miniaturaId = ref?._ref

  useEffect(() => {
    let active = true
    if (!miniaturaId) {
      setVarianti([])
      return
    }
    setLoading(true)
    client
      .fetch<string[]>(`*[_id == $id][0].varianti[].nome`, { id: miniaturaId })
      .then((names) => {
        if (!active) return
        const list = (names ?? []).filter(Boolean)
        setVarianti(list)
        // Se il valore attuale non è tra le varianti note ed è valorizzato, è custom
        if (value && !list.includes(value)) setCustom(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // value escluso di proposito: non vogliamo resettare lo stato custom a ogni digitazione
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miniaturaId, client])

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.currentTarget.value
      if (v === CUSTOM) {
        setCustom(true)
        onChange(unset())
        return
      }
      setCustom(false)
      onChange(v ? set(v) : unset())
    },
    [onChange]
  )

  const handleText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.currentTarget.value
      onChange(v ? set(v) : unset())
    },
    [onChange]
  )

  const selectValue = custom ? CUSTOM : value && varianti.includes(value) ? value : ''

  const placeholder = !miniaturaId
    ? 'Seleziona prima una miniatura'
    : loading
    ? 'Caricamento varianti…'
    : 'Seleziona variante…'

  return (
    <Stack space={2}>
      <Select {...elementProps} value={selectValue} onChange={handleSelect} disabled={loading && !!miniaturaId}>
        <option value="">{placeholder}</option>
        {varianti.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value={CUSTOM}>✏️ Personalizzata…</option>
      </Select>
      {custom && (
        <TextInput
          value={value ?? ''}
          onChange={handleText}
          placeholder="Descrivi la variante richiesta dal cliente…"
        />
      )}
    </Stack>
  )
}

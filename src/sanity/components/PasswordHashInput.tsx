import { useCallback, useState } from 'react'
import { set, type StringInputProps } from 'sanity'
import { Stack, Text, TextInput } from '@sanity/ui'
import { hashNegozioPassword } from '@/lib/negozioAuth'

/**
 * Input personalizzato per il campo `passwordHash` del negozio.
 * L'admin scrive la password in chiaro; viene cifrata (SHA-256) e sostituita
 * prima di essere salvata sul documento, perché il dataset Sanity è pubblico
 * in lettura e un campo password in chiaro sarebbe interrogabile da chiunque.
 * Il valore già salvato (l'hash) non viene mai ri-mostrato: il campo si
 * comporta come un vero "set new password", non come un editor di testo.
 */
export function PasswordHashInput(props: StringInputProps) {
  const { value, onChange } = props
  const [draft, setDraft] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const commit = useCallback(async () => {
    if (!draft) return
    const hash = await hashNegozioPassword(draft)
    onChange(set(hash))
    setDraft('')
    setJustSaved(true)
  }, [draft, onChange])

  return (
    <Stack space={2}>
      <TextInput
        value={draft}
        placeholder="Scrivi una nuova password per impostarla…"
        onChange={(e) => {
          setDraft(e.currentTarget.value)
          setJustSaved(false)
        }}
        onBlur={commit}
      />
      <Text size={1} muted>
        {justSaved
          ? '✓ Nuova password salvata (cifrata).'
          : value
          ? 'Una password è già impostata. Scrivine una nuova qui sopra ed esci dal campo per sostituirla.'
          : 'Nessuna password impostata: il negozio non potrà accedere finché non ne scrivi una.'}
      </Text>
    </Stack>
  )
}

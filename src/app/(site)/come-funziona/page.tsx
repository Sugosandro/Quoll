import type { Metadata } from 'next'
import Link from 'next/link'
import AnimateIn from '@/components/AnimateIn'

export const metadata: Metadata = {
  title: 'Come funziona · Quoll',
  description: 'Come ordinare le tue miniature 3D stampate su ordinazione: scegli, contatta, personalizza e ricevi.',
}

const STEPS = [
  {
    n: '01',
    title: 'Scegli dal catalogo',
    desc: 'Sfoglia le miniature disponibili, filtra per genere e tipo, guarda le foto e l\'anteprima 3D. Ogni scheda mostra materiali, scala e prezzi delle varianti.',
  },
  {
    n: '02',
    title: 'Scrivimi su WhatsApp',
    desc: 'Clicca "Contattami su WhatsApp" direttamente dalla pagina della miniatura che ti interessa. Il messaggio parte già precompilato con il nome e la variante scelta.',
  },
  {
    n: '03',
    title: 'Concordiamo i dettagli',
    desc: 'Discutiamo materiale, colori, eventuali personalizzazioni e tempi di consegna. Puoi richiedere modifiche alla miniatura o portare un tuo file STL.',
  },
  {
    n: '04',
    title: 'Stampo e rifinisco',
    desc: 'Ogni pezzo viene stampato e rifinito con cura. A seconda della variante scelta, la miniatura arriva grezza, con primer o dipinta a mano.',
  },
  {
    n: '05',
    title: 'Consegna',
    desc: 'Concordiamo insieme la modalità di consegna: ritiro di persona o spedizione. Ti aggiornerò sullo stato della lavorazione direttamente su WhatsApp.',
  },
]

const FAQ = [
  { q: 'Quanto tempo ci vuole?', a: 'Dipende dalla complessità e dalla finitura. Una miniatura grezza in PLA in genere è pronta in 2-4 giorni. Le versioni dipinte richiedono più tempo.' },
  { q: 'Posso portare il mio file STL?', a: 'Sì, assolutamente. Inviami il file su WhatsApp e valutiamo insieme fattibilità, materiale e prezzo.' },
  { q: 'Quali materiali usi?', a: 'PLA per la maggior parte delle miniature (robusto, disponibile in tanti colori) e resina per i dettagli più fini.' },
  { q: 'Posso richiedere una miniatura personalizzata?', a: 'Certo. Guarda la pagina Personalizzazioni per saperne di più.' },
  { q: 'È possibile la spedizione?', a: 'Sì. Possiamo accordarci per spedire la miniatura tramite corriere. Il costo di spedizione viene concordato a parte in base al peso e alla destinazione. Scrivimi su WhatsApp per un preventivo completo.' },
]

export default function ComeFunzionaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <AnimateIn>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Come funziona</h1>
        <p className="text-gray-500 text-lg mb-14">
          Ordinare una miniatura è semplice. Tutto passa da WhatsApp — nessun carrello, nessuna registrazione.
        </p>
      </AnimateIn>

      {/* Steps */}
      <div className="space-y-10 mb-20">
        {STEPS.map((s, i) => (
          <AnimateIn key={s.n} delay={i * 80}>
            <div className="flex gap-6">
              <div className="flex-none w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {s.n}
              </div>
              <div className="pt-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{s.title}</h2>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          </AnimateIn>
        ))}
      </div>

      {/* FAQ */}
      <AnimateIn>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Domande frequenti</h2>
      </AnimateIn>
      <div className="space-y-5 mb-14">
        {FAQ.map((f, i) => (
          <AnimateIn key={i} delay={i * 60}>
            <div className="border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-800 mb-1">{f.q}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
            </div>
          </AnimateIn>
        ))}
      </div>

      {/* CTA */}
      <AnimateIn>
        <div className="bg-indigo-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Pronto a iniziare?</h2>
          <p className="text-indigo-200 mb-6">Sfoglia il catalogo e scrivi per la tua miniatura.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/catalogo"
              className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors">
              Vai al catalogo
            </Link>
            <a href="/vai/whatsapp" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors">
              Scrivimi su WhatsApp
            </a>
          </div>
        </div>
      </AnimateIn>
    </div>
  )
}

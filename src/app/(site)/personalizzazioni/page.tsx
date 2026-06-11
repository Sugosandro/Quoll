import type { Metadata } from 'next'
import AnimateIn from '@/components/AnimateIn'

export const metadata: Metadata = {
  title: 'Personalizzazioni · Quoll',
  description: 'Miniature 3D personalizzate su misura: porta il tuo file STL o descrivi quello che hai in mente.',
}

const OPZIONI = [
  { icon: '📐', title: 'File STL proprio', desc: 'Hai già un modello? Inviamelo e lo stampo per te nel materiale e nella finitura che preferisci.' },
  { icon: '🎨', title: 'Colorazione personalizzata', desc: 'Posso dipingere la miniatura con i colori che vuoi, seguendo le tue indicazioni o una reference image.' },
  { icon: '📏', title: 'Scala su misura', desc: 'Vuoi una miniatura più grande o più piccola dello standard? Possiamo adattare la scala del modello.' },
  { icon: '⚙️', title: 'Modifiche al modello', desc: 'Modifiche semplici come aggiungere una base, cambiare un\'arma o unire più modelli. Valuto caso per caso.' },
  { icon: '🏰', title: 'Scenografie e diorami', desc: 'Edifici, terreni, accessori per giochi da tavolo. Se hai un\'idea, parliamone.' },
]

export default function PersonalizzazioniPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <AnimateIn>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Personalizzazioni</h1>
        <p className="text-gray-500 text-lg mb-14">
          Hai qualcosa di specifico in mente? Posso realizzarlo. Dalla miniatura standard modificata al progetto completamente custom.
        </p>
      </AnimateIn>

      {/* Opzioni */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {OPZIONI.map((o, i) => (
          <AnimateIn key={i} delay={i * 70}>
            <div className="border border-gray-200 rounded-2xl p-6 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
              <div className="text-3xl mb-3">{o.icon}</div>
              <h2 className="font-semibold text-gray-900 mb-1">{o.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{o.desc}</p>
            </div>
          </AnimateIn>
        ))}
      </div>

      {/* Come funziona */}
      <AnimateIn>
        <div className="bg-gray-50 rounded-2xl p-7 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Come richiedere una personalizzazione</h2>
          <ol className="space-y-3 text-gray-600 text-sm">
            <li className="flex gap-3"><span className="flex-none font-bold text-indigo-600">1.</span> Scrivimi su WhatsApp descrivendo cosa vuoi</li>
            <li className="flex gap-3"><span className="flex-none font-bold text-indigo-600">2.</span> Allegami eventuali file STL o immagini di riferimento</li>
            <li className="flex gap-3"><span className="flex-none font-bold text-indigo-600">3.</span> Ti mando una stima di tempi e prezzo</li>
            <li className="flex gap-3"><span className="flex-none font-bold text-indigo-600">4.</span> Confermato, inizio la lavorazione e ti aggiorno</li>
          </ol>
        </div>
      </AnimateIn>

      {/* CTA */}
      <AnimateIn>
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nessun impegno — scrivimi e vediamo cosa si può fare.</p>
          <a
            href="https://wa.me/393338479871?text=Ciao! Vorrei richiedere una miniatura personalizzata."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Scrivimi su WhatsApp
          </a>
        </div>
      </AnimateIn>
    </div>
  )
}

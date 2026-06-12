import Link from 'next/link'
import Image from 'next/image'
import MiniatureCard from '@/components/MiniatureCard'
import AnimateIn from '@/components/AnimateIn'
import HeroCarousel from '@/components/HeroCarousel'
import SiteBanner from '@/components/SiteBanner'
import { urlFor } from '@/sanity/lib/image'
import {
  getAllMiniature,
  getBestSellers,
  getMiniatureInOfferta,
  getCreators,
  getSiteSettings,
} from '@/sanity/lib/queries'

export const revalidate = 60

const PIATTAFORMA_LABEL: Record<string, string> = {
  myminifactory: 'MyMiniFactory',
  patreon: 'Patreon',
  kickstarter: 'Kickstarter',
  altro: 'Altro',
}

export default async function HomePage() {
  const [miniature, bestSellers, offerte, creators, siteSettings] = await Promise.all([
    getAllMiniature(),
    getBestSellers(),
    getMiniatureInOfferta(),
    getCreators(),
    getSiteSettings(),
  ])

  const featured = miniature.slice(0, 6)
  const slides = siteSettings?.heroSlides ?? []

  return (
    <div>
      {/* Hero sticky con carousel */}
      <div style={{ height: '100vh' }}>
        <section
          style={{
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <HeroCarousel slides={slides} />
        </section>
      </div>

      {/* Card "Ultimi arrivi" — scorre sopra l'hero */}
      {featured.length > 0 && (
        <section
          className="bg-white"
          style={{
            position: 'relative',
            zIndex: 10,
            borderRadius: '1.5rem 1.5rem 0 0',
            boxShadow: '0 -24px 80px rgba(0,0,0,0.35)',
            minHeight: '90vh',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 pt-14 pb-20">
            <AnimateIn distance={50} scale={0.97}>
              <div className="mb-8">
                <SiteBanner />
              </div>
            </AnimateIn>
            <AnimateIn distance={50} scale={0.97}>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Ultimi arrivi</h2>
                <Link href="/catalogo" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                  Vedi tutti
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </AnimateIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((m, i) => (
                <AnimateIn key={m._id} delay={80 + i * 90} distance={60} scale={0.95}>
                  <MiniatureCard miniatura={m} />
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="bg-gray-50 py-16 px-4" style={{ position: 'relative', zIndex: 10 }}>
          <div className="max-w-6xl mx-auto">
            <AnimateIn distance={40}>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Più venduti</h2>
                <Link href="/catalogo" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                  Vedi tutti
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </AnimateIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bestSellers.map((m, i) => (
                <AnimateIn key={m._id} delay={i * 80} distance={50} scale={0.96}>
                  <MiniatureCard miniatura={m} />
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offerte */}
      {offerte.length > 0 && (
        <section className="bg-white py-16 px-4" style={{ position: 'relative', zIndex: 10 }}>
          <div className="max-w-6xl mx-auto">
            <AnimateIn distance={40}>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Offerte</h2>
                  <p className="text-gray-500 mt-1 text-sm">Prezzi scontati per un periodo limitato</p>
                </div>
                <Link href="/catalogo" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm">
                  Vedi tutte
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </AnimateIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offerte.map((m, i) => (
                <AnimateIn key={m._id} delay={i * 80} distance={50} scale={0.96}>
                  <MiniatureCard miniatura={m} />
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Creators */}
      {creators.length > 0 && (
        <section className="bg-gray-950 py-16 px-4" style={{ position: 'relative', zIndex: 10 }}>
          <div className="max-w-6xl mx-auto">
            <AnimateIn distance={40}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white">I creator che supporto</h2>
                <p className="text-gray-400 mt-2">
                  I designer i cui file utilizzo per stampare — vai a scoprire il loro lavoro.
                </p>
              </div>
            </AnimateIn>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {creators.map((c, i) => (
                <AnimateIn key={c._id} delay={i * 60} distance={40}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/40 transition-all"
                  >
                    {c.avatar ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-none">
                        <Image
                          src={urlFor(c.avatar).width(128).height(128).fit('crop').auto('format').url()}
                          alt={c.nome}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 text-2xl font-bold flex-none">
                        {c.nome[0]}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">
                        {c.nome}
                      </p>
                      {c.piattaforma && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {PIATTAFORMA_LABEL[c.piattaforma] ?? c.piattaforma}
                        </p>
                      )}
                      {c.descrizione && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{c.descrizione}</p>
                      )}
                    </div>
                  </a>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram CTA */}
      <section className="py-14 px-4 bg-white" style={{ position: 'relative', zIndex: 10 }}>
        <div
          className="max-w-2xl mx-auto rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}
        >
          <div className="px-8 py-12 text-center">
            <svg className="w-10 h-10 text-white mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Seguimi su Instagram</h2>
            <p className="text-white/80 mb-6">
              Work in progress, foto del processo e anteprime esclusive. Ogni miniatura ha la sua storia.
            </p>
            <a
              href="https://www.instagram.com/tommasosanto"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-pink-600 font-semibold hover:bg-white/90 transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              tommasosanto
            </a>
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="bg-indigo-600 py-14 px-4" style={{ position: 'relative', zIndex: 10 }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white">Hai in mente qualcosa di specifico?</h2>
          <p className="mt-2 text-indigo-200">Posso stampare miniature personalizzate su richiesta. Scrivimi!</p>
          <a
            href="https://wa.me/393338479871"
            target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Scrivimi su WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}

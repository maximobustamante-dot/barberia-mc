import { useState } from 'react'
import { negocio } from '../data/negocio'

const valores = [
  { titulo: 'Técnica clásica', desc: 'Navaja tradicional y precisión en tijera' },
  { titulo: 'Cero apuros', desc: 'Tiempo dedicado exclusivamente a cada cliente' },
  { titulo: 'Ambiente de barrio', desc: 'Buena conversación, música y café de cortesía' },
]

export default function Nosotros() {
  const { titulo, parrafos, foto } = negocio.nosotros
  const [imgError, setImgError] = useState(false)

  return (
    <section id="nosotros" className="scroll-mt-24 bg-hueso px-6 py-24 text-azul">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rojo">Nuestra historia</p>
          <h2 className="mt-2 font-titulo text-4xl uppercase leading-tight md:text-5xl">{titulo}</h2>
          
          <div className="mt-6 space-y-4">
            {parrafos.map((texto) => (
              <p key={texto} className="leading-relaxed text-azul/80">
                {texto}
              </p>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {valores.map((v) => (
              <div key={v.titulo} className="rounded-xl border border-azul/10 bg-white/70 p-4 shadow-sm">
                <p className="font-titulo text-sm uppercase text-azul">{v.titulo}</p>
                <p className="mt-1 text-xs text-azul/65">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta fotográfica con badge y fallback de respaldo */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-azul/10 bg-azul/10 shadow-xl">
            {!imgError ? (
              <img
                src={foto}
                alt={`Interior de ${negocio.nombre}`}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-azul to-azul/90 p-8 text-center text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  💈
                </div>
                <p className="mt-4 font-titulo text-2xl uppercase tracking-wider">Tradición y Oficio</p>
                <p className="mt-2 max-w-xs text-xs text-white/70">
                  Espacio diseñado para tu comodidad y el cuidado de tu imagen personal.
                </p>
              </div>
            )}
          </div>

          {/* Badge flotante superpuesto */}
          <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/20 bg-rojo px-5 py-3 text-white shadow-xl">
            <p className="font-titulo text-2xl font-bold leading-none">100%</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90">
              Oficio artesanal
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

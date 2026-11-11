import { useState } from 'react'
import { negocio } from '../data/negocio'
import { estadoHorario } from '../lib/horario'

const amenities = [
  {
    titulo: 'Estacionamiento',
    desc: 'Cercano y seguro',
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h5a3 3 0 010 6H8V7zm0 6v5" />
      </svg>
    ),
  },
  {
    titulo: 'Wi-Fi libre',
    desc: 'Alta velocidad',
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.393 9.326c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
  },
  {
    titulo: 'Café & Bebidas',
    desc: 'Cortesía de la casa',
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
      </svg>
    ),
  },
  {
    titulo: 'Todo medio de pago',
    desc: 'Tarjetas, Transferencia y Efectivo',
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
]

export default function Ubicacion() {
  const busqueda = encodeURIComponent(`${negocio.direccion}, ${negocio.comuna}`)
  const [horario] = useState(() => estadoHorario())

  return (
    <section id="ubicacion" className="scroll-mt-24 bg-azul-claro px-6 py-24 text-azul">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-rojo">Encuéntranos</p>
            <h2 className="mt-2 font-titulo text-4xl uppercase md:text-5xl">Ubicación y atención</h2>

            {/* Estado dinámico en tiempo real */}
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-azul/15 bg-white/80 px-4 py-1.5 shadow-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  horario.abierto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-azul">
                {horario.texto}
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-azul/10 bg-white/80 p-6 shadow-sm">
              <p className="text-xl font-bold font-titulo uppercase text-azul">{negocio.direccion}</p>
              <p className="text-sm text-azul/75">{negocio.comuna}</p>

              <div className="mt-6 border-t border-azul/10 pt-5">
                <h3 className="font-titulo text-base uppercase tracking-wider text-azul/90">Horarios de atención</h3>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {negocio.horario.map((h) => (
                    <li key={h.dias} className="flex justify-between border-b border-azul/10 pb-2">
                      <span className="text-azul/80">{h.dias}</span>
                      <span className="font-semibold text-azul">{h.horas}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botones de cómo llegar */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${busqueda}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-azul/90 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Google Maps</span>
                </a>

                <a
                  href={`https://waze.com/ul?q=${busqueda}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-azul/20 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-azul shadow-sm transition-all hover:bg-azul/5 active:scale-95"
                >
                  <span>Waze</span>
                </a>
              </div>
            </div>
          </div>

          {/* Mapa embebido interactivo */}
          <div className="flex flex-col">
            <div className="h-72 w-full overflow-hidden rounded-2xl border border-azul/15 shadow-md lg:h-full lg:min-h-96">
              <iframe
                title={`Mapa de ${negocio.nombre}`}
                src={`https://www.google.com/maps?q=${busqueda}&output=embed`}
                loading="lazy"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>

        {/* Comodidades / Amenities */}
        <div className="mt-14 border-t border-azul/10 pt-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-azul/75">
            Comodidades del local
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {amenities.map((a) => (
              <div
                key={a.titulo}
                className="flex flex-col items-center rounded-2xl border border-azul/10 bg-white/70 p-4 text-center shadow-sm transition-all hover:bg-white hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-azul/10 text-azul">
                  {a.icono}
                </div>
                <h4 className="mt-2.5 text-xs font-bold uppercase tracking-wider text-azul">
                  {a.titulo}
                </h4>
                <p className="mt-1 text-xs text-azul/75">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { servicios } from '../data/servicios'
import TarjetaServicio from './TarjetaServicio'

type Categoria = 'todos' | 'cortes' | 'barba' | 'cejas'

const filtros: { id: Categoria; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'cortes', etiqueta: 'Cortes' },
  { id: 'barba', etiqueta: 'Barba & Combos' },
  { id: 'cejas', etiqueta: 'Detalles' },
]

export default function Servicios() {
  const [categoria, setCategoria] = useState<Categoria>('todos')

  const serviciosFiltrados = servicios.filter((s) => {
    if (categoria === 'todos') return true
    if (categoria === 'cortes') return [1, 2, 5].includes(s.id)
    if (categoria === 'barba') return [3, 4].includes(s.id)
    if (categoria === 'cejas') return s.id === 6
    return true
  })

  return (
    <section id="servicios" className="scroll-mt-24 bg-azul-claro px-6 py-24 text-azul">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-rojo">Carta de servicios</p>
            <h2 className="mt-2 font-titulo text-4xl uppercase md:text-5xl">Servicios y tarifas</h2>
            <p className="mt-3 text-sm text-azul/75 sm:text-base">
              Todos nuestros servicios incluyen asesoría de estilo y productos de primera línea.
            </p>
          </div>

          {/* Filtros por categoría */}
          <div className="flex flex-wrap gap-2">
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoria(f.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  categoria === f.id
                    ? 'bg-azul text-white shadow-md shadow-azul/20'
                    : 'bg-white/70 text-azul/75 hover:bg-white hover:text-azul'
                }`}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {serviciosFiltrados.map((s) => (
            <TarjetaServicio key={s.id} servicio={s} />
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-azul/10 bg-white/70 p-6 sm:flex-row sm:px-8">
          <div>
            <p className="font-titulo text-xl uppercase text-azul">¿No encuentras lo que buscas?</p>
            <p className="text-sm text-azul/70">
              Ofrecemos servicios combinados y asesoría presencial en cada visita.
            </p>
          </div>
          <a
            href="#reserva"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rojo px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-rojo/25 transition-all hover:bg-rojo/90 hover:shadow-lg hover:shadow-rojo/40 active:scale-95"
          >
            <span>Reservar ahora</span>
          </a>
        </div>
      </div>
    </section>
  )
}

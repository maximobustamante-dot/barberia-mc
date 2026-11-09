import type { Servicio } from '../types'

interface Props {
  servicio: Servicio
}

export default function TarjetaServicio({ servicio }: Props) {
  const esDestacado = servicio.id === 4 // Corte + Barba
  const esPopular = servicio.id === 2 // Fade

  const seleccionar = () => {
    window.dispatchEvent(
      new CustomEvent('seleccionar-servicio', { detail: servicio.id })
    )
    const el = document.getElementById('reserva')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <li
      className={`group relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        esDestacado
          ? 'border-rojo/40 bg-white shadow-md ring-1 ring-rojo/20'
          : 'border-azul/10 bg-white/80 hover:border-azul/30 hover:bg-white'
      }`}
    >
      {/* Badge decorativo superior */}
      {esDestacado && (
        <span className="absolute -top-3 right-6 rounded-full bg-rojo px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
          ⭐ Más pedido
        </span>
      )}
      {esPopular && (
        <span className="absolute -top-3 right-6 rounded-full bg-azul px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
          🔥 Popular
        </span>
      )}

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-titulo text-xl uppercase tracking-wide text-azul md:text-2xl">
            {servicio.nombre}
          </h3>
          <span className="font-titulo text-2xl font-bold text-rojo">
            ${servicio.precio.toLocaleString('es-CL')}
          </span>
        </div>

        <p className="mt-2 text-sm text-azul/75 sm:text-base leading-relaxed">
          {servicio.descripcion}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-azul/10 pt-4">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-azul/60">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{servicio.duracionMin} min</span>
        </div>

        <button
          type="button"
          onClick={seleccionar}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-azul transition-colors hover:text-rojo group-hover:translate-x-0.5"
        >
          <span>Elegir servicio</span>
          <span>→</span>
        </button>
      </div>
    </li>
  )
}

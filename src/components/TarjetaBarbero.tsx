import { useState } from 'react'
import type { Barbero } from '../types'

interface Props {
  barbero: Barbero
}

export default function TarjetaBarbero({ barbero }: Props) {
  const [imgError, setImgError] = useState(false)

  const seleccionar = () => {
    window.dispatchEvent(
      new CustomEvent('seleccionar-barbero', { detail: barbero.id })
    )
    const el = document.getElementById('reserva')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-azul/10 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-azul/20 hover:shadow-xl">
      {/* Contenedor de la foto con fallback elegante */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-azul/10">
        {!imgError ? (
          <img
            src={barbero.foto}
            alt={`Foto de ${barbero.nombre}`}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-azul/80 to-azul p-6 text-white text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold font-titulo tracking-wider ring-2 ring-white/20">
              {barbero.nombre.slice(0, 2).toUpperCase()}
            </div>
            <p className="mt-3 text-xs uppercase tracking-widest text-azul-claro">Barbero Profesional</p>
          </div>
        )}

        {/* Badge de especialidad sobre la foto */}
        <span className="absolute bottom-3 left-3 rounded-full bg-azul/85 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
          {barbero.especialidad}
        </span>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-titulo text-xl uppercase tracking-wide text-azul md:text-2xl">
            {barbero.nombre}
          </h3>
          <p className="text-xs uppercase tracking-wider text-azul/60">
            Máster Barber
          </p>
        </div>

        <button
          type="button"
          onClick={seleccionar}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-azul/15 bg-hueso py-2.5 text-xs font-bold uppercase tracking-wider text-azul transition-all hover:border-rojo hover:bg-rojo hover:text-white group-hover:border-azul/30 active:scale-95"
        >
          <span>Agendar con {barbero.nombre}</span>
          <span>→</span>
        </button>
      </div>
    </article>
  )
}

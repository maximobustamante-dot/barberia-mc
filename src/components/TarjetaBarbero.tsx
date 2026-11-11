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
    // En celular: foto chica a la izquierda (fila). Desde sm: tarjeta vertical.
    <article className="group relative flex gap-4 overflow-hidden rounded-2xl border border-azul/10 bg-white p-3 shadow-sm transition-all duration-300 hover:border-azul/20 hover:shadow-xl sm:flex-col sm:gap-0 sm:p-4 sm:hover:-translate-y-1.5">
      {/* Foto con respaldo de iniciales mientras no exista */}
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-azul/10 sm:aspect-3/4 sm:w-full">
        {!imgError ? (
          <img
            src={barbero.foto}
            alt={`Foto de ${barbero.nombre}`}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover text-transparent transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-azul/80 to-azul text-white">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-titulo text-lg font-bold tracking-wider ring-2 ring-white/20 sm:h-16 sm:w-16 sm:text-2xl">
              {barbero.nombre.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:mt-4">
        <div>
          <h3 className="font-titulo text-xl uppercase tracking-wide text-azul md:text-2xl">{barbero.nombre}</h3>
          <p className="text-sm text-azul/75">{barbero.especialidad}</p>
        </div>

        <button
          type="button"
          onClick={seleccionar}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-azul/15 bg-hueso text-xs font-bold uppercase tracking-wider text-azul transition-all hover:border-rojo hover:bg-rojo hover:text-white active:scale-95"
        >
          <span>Reservar con {barbero.nombre}</span>
        </button>
      </div>
    </article>
  )
}

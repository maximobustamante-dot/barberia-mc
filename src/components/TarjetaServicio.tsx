import type { Servicio } from '../types'

interface Props {
  servicio: Servicio
}

export default function TarjetaServicio({ servicio }: Props) {
  return (
    <li className="py-5">
      <div className="flex items-baseline gap-3">
        <h3 className="font-titulo text-xl uppercase md:text-2xl">{servicio.nombre}</h3>
        {/* Línea punteada que une el nombre con el precio, como en una pizarra */}
        <span aria-hidden="true" className="flex-1 border-b-2 border-dotted border-azul/30" />
        <span className="font-titulo text-xl text-rojo md:text-2xl">
          ${servicio.precio.toLocaleString('es-CL')}
        </span>
      </div>
      <p className="mt-1 text-azul/75">
        {servicio.descripcion} <span className="text-azul/70">· {servicio.duracionMin} min</span>
      </p>
    </li>
  )
}

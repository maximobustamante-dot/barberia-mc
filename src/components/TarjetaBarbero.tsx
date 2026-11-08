import type { Barbero } from '../types'

interface Props {
  barbero: Barbero
}

export default function TarjetaBarbero({ barbero }: Props) {
  return (
    <article>
      {/* Fondo gris mientras no exista la foto */}
      <div
        role="img"
        aria-label={`Foto de ${barbero.nombre}`}
        style={{ backgroundImage: `url(${barbero.foto})` }}
        className="aspect-3/4 w-full rounded-lg bg-neutral-300 bg-cover bg-center"
      />
      <h3 className="mt-3 font-titulo text-xl md:text-2xl uppercase">{barbero.nombre}</h3>
      <p className="text-azul/75">{barbero.especialidad}</p>
    </article>
  )
}

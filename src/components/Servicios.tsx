import { servicios } from '../data/servicios'
import TarjetaServicio from './TarjetaServicio'

export default function Servicios() {
  return (
    <section id="servicios" className="scroll-mt-28 bg-azul-claro px-6 py-24 text-azul">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-titulo text-4xl uppercase md:text-5xl">Servicios y precios</h2>

        <ul className="mt-10 grid gap-x-16 md:grid-cols-2">
          {servicios.map((s) => (
            <TarjetaServicio key={s.id} servicio={s} />
          ))}
        </ul>

        <a
          href="#reserva"
          className="mt-12 inline-block rounded-full bg-rojo px-8 py-3 font-semibold text-white hover:bg-rojo/90"
        >
          Reservar hora
        </a>
      </div>
    </section>
  )
}

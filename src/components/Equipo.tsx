import { barberos } from '../data/barberos'
import TarjetaBarbero from './TarjetaBarbero'

export default function Equipo() {
  return (
    <section id="equipo" className="scroll-mt-24 bg-hueso px-6 py-24 text-azul">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rojo">El equipo</p>
          <h2 className="mt-2 font-titulo text-4xl uppercase md:text-5xl">Nuestros barberos</h2>
          <p className="mt-3 text-sm text-azul/75 sm:text-base">
            Profesionales apasionados por el oficio tradicional, la precisión en degradados y el cuidado integral de la barba.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {barberos.map((b) => (
            <TarjetaBarbero key={b.id} barbero={b} />
          ))}
        </div>
      </div>
    </section>
  )
}

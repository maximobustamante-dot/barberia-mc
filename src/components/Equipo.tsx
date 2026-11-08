import { barberos } from '../data/barberos'
import TarjetaBarbero from './TarjetaBarbero'

export default function Equipo() {
  return (
    <section id="equipo" className="scroll-mt-28 bg-hueso px-6 py-24 text-azul">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-titulo text-4xl uppercase md:text-5xl">Nuestros barberos</h2>

        <div className="mt-10 grid grid-cols-2 gap-6 md:gap-10 lg:grid-cols-3">
          {barberos.map((b) => (
            <TarjetaBarbero key={b.id} barbero={b} />
          ))}
        </div>
      </div>
    </section>
  )
}

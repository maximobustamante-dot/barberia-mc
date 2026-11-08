import { negocio } from '../data/negocio'

export default function Nosotros() {
  const { titulo, parrafos, foto } = negocio.nosotros

  return (
    <section id="nosotros" className="scroll-mt-28 bg-hueso px-6 py-24 text-azul">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-titulo text-4xl uppercase md:text-5xl">{titulo}</h2>
          {parrafos.map((texto) => (
            <p key={texto} className="mt-4 leading-relaxed text-azul/80">
              {texto}
            </p>
          ))}
        </div>

        {/* Fondo gris mientras no exista la foto */}
        <div
          role="img"
          aria-label={`Interior de ${negocio.nombre}`}
          style={{ backgroundImage: `url(${foto})` }}
          className="aspect-4/3 w-full rounded-lg bg-neutral-300 bg-cover bg-center"
        />
      </div>
    </section>
  )
}

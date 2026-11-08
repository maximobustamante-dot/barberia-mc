import { negocio } from '../data/negocio'

export default function Ubicacion() {
  const busqueda = encodeURIComponent(`${negocio.direccion}, ${negocio.comuna}`)

  return (
    <section id="ubicacion" className="scroll-mt-28 bg-azul-claro px-6 py-24 text-azul">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-titulo text-4xl uppercase md:text-5xl">Ubicación</h2>

          <p className="mt-6 text-lg font-semibold">{negocio.direccion}</p>
          <p className="text-azul/80">{negocio.comuna}</p>

          <h3 className="mt-8 font-titulo text-xl uppercase">Horario</h3>
          <ul className="mt-3 space-y-2">
            {negocio.horario.map((h) => (
              <li key={h.dias} className="flex justify-between border-b border-azul/15 pb-2">
                <span>{h.dias}</span>
                <span className="font-semibold">{h.horas}</span>
              </li>
            ))}
          </ul>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${busqueda}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full bg-rojo px-8 py-3 font-semibold text-white hover:bg-rojo/90"
          >
            Cómo llegar
          </a>
        </div>

        <iframe
          title={`Mapa de ${negocio.nombre}`}
          src={`https://www.google.com/maps?q=${busqueda}&output=embed`}
          loading="lazy"
          className="h-80 w-full rounded-lg border-0 md:h-full md:min-h-96"
        />
      </div>
    </section>
  )
}

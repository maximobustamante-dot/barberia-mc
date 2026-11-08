import { negocio } from '../data/negocio'

const anio = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="bg-gray-800 px-6 pt-16 pb-8 text-neutral-300">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
        <div>
          <p className="font-titulo text-3xl text-white">{negocio.nombre}</p>
          <p className="mt-3">
            {negocio.direccion}
            <br />
            {negocio.comuna}
          </p>
        </div>

        <div>
          <h2 className="font-titulo text-lg uppercase text-white">Horario</h2>
          <ul className="mt-3 space-y-1">
            {negocio.horario.map((h) => (
              <li key={h.dias}>
                {h.dias}: {h.horas}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-titulo text-lg uppercase text-white">Contacto</h2>
          <ul className="mt-3 space-y-1">
            <li>
              <a href={`https://wa.me/${negocio.telefono}`} target="_blank" rel="noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer" className="hover:text-white">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-5xl border-t border-white/10 pt-6 text-sm text-neutral-400">
        © {anio} {negocio.nombre}
      </p>
    </footer>
  )
}

import { negocio } from '../data/negocio'

const anio = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-azul px-6 pt-16 pb-8 text-white/80">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rojo text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="3" />
                <path d="M8.12 8.12 12 12" />
                <path d="M20 4 8.12 15.88" />
                <circle cx="6" cy="18" r="3" />
                <path d="M14.8 14.8 20 20" />
              </svg>
            </span>
            <p className="font-titulo text-2xl font-bold uppercase tracking-wider text-white">
              {negocio.nombre}
            </p>
          </div>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            {negocio.direccion}
            <br />
            {negocio.comuna}
          </p>
        </div>

        <div>
          <h2 className="font-titulo text-base uppercase tracking-wider text-white">Horarios</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {negocio.horario.map((h) => (
              <li key={h.dias} className="flex justify-between border-b border-white/10 pb-1 text-white/75">
                <span>{h.dias}:</span>
                <span className="font-semibold text-white">{h.horas}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-titulo text-base uppercase tracking-wider text-white">Contacto y Redes</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>
              <a
                href={`https://wa.me/${negocio.telefono}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white"
              >
                <span className="text-emerald-400">●</span>
                <span>WhatsApp ({negocio.telefono})</span>
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${negocio.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white"
              >
                <span className="text-rose-400">●</span>
                <span>Instagram (@{negocio.instagram})</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
        <p>© {anio} {negocio.nombre} · Todos los derechos reservados.</p>
        <p className="text-white/40">Cortes clásicos · Tradición y oficio</p>
      </div>
    </footer>
  )
}

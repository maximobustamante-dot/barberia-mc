import { Link } from 'react-router'
import { negocio } from '../../modelos/datos/negocio'
import { instagramDelLocal, whatsappDelLocal } from '../../modelos/enlaces'
import { formatearTelefono } from '../../modelos/telefono'
import IconoWhatsApp from '../comunes/IconoWhatsApp'
import IconoTijeras from '../comunes/IconoTijeras'

const anio = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-azul px-6 pt-16 pb-24 text-white/80">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rojo text-white">
              <IconoTijeras className="h-4 w-4" />
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
                href={whatsappDelLocal()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white"
              >
                <IconoWhatsApp className="h-4 w-4 text-emerald-400" />
                <span>{formatearTelefono(negocio.telefono)}</span>
              </a>
            </li>
            <li>
              <a
                href={instagramDelLocal()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white"
              >
                <svg className="h-4 w-4 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                <span>@{negocio.instagram}</span>
              </a>
            </li>
          </ul>
          <a
            href="#reserva"
            className="mt-5 inline-flex h-11 items-center rounded-full bg-rojo px-6 text-sm font-semibold text-white hover:bg-rojo/90"
          >
            Reservar hora
          </a>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
        <p>© {anio} {negocio.nombre} · Todos los derechos reservados.</p>
        <div className="flex gap-5">
          <Link to="/privacidad" className="hover:text-white">
            Privacidad
          </Link>
          <Link to="/admin" className="hover:text-white">
            Acceso equipo
          </Link>
        </div>
      </div>
    </footer>
  )
}

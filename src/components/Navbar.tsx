import { useState, useEffect } from 'react'
import { negocio } from '../data/negocio'

const enlaces = [
  { href: '#nosotros', texto: 'Nosotros' },
  { href: '#servicios', texto: 'Servicios' },
  { href: '#equipo', texto: 'Equipo' },
  { href: '#ubicacion', texto: 'Ubicación' },
]

export default function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-azul/95 py-3 shadow-xl backdrop-blur-md border-b border-white/10'
            : 'bg-azul/80 py-5 backdrop-blur-sm'
        } text-white`}
      >
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <a
            href="#"
            className="group flex items-center gap-2.5 font-titulo text-2xl font-bold uppercase tracking-wider transition-colors hover:text-azul-claro md:text-3xl"
          >
            {/* Isotipo tijeras / navaja de barbería */}
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rojo text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="6" cy="6" r="3" />
                <path d="M8.12 8.12 12 12" />
                <path d="M20 4 8.12 15.88" />
                <circle cx="6" cy="18" r="3" />
                <path d="M14.8 14.8 20 20" />
              </svg>
            </span>
            <span>{negocio.nombre}</span>
          </a>

          {/* Botón hamburguesa accesible en móvil */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/15 md:hidden"
            onClick={() => setAbierto(!abierto)}
            aria-label={abierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={abierto}
          >
            {abierto ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>

          {/* Menú de navegación desktop */}
          <ul className="hidden items-center gap-8 md:flex">
            {enlaces.map((e) => (
              <li key={e.href}>
                <a
                  href={e.href}
                  className="text-sm font-medium uppercase tracking-wider text-stone-300 transition-colors hover:text-white"
                >
                  {e.texto}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#reserva"
                className="inline-flex items-center gap-2 rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/30 transition-all hover:bg-rojo/85 hover:shadow-lg hover:shadow-black/50 active:scale-95"
              >
                <span>Reservar</span>
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Menú móvil desplegable con backdrop */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-x-4 top-20 z-50 origin-top rounded-2xl border border-white/10 bg-azul/95 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 md:hidden ${
          abierto
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-4">
          {enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              onClick={() => setAbierto(false)}
              className="rounded-lg px-4 py-3 text-base font-semibold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {e.texto}
            </a>
          ))}
          <a
            href="#reserva"
            onClick={() => setAbierto(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-rojo py-3.5 text-center font-bold uppercase tracking-wider text-white shadow-lg shadow-rojo/30 active:scale-95"
          >
            <span>Reservar hora</span>
          </a>
        </nav>
      </div>
    </>
  )
}

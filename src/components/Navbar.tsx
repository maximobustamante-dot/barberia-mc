import { useState } from 'react'

const enlaces = [
  { href: '#nosotros', texto: 'Nosotros' },
  { href: '#servicios', texto: 'Servicios' },
  { href: '#ubicacion', texto: 'Ubicación' },
]
export default function Navbar() {
  const [abierto, setAbierto] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gray-800 text-white shadow-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="#" className="font-titulo text-3xl tracking-wide">
          Barbería
        </a>

        <button
          className="text-2xl md:hidden"
          onClick={() => setAbierto(!abierto)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
        >
          {abierto ? '✕' : '☰'}
        </button>

        <ul
          className={`${abierto ? 'flex' : 'hidden'} absolute inset-x-0 top-full flex-col gap-4 bg-gray-800 px-6 py-4 md:static md:flex md:flex-row md:items-center md:gap-8 md:p-0`}
        >
          {enlaces.map((e) => (
            <li key={e.href}>
              <a
                href={e.href}
                onClick={() => setAbierto(false)}
                className="hover:text-azul-claro"
              >
                {e.texto}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#reserva"
              onClick={() => setAbierto(false)}
              className="inline-block rounded-full bg-rojo px-5 py-2 font-semibold hover:bg-rojo/90"
            >
              Reservar
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}

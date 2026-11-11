import { Link } from 'react-router'
import { negocio } from '../data/negocio'

export default function NoEncontrada() {
  return (
    <main className="grid min-h-screen place-items-center bg-azul px-6 text-center text-white">
      <title>{`Página no encontrada · ${negocio.nombre}`}</title>
      <div>
        <p className="font-titulo text-8xl text-azul-claro">404</p>
        <h1 className="mt-2 font-titulo text-3xl uppercase">Esta página no existe</h1>
        <p className="mt-3 text-white/70">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full bg-rojo px-8 py-3 font-semibold hover:bg-rojo/90"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}

// ============================================================
// VISTA · /admin: muestra la pantalla que corresponde según useSesionAdmin()
// (cargando, login, sin permiso, sin conexión o el panel).
// ============================================================
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useSesionAdmin } from '../../controladores/useSesionAdmin'
import { negocio } from '../../modelos/datos/negocio'
import Login from './Login'
import Panel from './Panel'

export default function Admin() {
  const { paso, fuente, reintentar, salir } = useSesionAdmin()

  return (
    <>
      {/* React 19 mueve estas etiquetas al <head> de la página */}
      <title>{`Panel · ${negocio.nombre}`}</title>
      <meta name="robots" content="noindex, nofollow" />

      {paso.tipo === 'no-configurado' ? (
        <Aviso titulo="Panel no disponible">
          Falta configurar Supabase en <code>.env.local</code>.
          <Link
            to="/admin/demo"
            className="mt-6 block w-full rounded-xl bg-azul py-3 text-center text-sm font-bold uppercase tracking-wider text-white"
          >
            Ver demo del panel
          </Link>
        </Aviso>
      ) : paso.tipo === 'cargando' ? (
        <div className="grid min-h-screen place-items-center bg-hueso text-azul/60">Cargando…</div>
      ) : paso.tipo === 'login' ? (
        <Login />
      ) : paso.tipo === 'sin-conexion' ? (
        <Aviso titulo="Sin conexión">
          No pudimos verificar tu cuenta. Revisa tu internet y vuelve a intentar.
          <button
            type="button"
            onClick={reintentar}
            className="mt-6 block w-full rounded-xl bg-azul py-3 text-sm font-bold uppercase tracking-wider text-white"
          >
            Reintentar
          </button>
        </Aviso>
      ) : paso.tipo === 'sin-permiso' ? (
        <Aviso titulo="Sin acceso">
          La cuenta <strong>{paso.email}</strong> no tiene permiso para ver el panel.
          <button
            type="button"
            onClick={salir}
            className="mt-6 block w-full rounded-xl bg-azul py-3 text-sm font-bold uppercase tracking-wider text-white"
          >
            Cerrar sesión
          </button>
        </Aviso>
      ) : (
        fuente && <Panel email={paso.email} fuente={fuente} />
      )}
    </>
  )
}

function Aviso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-hueso px-6 text-azul">
      <div className="w-full max-w-sm rounded-2xl border border-azul/10 bg-white p-8 shadow-sm">
        <h1 className="font-titulo text-3xl uppercase">{titulo}</h1>
        <div className="mt-3 text-sm text-azul/75">{children}</div>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-azul/70 hover:text-rojo">
          ← Volver a la página
        </Link>
      </div>
    </main>
  )
}

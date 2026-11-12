import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { negocio } from '../data/negocio'
import Login from './Login'
import Panel from './Panel'
import { fuenteSupabase } from './fuente'

// Se crea una sola vez: el panel real lee y cambia reservas a través de Supabase
const fuente = supabase ? fuenteSupabase(supabase) : null

// En qué pantalla está el panel
type Paso =
  | { tipo: 'cargando' }
  | { tipo: 'login' }
  | { tipo: 'sin-permiso'; email: string }
  | { tipo: 'sin-conexion' }
  | { tipo: 'panel'; email: string }

export default function Admin() {
  const [paso, setPaso] = useState<Paso>({ tipo: 'cargando' })
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (!supabase) return
    const cliente = supabase
    let ultimoAviso = 0 // solo vale la respuesta del aviso más reciente

    // Con sesión iniciada, se pregunta a la base si este usuario es administrador
    async function revisar(sesion: Session | null, aviso: number) {
      if (!sesion) {
        setPaso({ tipo: 'login' })
        return
      }
      const email = sesion.user.email ?? ''
      const { data, error } = await cliente.rpc('es_admin')
      if (aviso !== ultimoAviso) return // mientras esperaba, la sesión cambió (p. ej. cerró sesión)
      if (error) setPaso({ tipo: 'sin-conexion' })
      else setPaso(data === true ? { tipo: 'panel', email } : { tipo: 'sin-permiso', email })
    }

    // Se avisa al cargar (sesión guardada) y cada vez que alguien entra o sale.
    // setTimeout: Supabase recomienda no llamar a la base dentro de este aviso directamente.
    const { data } = cliente.auth.onAuthStateChange((_evento, sesion) => {
      const aviso = ++ultimoAviso
      setTimeout(() => revisar(sesion, aviso), 0)
    })
    return () => {
      ultimoAviso = -1
      data.subscription.unsubscribe()
    }
  }, [reintento])

  return (
    <>
      {/* React 19 mueve estas etiquetas al <head> de la página */}
      <title>{`Panel · ${negocio.nombre}`}</title>
      <meta name="robots" content="noindex, nofollow" />

      {!supabase ? (
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
            onClick={() => {
              setPaso({ tipo: 'cargando' })
              setReintento((n) => n + 1)
            }}
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
            onClick={() => supabase?.auth.signOut()}
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

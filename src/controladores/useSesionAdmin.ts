// ============================================================
// CONTROLADOR · ¿Qué pantalla del panel corresponde mostrar?
// cargando → login → (sin permiso | sin conexión | panel)
// El permiso lo decide la BASE (es_admin), no este archivo.
// ============================================================
import { useEffect, useState } from 'react'
import { fuenteReal } from '../modelos/panel'
import { alCambiarSesion, cerrarSesion, esAdmin, loginDisponible } from '../modelos/sesion'

type PasoAdmin =
  | { tipo: 'no-configurado' } // falta .env.local
  | { tipo: 'cargando' }
  | { tipo: 'login' }
  | { tipo: 'sin-permiso'; email: string }
  | { tipo: 'sin-conexion' }
  | { tipo: 'panel'; email: string }

export function useSesionAdmin() {
  const [paso, setPaso] = useState<PasoAdmin>(loginDisponible ? { tipo: 'cargando' } : { tipo: 'no-configurado' })
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (!loginDisponible) return
    let ultimoAviso = 0 // solo vale la respuesta del aviso más reciente

    const dejarDeEscuchar = alCambiarSesion(async (email) => {
      const aviso = ++ultimoAviso
      if (email === null) return setPaso({ tipo: 'login' })
      const admin = await esAdmin()
      if (aviso !== ultimoAviso) return // mientras esperaba, la sesión cambió (p. ej. cerró sesión)
      if (admin === null) setPaso({ tipo: 'sin-conexion' })
      else setPaso(admin ? { tipo: 'panel', email } : { tipo: 'sin-permiso', email })
    })
    return () => {
      ultimoAviso = -1
      dejarDeEscuchar()
    }
  }, [reintento])

  return {
    paso,
    fuente: fuenteReal, // de dónde lee el panel real (Supabase); la demo usa useFuenteDemo
    reintentar: () => {
      setPaso({ tipo: 'cargando' })
      setReintento((n) => n + 1)
    },
    salir: () => cerrarSesion(),
  }
}

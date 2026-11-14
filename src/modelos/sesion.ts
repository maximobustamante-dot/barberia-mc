// ============================================================
// MODELO · Login del dueño (Supabase Auth)
// Quién es administrador lo decide la BASE (función es_admin), no React.
// ============================================================
import { supabase } from './supabase'

export const loginDisponible = supabase !== null

export type ResultadoLogin = 'ok' | 'credenciales' | 'demasiados-intentos'

export async function iniciarSesion(email: string, clave: string): Promise<ResultadoLogin> {
  if (!supabase) return 'credenciales'
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
  if (!error) return 'ok'
  // Mismo resultado para correo o contraseña malos: no se revela cuál falló.
  // 429 es el código HTTP de "demasiadas peticiones".
  return error.status === 429 ? 'demasiados-intentos' : 'credenciales'
}

export function cerrarSesion() {
  return supabase?.auth.signOut()
}

// ¿El usuario con sesión es administrador? null = no se pudo preguntar (sin conexión).
export async function esAdmin(): Promise<boolean | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('es_admin')
  return error ? null : data === true
}

// Avisa cada vez que alguien entra o sale (y al cargar, si había sesión guardada).
// Entrega el correo del usuario, o null si no hay sesión. Devuelve la función para dejar de escuchar.
export function alCambiarSesion(aviso: (email: string | null) => void): () => void {
  if (!supabase) return () => {}
  // onAuthStateChange es de Supabase. setTimeout: Supabase recomienda no llamar
  // a la base dentro de este aviso directamente.
  let escuchando = true // al dejar de escuchar, un aviso que estaba en espera ya no se entrega
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    setTimeout(() => {
      if (escuchando) aviso(sesion ? (sesion.user.email ?? '') : null)
    }, 0)
  })
  return () => {
    escuchando = false
    data.subscription.unsubscribe()
  }
}

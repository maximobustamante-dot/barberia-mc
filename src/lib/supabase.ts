import { createClient } from '@supabase/supabase-js'

// Estos valores vienen del archivo .env.local (no se suben a GitHub).
// Ojo: todo lo que empieza con VITE_ queda dentro del JavaScript que descarga
// el visitante (regla de Vite), así que aquí solo va la clave PUBLICABLE.
const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_KEY

// Freno por si alguien pega por error la clave secreta
function esClaveSecreta(k: string) {
  if (k.startsWith('sb_secret_')) return true
  try {
    // Claves antiguas: son un JWT; la parte del medio dice qué rol tiene
    const datos = JSON.parse(atob(k.split('.')[1] ?? ''))
    return datos.role === 'service_role'
  } catch {
    return false
  }
}

if (clave && esClaveSecreta(clave)) {
  throw new Error('VITE_SUPABASE_KEY tiene la clave SECRETA. Usa la clave publicable (sb_publishable_...).')
}

// Si faltan, la página sigue funcionando pero sin reservas en línea
export const supabase = url && clave ? createClient(url, clave) : null

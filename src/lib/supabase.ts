import { createClient } from '@supabase/supabase-js'

// Estos valores vienen del archivo .env.local (no se suben a GitHub)
const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_KEY

// Si faltan, la página sigue funcionando pero sin reservas en línea
export const supabase = url && clave ? createClient(url, clave) : null

// ============================================================
// MODELO · Reserva pública (lo que usa cualquier visitante)
// Solo habla con Supabase. No sabe nada de pantallas ni de React:
// devuelve datos o un código de error, y el controlador decide qué mostrar.
// ============================================================
import { codigoDeError, supabase } from './supabase'
import { limpiarTelefono } from './telefono'
import type { BarberoReservable, DatosReserva, ServicioReservable } from './tipos'

// ¿Hay base de datos configurada? Si no (falta .env.local), se reserva por WhatsApp.
export const reservaEnLinea = supabase !== null

// Hasta cuántos días hacia adelante se puede reservar (igual que crear_reserva en SQL)
export const DIAS_MAXIMO = 30

// Errores que puede devolver la función SQL crear_reserva
export const ERRORES_RESERVA = [
  'HORA_NO_DISPONIBLE',
  'FECHA_FUERA_DE_RANGO',
  'DEMASIADAS_RESERVAS',
  'LIMITE_RESERVAS',
  'NOMBRE_INVALIDO',
  'TELEFONO_INVALIDO',
] as const
export type ErrorReserva = (typeof ERRORES_RESERVA)[number] | 'OTRO'

// Servicios y barberos activos. null = la base no respondió o no hay ninguno activo.
export async function cargarCatalogo(): Promise<{ servicios: ServicioReservable[]; barberos: BarberoReservable[] } | null> {
  if (!supabase) return null
  const [s, b] = await Promise.all([
    // 'duracionMin:duracion_min' es sintaxis de Supabase: renombra la columna al traerla
    supabase.from('servicios').select('id, nombre, precio, duracionMin:duracion_min').order('id'),
    supabase.from('barberos').select('id, nombre').order('id'),
  ])
  if (s.error || b.error || !s.data?.length || !b.data?.length) return null
  return { servicios: s.data, barberos: b.data }
}

// Horas libres ('HH:MM') de un barbero para un servicio y fecha. null = error al consultar.
export async function horasDisponibles(barberoId: number, servicioId: number, fecha: string): Promise<string[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('horas_disponibles', {
    p_barbero: barberoId,
    p_servicio: servicioId,
    p_fecha: fecha,
  })
  if (error) return null
  return (data as { hora: string }[]).map((h) => h.hora.slice(0, 5)) // '10:30:00' → '10:30'
}

// Guarda la reserva. Devuelve null si salió bien, o el código del problema.
export async function crearReserva(d: DatosReserva): Promise<ErrorReserva | null> {
  if (!supabase) return 'OTRO'
  const { error } = await supabase.rpc('crear_reserva', {
    p_barbero: d.barberoId,
    p_servicio: d.servicioId,
    p_fecha: d.fecha,
    p_hora: d.hora,
    p_nombre: d.nombre.trim(),
    p_telefono: limpiarTelefono(d.telefono),
  })
  return error ? codigoDeError(error.message, ERRORES_RESERVA) : null
}

import { normalizarTelefono } from '../lib/telefono'

// Funciones de apoyo del panel. Todo se calcula en hora de Chile,
// aunque el computador del dueño tenga otra zona horaria.

export type Estado = 'pendiente' | 'confirmada' | 'atendida' | 'no_asistio' | 'cancelada'

// Una fila tal como la devuelve la función admin_reservas de la base de datos
export interface ReservaAdmin {
  id: string
  inicio: string
  fin: string
  barbero_id: number
  barbero: string
  servicio_id: number
  servicio: string
  precio: number
  cliente_nombre: string
  cliente_telefono: string
  estado: Estado
  creada_en: string
}

const ZONA = 'America/Santiago'

// 'en-CA' formatea como yyyy-mm-dd, que es el formato de <input type="date">
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA })
const formatoHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const formatoLargo = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export const hoyChile = () => formatoDia.format(new Date())
export const diaDe = (instante: string) => formatoDia.format(new Date(instante))
export const horaDe = (instante: string) => formatoHora.format(new Date(instante))

// '2026-11-16' → 'lunes 16 de noviembre'
export const fechaLarga = (dia: string) => formatoLargo.format(new Date(`${dia}T12:00:00Z`))

// Suma (o resta) días a una fecha yyyy-mm-dd
export function sumarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Lunes de la semana de esa fecha
export function lunesDe(dia: string) {
  const d = new Date(`${dia}T12:00:00Z`)
  const atras = (d.getUTCDay() + 6) % 7 // domingo=0 → 6 días atrás
  return sumarDias(dia, -atras)
}

export const pesos = (n: number) => `$${n.toLocaleString('es-CL')}`

// Enlace de WhatsApp con un mensaje listo para confirmar la hora
export function enlaceWhatsApp(r: ReservaAdmin, negocio: string) {
  const numero = normalizarTelefono(r.cliente_telefono)
  const mensaje =
    `Hola ${r.cliente_nombre}, te escribimos de ${negocio} para confirmar tu hora de ` +
    `${r.servicio} el ${fechaLarga(diaDe(r.inicio))} a las ${horaDe(r.inicio)}. ` +
    `¿Nos confirmas tu asistencia?`
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

export const ESTADOS: Record<Estado, { texto: string; clase: string }> = {
  pendiente: { texto: 'Por confirmar', clase: 'bg-amber-100 text-amber-900 ring-amber-300' },
  confirmada: { texto: 'Confirmada', clase: 'bg-emerald-100 text-emerald-900 ring-emerald-300' },
  atendida: { texto: 'Atendida', clase: 'bg-stone-200 text-stone-800 ring-stone-300' },
  no_asistio: { texto: 'No asistió', clase: 'bg-rojo/10 text-rojo ring-rojo/30' },
  cancelada: { texto: 'Cancelada', clase: 'bg-stone-100 text-stone-500 ring-stone-200' },
}

// Traduce los códigos de error que lanzan las funciones SQL
export function mensajeError(texto: string) {
  if (texto.includes('NO_AUTORIZADO')) return 'Tu sesión no tiene permiso. Vuelve a iniciar sesión.'
  if (texto.includes('HORA_NO_DISPONIBLE')) return 'Esa hora ya la tomó otro cliente, no se puede reactivar.'
  if (texto.includes('RESERVA_NO_EXISTE')) return 'La reserva ya no existe. Actualiza la lista.'
  return 'No se pudo completar la acción. Revisa tu conexión e intenta de nuevo.'
}

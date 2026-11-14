// Fechas y horas en hora de Chile, aunque el computador del visitante tenga otra zona horaria.
// Las usan la página pública (Reserva) y el panel. Las fechas van como texto 'yyyy-mm-dd',
// que es el formato que usan <input type="date"> (del navegador) y las funciones SQL.

export const ZONA = 'America/Santiago'

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

// '2026-11-16' + '10:30' en hora de Chile → instante ISO en UTC ('2026-11-16T13:30:00.000Z').
// Chile cambia entre UTC-3 y UTC-4 según la época del año; Intl sabe cuál corresponde.
const formatoPartes = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
export function instanteChile(dia: string, hora: string) {
  const supuesto = new Date(`${dia}T${hora}:00Z`).getTime()
  const p = Object.fromEntries(formatoPartes.formatToParts(supuesto).map((x) => [x.type, x.value]))
  const relojChile = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute)
  return new Date(supuesto - (relojChile - supuesto)).toISOString()
}

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

import { negocio } from '../data/negocio'

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// Día de la semana y minutos desde medianoche, en hora de Chile
// (aunque el visitante tenga otra zona horaria en su computador)
function ahoraEnChile(fecha: Date) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(valor('weekday'))
  return { dia, minutos: Number(valor('hour')) * 60 + Number(valor('minute')) }
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const aperturaDel = (dia: number) => negocio.apertura.find((a) => a.dias.includes(dia))

// ¿Está abierto ahora? Si no, cuándo abre.
export function estadoHorario(fecha = new Date()) {
  const { dia, minutos } = ahoraEnChile(fecha)
  const hoy = aperturaDel(dia)

  if (hoy && minutos >= aMinutos(hoy.abre) && minutos < aMinutos(hoy.cierra)) {
    return { abierto: true, texto: `Abierto ahora · Cierra a las ${hoy.cierra}` }
  }
  if (hoy && minutos < aMinutos(hoy.abre)) {
    return { abierto: false, texto: `Cerrado · Abre hoy a las ${hoy.abre}` }
  }
  // Buscar el próximo día con atención
  for (let i = 1; i <= 7; i++) {
    const siguiente = (dia + i) % 7
    const apertura = aperturaDel(siguiente)
    if (apertura) {
      const cuando = i === 1 ? 'mañana' : `el ${DIAS[siguiente]}`
      return { abierto: false, texto: `Cerrado · Abre ${cuando} a las ${apertura.abre}` }
    }
  }
  return { abierto: false, texto: 'Cerrado' }
}

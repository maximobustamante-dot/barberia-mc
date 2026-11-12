import type { SupabaseClient } from '@supabase/supabase-js'
import { barberos } from '../data/barberos'
import { servicios } from '../data/servicios'
import { diaDe, hoyChile, instanteChile, mensajeError, sumarDias, type Estado, type ReservaAdmin } from './util'

// De dónde saca el panel las reservas. Panel.tsx no sabe si vienen de
// Supabase (panel real) o de datos inventados (demo); solo usa estas tres funciones.
export interface FuenteReservas {
  cargar(desde: string, hasta: string): Promise<{ filas: ReservaAdmin[]; error: string }>
  cambiar(id: string, estado: Estado): Promise<string> // '' si salió bien, si no el mensaje de error
  salir(): void
}

// ---------------------------------------------------------------------
// Panel real: todo pasa por las funciones SQL admin_reservas y admin_cambiar_estado,
// que revisan en la base de datos que el usuario sea administrador.
// ---------------------------------------------------------------------
export function fuenteSupabase(cliente: SupabaseClient): FuenteReservas {
  return {
    async cargar(desde, hasta) {
      const { data, error } = await cliente.rpc('admin_reservas', { p_desde: desde, p_hasta: hasta })
      return error ? { filas: [], error: mensajeError(error.message) } : { filas: (data ?? []) as ReservaAdmin[], error: '' }
    },
    async cambiar(id, estado) {
      const { error } = await cliente.rpc('admin_cambiar_estado', { p_reserva: id, p_estado: estado })
      return error ? mensajeError(error.message) : ''
    },
    salir() {
      cliente.auth.signOut()
    },
  }
}

// ---------------------------------------------------------------------
// Demo: reservas inventadas alrededor de hoy, guardadas solo en memoria.
// Sirve para mostrar el panel en el portafolio sin publicar una contraseña.
// ---------------------------------------------------------------------
const NOMBRES = [
  'Camila Soto', 'Benjamín Rojas', 'Valentina Muñoz', 'Tomás Díaz', 'Sofía Pérez', 'Lucas González',
  'Martina Silva', 'Agustín Morales', 'Isidora Fuentes', 'Vicente Castro', 'Florencia Reyes',
  'Joaquín Herrera', 'Antonia Vargas', 'Maximiliano Torres', 'Catalina Núñez', 'Cristóbal Araya',
]

// Números pseudoaleatorios repetibles: el mismo día siempre genera las mismas reservas
function generador(semilla: number) {
  let s = semilla
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

function generarDia(dia: string, hoy: string): ReservaAdmin[] {
  const diaSemana = new Date(`${dia}T12:00:00Z`).getUTCDay()
  if (diaSemana === 0) return [] // domingo cerrado
  const cierre = diaSemana === 6 ? 18 * 60 : 20 * 60
  const azar = generador(Number(dia.replaceAll('-', '')))
  const filas: ReservaAdmin[] = []

  for (const b of barberos) {
    let minuto = 10 * 60 + Math.floor(azar() * 4) * 30 // primera hora entre 10:00 y 11:30
    const cantidad = 2 + Math.floor(azar() * 3) // 2 a 4 reservas por barbero
    for (let i = 0; i < cantidad; i++) {
      const s = servicios[Math.floor(azar() * servicios.length)]
      if (minuto + s.duracionMin > cierre) break
      const hora = `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`
      const inicio = instanteChile(dia, hora)
      const r = azar()
      const estado: Estado =
        dia < hoy ? (r < 0.85 ? 'atendida' : 'no_asistio') : r < 0.1 ? 'cancelada' : r < 0.55 ? 'confirmada' : 'pendiente'
      filas.push({
        id: `demo-${dia}-${b.id}-${i}`,
        inicio,
        fin: new Date(new Date(inicio).getTime() + s.duracionMin * 60_000).toISOString(),
        barbero_id: b.id,
        barbero: b.nombre,
        servicio_id: s.id,
        servicio: s.nombre,
        precio: s.precio,
        cliente_nombre: NOMBRES[Math.floor(azar() * NOMBRES.length)],
        cliente_telefono: `+56 9 ${5000 + Math.floor(azar() * 4999)} ${1000 + Math.floor(azar() * 8999)}`,
        estado,
        creada_en: instanteChile(sumarDias(dia, -2), '12:00'),
      })
      minuto += Math.ceil(s.duracionMin / 30) * 30 + (azar() < 0.5 ? 30 : 60)
    }
  }
  return filas
}

export function fuenteDemo(alSalir: () => void): FuenteReservas {
  const hoy = hoyChile()
  const generados = new Set<string>()
  const reservas = new Map<string, ReservaAdmin>()
  const esperar = () => new Promise((listo) => setTimeout(listo, 250)) // se siente como una petición real

  return {
    async cargar(desde, hasta) {
      await esperar()
      for (let dia = desde; dia <= hasta; dia = sumarDias(dia, 1)) {
        if (generados.has(dia)) continue
        generados.add(dia)
        for (const r of generarDia(dia, hoy)) reservas.set(r.id, r)
      }
      const filas = [...reservas.values()]
        .filter((r) => diaDe(r.inicio) >= desde && diaDe(r.inicio) <= hasta)
        .sort((a, b) => a.inicio.localeCompare(b.inicio))
      return { filas, error: '' }
    },
    async cambiar(id, estado) {
      await esperar()
      const r = reservas.get(id)
      if (!r) return mensajeError('RESERVA_NO_EXISTE')
      reservas.set(id, { ...r, estado })
      return ''
    },
    salir: alSalir,
  }
}

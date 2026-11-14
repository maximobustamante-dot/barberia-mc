// ============================================================
// MODELO · Reservas del panel del dueño
// Dos "fuentes" con la misma forma: la real (Supabase) y la demo (datos inventados).
// El controlador usePanel no sabe cuál está usando.
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { barberos } from './datos/barberos'
import { servicios } from './datos/servicios'
import { diaDe, hoyChile, instanteChile, sumarDias } from './fechas'
import { aMinutos, aperturaDeFecha } from './horario'
import { codigoDeError, supabase } from './supabase'
import type { Estado, ReservaAdmin } from './tipos'

// Errores que pueden devolver admin_reservas y admin_cambiar_estado
export const ERRORES_PANEL = ['NO_AUTORIZADO', 'HORA_NO_DISPONIBLE', 'RESERVA_NO_EXISTE', 'RANGO_INVALIDO'] as const
export type ErrorPanel = (typeof ERRORES_PANEL)[number] | 'OTRO'

export interface FuenteReservas {
  cargar(desde: string, hasta: string): Promise<{ filas: ReservaAdmin[]; error: ErrorPanel | null }>
  cambiar(id: string, estado: Estado): Promise<ErrorPanel | null> // null = salió bien
  salir(): void
}

// ---------------------------------------------------------------------
// Panel real: todo pasa por las funciones SQL admin_reservas y admin_cambiar_estado,
// que revisan en la base de datos que el usuario sea administrador.
// ---------------------------------------------------------------------
function fuenteSupabase(cliente: SupabaseClient): FuenteReservas {
  return {
    async cargar(desde, hasta) {
      const { data, error } = await cliente.rpc('admin_reservas', { p_desde: desde, p_hasta: hasta })
      return error
        ? { filas: [], error: codigoDeError(error.message, ERRORES_PANEL) }
        : { filas: (data ?? []) as ReservaAdmin[], error: null }
    },
    async cambiar(id, estado) {
      const { error } = await cliente.rpc('admin_cambiar_estado', { p_reserva: id, p_estado: estado })
      return error ? codigoDeError(error.message, ERRORES_PANEL) : null
    },
    salir() {
      cliente.auth.signOut()
    },
  }
}

// Se crea una sola vez. null si falta .env.local.
export const fuenteReal = supabase ? fuenteSupabase(supabase) : null

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
  const apertura = aperturaDeFecha(dia) // horario de negocio.apertura
  if (!apertura) return [] // ese día el local no atiende
  const abre = aMinutos(apertura.abre)
  const cierre = aMinutos(apertura.cierra)
  const azar = generador(Number(dia.replaceAll('-', '')))
  const filas: ReservaAdmin[] = []

  for (const b of barberos) {
    let minuto = abre + Math.floor(azar() * 4) * 30 // primera reserva entre la apertura y 1 h 30 después
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
      return { filas, error: null }
    },
    async cambiar(id, estado) {
      await esperar()
      const r = reservas.get(id)
      if (!r) return 'RESERVA_NO_EXISTE'
      reservas.set(id, { ...r, estado })
      return null
    },
    salir: alSalir,
  }
}

// ============================================================
// MODELO · Tipos de datos del negocio
// Describen la forma de cada dato. No hacen nada por sí solos:
// TypeScript los usa para avisar si algo no calza.
// ============================================================

export interface Horario {
  dias: string
  horas: string
}

// Horario de apertura para cálculos ("abierto ahora", datos para Google)
// dias: 0 = domingo, 1 = lunes, ..., 6 = sábado
export interface Apertura {
  dias: number[]
  abre: string // 'HH:MM'
  cierra: string
}

export interface Negocio {
  nombre: string
  telefono: string // formato wa.me: código país, sin + ni espacios
  instagram: string
  direccion: string
  comuna: string
  horario: Horario[] // texto que se muestra
  apertura: Apertura[] // lo mismo, en formato para calcular
  nosotros: {
    titulo: string
    parrafos: string[]
    foto: string
  }
}

// Categorías de los filtros de la sección Servicios
export type CategoriaServicio = 'cortes' | 'barba' | 'detalles'

export interface Servicio {
  id: number
  nombre: string
  descripcion: string
  precio: number // en pesos chilenos
  duracionMin: number
  categoria: CategoriaServicio
  destacado?: boolean // muestra la insignia "Más pedido"
}

export interface Barbero {
  id: number
  nombre: string
  especialidad: string
  foto: string // ruta dentro de public/, ej: '/barberos/matias.jpg'
}

// ---- Reservas -------------------------------------------------------

// Lo mínimo que necesita el formulario de reserva (viene de la base)
export interface ServicioReservable {
  id: number
  nombre: string
  precio: number
  duracionMin: number
}

export interface BarberoReservable {
  id: number
  nombre: string
}

export interface DatosReserva {
  barberoId: number
  servicioId: number
  fecha: string // 'yyyy-mm-dd'
  hora: string // 'HH:MM'
  nombre: string
  telefono: string
}

// Estados posibles de una reserva (iguales al check de la tabla reservas)
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

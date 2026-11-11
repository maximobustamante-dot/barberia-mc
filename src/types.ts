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

export interface Servicio {
  id: number
  nombre: string
  descripcion: string
  precio: number // en pesos chilenos
  duracionMin: number
  destacado?: boolean // muestra la insignia "Más pedido"
}

export interface Barbero {
  id: number
  nombre: string
  especialidad: string
  foto: string // ruta dentro de public/, ej: '/barberos/matias.jpg'
}

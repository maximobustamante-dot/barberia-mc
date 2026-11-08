export interface Horario {
  dias: string
  horas: string
}

export interface Negocio {
  nombre: string
  telefono: string // formato wa.me: código país, sin + ni espacios
  instagram: string
  direccion: string
  comuna: string
  horario: Horario[]
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
}

export interface Barbero {
  id: number
  nombre: string
  especialidad: string
  foto: string // ruta dentro de public/, ej: '/barberos/matias.jpg'
}

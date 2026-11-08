export interface Horario {
    dias: string
    horas: string
}

export interface Negocio {
    nombre: string
    telefono: string // formato wa.me: código país, sin + ni espacios
    direccion: string
    comuna: string
    horario: Horario[]
    nosotros: {
    subtitulo: string
    titulo: string
    parrafos: string[]
    foto: string
    }
}
import type { Negocio } from '../types'

export const negocio: Negocio = {
  nombre: 'Barbería',
  telefono: '56912345678',
  instagram: 'barberia',
  direccion: 'Av. Providencia 1234',
  comuna: 'Providencia, Santiago',
  horario: [
    { dias: 'Lunes a viernes', horas: '10:00 – 20:00' },
    { dias: 'Sábado', horas: '10:00 – 18:00' },
    { dias: 'Domingo', horas: 'Cerrado' },
  ],
  // Debe coincidir con "horario" de arriba y con la tabla horarios de Supabase
  apertura: [
    { dias: [1, 2, 3, 4, 5], abre: '10:00', cierra: '20:00' },
    { dias: [6], abre: '10:00', cierra: '18:00' },
  ],
  nosotros: {
    titulo: 'Oficio, buena conversa y cero apuro',
    parrafos: [
      'Somos una barbería de barrio donde cada corte se hace con tiempo y atención al detalle.',
      'Trabajamos con técnicas clásicas y estilos actuales para que salgas sintiéndote como tú, pero mejor.',
    ],
    foto: '/nosotros.jpg',
  },
}

import type { Negocio } from '../types'

export const negocio: Negocio = {
nombre: 'Barbería',
telefono: '56912345678',
direccion: 'Av. Providencia 1234',
comuna: 'Providencia, Santiago',
horario: [
    { dias: 'Lunes a viernes', horas: '10:00 – 20:00' },
    { dias: 'Sábado', horas: '10:00 – 18:00' },
    { dias: 'Domingo', horas: 'Cerrado' },
],
nosotros: {
    subtitulo: 'Quiénes somos',
    titulo: 'Oficio, buena conversa y cero apuro',
    parrafos: [
    'Somos una barbería de barrio donde cada corte se hace con tiempo y atención al detalle.',
    'Trabajamos con técnicas clásicas y estilos actuales para que salgas sintiéndote como tú, pero mejor.',
    ],
    foto: '/nosotros.jpg',
},
}
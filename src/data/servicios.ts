import type { Servicio } from '../types'

// Precios de ejemplo. "categoria" decide en qué filtro de la sección Servicios aparece.
export const servicios: Servicio[] = [
  { id: 1, nombre: 'Corte clásico', descripcion: 'Tijera y máquina, lavado incluido.', precio: 12000, duracionMin: 40, categoria: 'cortes' },
  { id: 2, nombre: 'Fade', descripcion: 'Degradado con terminación a navaja.', precio: 14000, duracionMin: 45, categoria: 'cortes' },
  { id: 3, nombre: 'Barba', descripcion: 'Perfilado con toalla caliente.', precio: 8000, duracionMin: 25, categoria: 'barba' },
  { id: 4, nombre: 'Corte + barba', descripcion: 'El servicio completo.', precio: 18000, duracionMin: 60, categoria: 'barba', destacado: true },
  { id: 5, nombre: 'Corte infantil', descripcion: 'Hasta 12 años.', precio: 10000, duracionMin: 30, categoria: 'cortes' },
  { id: 6, nombre: 'Diseño de cejas', descripcion: 'Limpieza y perfilado a navaja.', precio: 5000, duracionMin: 15, categoria: 'detalles' },
]

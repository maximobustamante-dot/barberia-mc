import { describe, expect, it } from 'vitest'
import { formatearTelefono, normalizarTelefono } from './telefono'

// Debe dar lo mismo que normalizar_telefono() en SQL: así el límite de
// 2 reservas por teléfono no se salta escribiendo el número de otra forma.
describe('normalizarTelefono', () => {
  it.each([
    ['+56 9 1234 5678', '56912345678'],
    ['56912345678', '56912345678'],
    ['9 1234 5678', '56912345678'],
    ['912345678', '56912345678'],
    ['+56 (9) 1234-5678', '56912345678'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarTelefono(entrada)).toBe(esperado)
  })

  it('no inventa el 56 si el número no es un celular de 9 dígitos', () => {
    expect(normalizarTelefono('22 345 6789')).toBe('223456789')
  })
})

describe('formatearTelefono', () => {
  it('muestra los celulares chilenos con espacios', () => {
    expect(formatearTelefono('56912345678')).toBe('+56 9 1234 5678')
    expect(formatearTelefono('9 1234 5678')).toBe('+56 9 1234 5678')
  })
  it('deja tal cual lo que no reconoce', () => {
    expect(formatearTelefono('123')).toBe('123')
  })
})

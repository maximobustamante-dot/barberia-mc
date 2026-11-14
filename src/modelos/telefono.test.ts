import { describe, expect, it } from 'vitest'
import { formatearTelefono, limpiarTelefono, normalizarTelefono, telefonoValido } from './telefono'

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

describe('limpiarTelefono', () => {
  it('cambia guiones y paréntesis por espacios, como exige la tabla reservas', () => {
    expect(limpiarTelefono('+56 (9) 1234-5678')).toBe('+56 9 1234 5678')
    expect(limpiarTelefono(' 9 1234-5678 ')).toBe('9 1234 5678')
  })
  it('el resultado cumple la regla de la base (^\\+?[0-9 ]{8,16}$)', () => {
    expect(limpiarTelefono('+56 (9) 1234-5678')).toMatch(/^\+?[0-9 ]{8,16}$/)
  })
})

describe('telefonoValido', () => {
  it('acepta las formas comunes de escribir un celular chileno', () => {
    for (const t of ['+56 9 1234 5678', '9 1234-5678', '+56 (9) 1234-5678', '912345678']) expect(telefonoValido(t)).toBe(true)
  })
  it('rechaza lo que el navegador deja pasar pero la base no aceptaría', () => {
    for (const t of ['--------', '((((((((', '+56 9 1234 5678 9999', '1234']) expect(telefonoValido(t)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { nombreValido } from './cliente'

describe('nombreValido (misma regla que nombre_valido en SQL)', () => {
  it('acepta nombres reales', () => {
    for (const n of ['Ana', 'José Muñoz', "D'Angelo", 'María-Paz Núñez', '  Ñuñoa Pérez  ', 'Juan P.', 'María José R.', 'Łukasz', 'Jose\u0301'])
      expect(nombreValido(n)).toBe(true)
  })
  it('rechaza lo que usaría un atacante', () => {
    for (const n of [
      '<img src=x onerror=alert(1)>', // HTML
      'Paga en bit.ly/pago', // link
      'bit.ly', // el punto pegado a letras arma un link
      'Ana\n', // salto de línea al final (la base también lo rechaza)
      'Ana\n\nTu hora fue anulada', // mensaje falso con saltos de línea
      'Ana\u202eadnaS', // carácter invisible que da vuelta el texto
      'Cliente 01', // números
      'A', // muy corto
      'A'.repeat(61), // muy largo
    ])
      expect(nombreValido(n)).toBe(false)
  })
})

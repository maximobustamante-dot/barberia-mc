import { describe, expect, it } from 'vitest'
import { fechaCorta, pesos } from './formato'
import { codigoDeError } from './supabase'
import { ERRORES_RESERVA } from './reservas'

describe('formato', () => {
  it('pesos chilenos con punto de miles', () => {
    expect(pesos(12000)).toBe('$12.000')
  })
  it('fecha corta dd-mm-aaaa', () => {
    expect(fechaCorta('2026-11-16')).toBe('16-11-2026')
    expect(fechaCorta('')).toBe('')
  })
})

describe('codigoDeError', () => {
  it('saca el código que lanzó la función SQL del mensaje de Supabase', () => {
    expect(codigoDeError('LIMITE_RESERVAS', ERRORES_RESERVA)).toBe('LIMITE_RESERVAS')
    expect(codigoDeError('P0001: HORA_NO_DISPONIBLE', ERRORES_RESERVA)).toBe('HORA_NO_DISPONIBLE')
    expect(codigoDeError('Failed to fetch', ERRORES_RESERVA)).toBe('OTRO')
  })
})

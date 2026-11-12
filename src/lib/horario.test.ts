import { describe, expect, it } from 'vitest'
import { estadoHorario } from './horario'

// Horario de ejemplo (src/data/negocio.ts): lun–vie 10:00–20:00, sáb 10:00–18:00, domingo cerrado.
// Las fechas van en UTC; noviembre en Chile es UTC-3.
describe('estadoHorario (hora de Chile)', () => {
  it.each([
    ['2026-11-16T12:00:00Z', false, 'Cerrado · Abre hoy a las 10:00'], // lunes 09:00
    ['2026-11-16T13:00:00Z', true, 'Abierto ahora · Cierra a las 20:00'], // lunes 10:00
    ['2026-11-16T22:59:00Z', true, 'Abierto ahora · Cierra a las 20:00'], // lunes 19:59
    ['2026-11-16T23:00:00Z', false, 'Cerrado · Abre mañana a las 10:00'], // lunes 20:00
    ['2026-11-17T11:00:00Z', false, 'Cerrado · Abre hoy a las 10:00'], // martes 08:00
    ['2026-11-21T21:00:00Z', false, 'Cerrado · Abre el lunes a las 10:00'], // sábado 18:00
    ['2026-11-22T15:00:00Z', false, 'Cerrado · Abre mañana a las 10:00'], // domingo 12:00
  ])('%s', (instante, abierto, texto) => {
    const estado = estadoHorario(new Date(instante))
    expect(estado.abierto).toBe(abierto)
    expect(estado.texto).toBe(texto)
  })
})

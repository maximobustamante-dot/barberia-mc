import { describe, expect, it } from 'vitest'
import { MENSAJES_LOGIN, MENSAJES_PANEL, MENSAJES_RESERVA } from './mensajes'
import { ERRORES_PANEL } from '../modelos/panel'
import { ERRORES_RESERVA } from '../modelos/reservas'

describe('mensajes', () => {
  it('cada código de error del modelo tiene un texto', () => {
    for (const c of [...ERRORES_RESERVA, 'OTRO' as const]) expect(MENSAJES_RESERVA[c]).toBeTruthy()
    for (const c of [...ERRORES_PANEL, 'OTRO' as const]) expect(MENSAJES_PANEL[c]).toBeTruthy()
  })
  it('el login no revela si falló el correo o la contraseña', () => {
    expect(MENSAJES_LOGIN.credenciales).toBe('Correo o contraseña incorrectos.')
  })
  it('textos clave', () => {
    expect(MENSAJES_PANEL.NO_AUTORIZADO).toMatch(/permiso/)
    expect(MENSAJES_PANEL.OTRO).toMatch(/conexión/)
    expect(MENSAJES_RESERVA.FECHA_FUERA_DE_RANGO).toContain('30 días')
  })
})

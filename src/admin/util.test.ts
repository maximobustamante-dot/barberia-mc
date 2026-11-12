import { describe, expect, it } from 'vitest'
import { diaDe, enlaceWhatsApp, fechaLarga, horaDe, instanteChile, lunesDe, mensajeError, sumarDias, type ReservaAdmin } from './util'

describe('fechas en hora de Chile', () => {
  it('convierte hora de Chile a UTC en verano (UTC-3) y en invierno (UTC-4)', () => {
    expect(instanteChile('2026-11-16', '10:30')).toBe('2026-11-16T13:30:00.000Z')
    expect(instanteChile('2026-07-15', '10:30')).toBe('2026-07-15T14:30:00.000Z')
  })
  it('una reserva a las 23:30 de Chile sigue siendo de ese día (aunque en UTC ya sea mañana)', () => {
    const instante = instanteChile('2026-11-16', '23:30')
    expect(diaDe(instante)).toBe('2026-11-16')
    expect(horaDe(instante)).toBe('23:30')
  })
  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-11-30', 1)).toBe('2026-12-01')
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('encuentra el lunes de la semana (domingo pertenece a la semana anterior)', () => {
    expect(lunesDe('2026-11-18')).toBe('2026-11-16') // miércoles
    expect(lunesDe('2026-11-22')).toBe('2026-11-16') // domingo
    expect(lunesDe('2026-11-16')).toBe('2026-11-16')
  })
  it('escribe la fecha en español', () => {
    expect(fechaLarga('2026-11-16')).toBe('lunes, 16 de noviembre')
  })
})

describe('enlaceWhatsApp', () => {
  it('arma el enlace con el número normalizado y un mensaje con la hora', () => {
    const r = {
      cliente_nombre: 'Ana',
      cliente_telefono: '+56 9 1111 2222',
      servicio: 'Fade',
      inicio: instanteChile('2026-11-16', '10:00'),
    } as ReservaAdmin
    const enlace = enlaceWhatsApp(r, 'Barbería')
    expect(enlace.startsWith('https://wa.me/56911112222?text=')).toBe(true)
    expect(decodeURIComponent(enlace)).toContain('Hola Ana')
    expect(decodeURIComponent(enlace)).toContain('a las 10:00')
  })
})

describe('mensajeError', () => {
  it('traduce los códigos de las funciones SQL', () => {
    expect(mensajeError('NO_AUTORIZADO')).toMatch(/permiso/)
    expect(mensajeError('HORA_NO_DISPONIBLE')).toMatch(/otro cliente/)
    expect(mensajeError('cualquier otra cosa')).toMatch(/conexión/)
  })
})

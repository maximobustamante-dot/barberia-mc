import { describe, expect, it } from 'vitest'
import { instagramDelLocal, whatsappDelCliente, whatsappDelLocal } from './enlaces'
import { instanteChile } from './fechas'
import type { ReservaAdmin } from './tipos'

describe('enlaces', () => {
  it('chat con el local, con y sin mensaje', () => {
    expect(whatsappDelLocal()).toBe('https://wa.me/56912345678')
    expect(whatsappDelLocal('Hola, quiero una hora')).toBe('https://wa.me/56912345678?text=Hola%2C%20quiero%20una%20hora')
    expect(instagramDelLocal()).toBe('https://instagram.com/barberia')
  })

  it('chat con el cliente: número normalizado y mensaje con la hora en Chile', () => {
    const r = {
      cliente_nombre: 'Ana',
      cliente_telefono: '+56 9 1111 2222',
      servicio: 'Fade',
      inicio: instanteChile('2026-11-16', '10:00'),
    } as ReservaAdmin
    const enlace = whatsappDelCliente(r)
    expect(enlace.startsWith('https://wa.me/56911112222?text=')).toBe(true)
    expect(decodeURIComponent(enlace)).toContain('Hola Ana')
    expect(decodeURIComponent(enlace)).toContain('a las 10:00')
  })
})

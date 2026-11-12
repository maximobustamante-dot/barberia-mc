import { describe, expect, it } from 'vitest'
import { fuenteDemo } from './fuente'
import { diaDe, hoyChile, lunesDe, sumarDias } from './util'

describe('fuenteDemo (panel de demostración)', () => {
  const desde = lunesDe(hoyChile())
  const hasta = sumarDias(desde, 6)

  it('genera reservas de lunes a sábado y ninguna el domingo', async () => {
    const { filas } = await fuenteDemo(() => {}).cargar(desde, hasta)
    expect(filas.length).toBeGreaterThan(0)
    const dias = new Set(filas.map((r) => diaDe(r.inicio)))
    expect(dias.has(sumarDias(desde, 6))).toBe(false)
  })

  it('un barbero nunca tiene dos reservas cruzadas (igual que sin_cruces en SQL)', async () => {
    const { filas } = await fuenteDemo(() => {}).cargar(desde, hasta)
    for (const a of filas)
      for (const b of filas)
        if (a.id !== b.id && a.barbero_id === b.barbero_id) expect(a.fin <= b.inicio || b.fin <= a.inicio).toBe(true)
  })

  it('siempre genera los mismos datos y guarda los cambios de estado', async () => {
    const f1 = fuenteDemo(() => {})
    const f2 = fuenteDemo(() => {})
    const a = (await f1.cargar(desde, hasta)).filas
    expect((await f2.cargar(desde, hasta)).filas).toEqual(a)
    expect(await f1.cambiar(a[0].id, 'cancelada')).toBe('')
    expect((await f1.cargar(desde, hasta)).filas[0].estado).toBe('cancelada')
    expect(await f1.cambiar('no-existe', 'cancelada')).toMatch(/ya no existe/)
  })
})

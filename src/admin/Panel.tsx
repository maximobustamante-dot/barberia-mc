import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { negocio } from '../data/negocio'
import { barberos } from '../data/barberos'
import TarjetaReserva from './TarjetaReserva'
import type { FuenteReservas } from './fuente'
import {
  diaDe,
  fechaLarga,
  hoyChile,
  lunesDe,
  pesos,
  sumarDias,
  type Estado,
  type ReservaAdmin,
} from './util'

type Vista = 'dia' | 'semana'

interface Props {
  email: string
  fuente: FuenteReservas // Supabase en el panel real, datos inventados en la demo
  demo?: boolean
}

export default function Panel({ email, fuente, demo = false }: Props) {
  const [vista, setVista] = useState<Vista>('dia')
  const [fecha, setFecha] = useState(hoyChile)
  const [barbero, setBarbero] = useState<number | 'todos'>('todos')
  const [verCanceladas, setVerCanceladas] = useState(false)

  const [recarga, setRecarga] = useState(0) // al aumentar, vuelve a pedir las reservas
  const [cargadas, setCargadas] = useState({ clave: '', filas: [] as ReservaAdmin[], error: '' })
  const [ocupada, setOcupada] = useState<string | null>(null) // reserva que se está actualizando
  const [aviso, setAviso] = useState('')

  // Rango de fechas que se muestra
  const desde = vista === 'dia' ? fecha : lunesDe(fecha)
  const hasta = vista === 'dia' ? fecha : sumarDias(desde, 6)
  const clave = `${desde}_${hasta}_${recarga}`
  const cargando = cargadas.clave !== clave

  // 1. Pedir las reservas del rango a la base de datos
  useEffect(() => {
    let vigente = true // si cambia la fecha antes de que llegue la respuesta, se ignora
    fuente.cargar(desde, hasta).then(({ filas, error }) => {
      if (vigente) setCargadas({ clave, filas, error })
    })
    return () => {
      vigente = false
    }
  }, [clave, desde, hasta, fuente])

  // 2. Actualizar solo: al volver a la pestaña y cada 2 minutos
  useEffect(() => {
    const actualizar = () => setRecarga((n) => n + 1)
    const cadaRato = setInterval(actualizar, 120_000)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(cadaRato)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  // 3. Cambiar el estado de una reserva
  async function cambiar(id: string, estado: Estado) {
    setOcupada(id)
    setAviso('')
    const error = await fuente.cambiar(id, estado)
    setOcupada(null)
    setAviso(error)
    setRecarga((n) => n + 1)
  }

  // Filtros y números del resumen
  const filas = cargadas.filas
  const delBarbero = filas.filter((r) => barbero === 'todos' || r.barbero_id === barbero)
  const activas = delBarbero.filter((r) => r.estado !== 'cancelada')
  const visibles = verCanceladas ? delBarbero : activas
  const resumen = [
    { titulo: 'Reservas', valor: String(activas.length) },
    { titulo: 'Por confirmar', valor: String(activas.filter((r) => r.estado === 'pendiente').length) },
    {
      titulo: 'Ingreso estimado',
      valor: pesos(activas.filter((r) => r.estado !== 'no_asistio').reduce((suma, r) => suma + r.precio, 0)),
    },
    { titulo: 'No asistieron', valor: String(activas.filter((r) => r.estado === 'no_asistio').length) },
  ]

  // Días del rango, cada uno con sus reservas
  const dias = Array.from({ length: vista === 'dia' ? 1 : 7 }, (_, i) => sumarDias(desde, i))
  const porDia = dias.map((dia) => ({ dia, reservas: visibles.filter((r) => diaDe(r.inicio) === dia) }))

  const paso = vista === 'dia' ? 1 : 7
  const titulo = vista === 'dia' ? fechaLarga(fecha) : `Semana del ${fechaLarga(desde)}`

  return (
    <div className="min-h-screen bg-hueso text-azul">
      <header className="bg-azul text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <p className="font-titulo text-xl uppercase tracking-wider">
            {negocio.nombre} <span className="text-white/50">· Panel</span>
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-white/60 sm:inline">{email}</span>
            <Link to="/" className="text-white/80 hover:text-white">
              Ver página
            </Link>
            <button
              type="button"
              onClick={() => fuente.salir()}
              className="rounded-lg border border-white/20 px-3 py-1.5 font-semibold hover:bg-white/10"
            >
              {demo ? 'Salir de la demo' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
        {demo && (
          <p className="bg-rojo px-6 py-2 text-center text-xs font-semibold text-white sm:text-sm">
            Modo demo: los clientes y reservas son inventados y los cambios se borran al recargar.
          </p>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Controles de fecha */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-titulo text-3xl uppercase first-letter:uppercase md:text-4xl">{titulo}</h1>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="flex rounded-xl border border-azul/15 bg-white p-1" role="group" aria-label="Vista">
              {(['dia', 'semana'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vista === v}
                  onClick={() => setVista(v)}
                  className={`h-9 rounded-lg px-3 text-xs font-bold uppercase tracking-wider sm:h-7 ${
                    vista === v ? 'bg-azul text-white' : 'text-azul/70 hover:text-azul'
                  }`}
                >
                  {v === 'dia' ? 'Día' : 'Semana'}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => setFecha(sumarDias(fecha, -paso))}
              className="h-11 w-11 rounded-lg border border-azul/15 bg-white font-bold hover:bg-azul/5 sm:h-9 sm:w-9"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setFecha(hoyChile())}
              className="h-11 rounded-lg border border-azul/15 bg-white px-3 text-xs font-bold uppercase tracking-wider hover:bg-azul/5 sm:h-9"
            >
              Hoy
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => setFecha(sumarDias(fecha, paso))}
              className="h-11 w-11 rounded-lg border border-azul/15 bg-white font-bold hover:bg-azul/5 sm:h-9 sm:w-9"
            >
              ›
            </button>
            <input
              type="date"
              aria-label="Elegir fecha"
              value={fecha}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="h-11 basis-full rounded-lg border border-azul/15 bg-white px-3 text-sm sm:h-9 sm:basis-auto"
            />
          </div>
        </div>

        {/* Resumen en números */}
        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {resumen.map((c) => (
            <div key={c.titulo} className="rounded-2xl border border-azul/10 bg-white p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-azul/60">{c.titulo}</dt>
              <dd className="mt-1 font-titulo text-3xl tabular-nums">{c.valor}</dd>
            </div>
          ))}
        </dl>

        {/* Filtros */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {[{ id: 'todos' as const, nombre: 'Todos' }, ...barberos].map(({ id, nombre }) => (
            <button
              key={id}
              type="button"
              aria-pressed={barbero === id}
              onClick={() => setBarbero(id)}
              className={`h-10 rounded-full px-4 text-xs font-bold uppercase tracking-wider sm:h-8 ${
                barbero === id ? 'bg-azul text-white' : 'bg-white text-azul/70 ring-1 ring-azul/10 hover:text-azul'
              }`}
            >
              {nombre}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-azul/75">
            <input
              type="checkbox"
              checked={verCanceladas}
              onChange={(e) => setVerCanceladas(e.target.checked)}
              className="h-4 w-4 accent-rojo"
            />
            Mostrar canceladas
          </label>
        </div>

        {(cargadas.error || aviso) && (
          <p role="alert" className="mt-4 rounded-xl bg-rojo/10 px-4 py-3 text-sm font-semibold text-rojo">
            {aviso || cargadas.error}
          </p>
        )}

        {/* Reservas agrupadas por día */}
        <div className="mt-6 space-y-8" aria-busy={cargando}>
          {vista === 'dia' ? (
            <ListaDia reservas={porDia[0].reservas} vacio={textoVacio(fecha, cargando)} ocupada={ocupada} onCambiar={cambiar} />
          ) : (
            <>
              {porDia
                .filter((d) => d.reservas.length > 0)
                .map(({ dia, reservas }) => (
                  <section key={dia}>
                    <h2 className="mb-3 font-titulo text-xl uppercase first-letter:uppercase">
                      {fechaLarga(dia)} <span className="text-azul/60">· {reservas.length}</span>
                    </h2>
                    <ListaDia reservas={reservas} vacio="" ocupada={ocupada} onCambiar={cambiar} />
                  </section>
                ))}
              {porDia.some((d) => d.reservas.length === 0) && (
                <p className="rounded-2xl border border-dashed border-azul/20 px-4 py-4 text-sm text-azul/70">
                  {cargando ? 'Cargando reservas…' : (
                    <>
                      <strong className="font-semibold">Sin reservas:</strong>{' '}
                      {porDia
                        .filter((d) => d.reservas.length === 0)
                        .map((d) => textoCorto(d.dia))
                        .join(', ')}
                    </>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// Domingo cerrado (según el horario de la tabla horarios del ejemplo)
const esDomingo = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay() === 0

function textoVacio(dia: string, cargando: boolean) {
  if (cargando) return 'Cargando reservas…'
  return esDomingo(dia) ? 'Domingo: el local está cerrado.' : 'Sin reservas.'
}

// 'lunes 16 de noviembre' → 'lun 16' (domingo marcado como cerrado)
function textoCorto(dia: string) {
  const [nombre, numero] = fechaLarga(dia).replace(',', '').split(' ')
  return `${nombre.slice(0, 3)} ${numero ?? ''}${esDomingo(dia) ? ' (cerrado)' : ''}`.trim()
}

interface ListaDiaProps {
  reservas: ReservaAdmin[]
  vacio: string
  ocupada: string | null
  onCambiar: (id: string, estado: Estado) => void
}

function ListaDia({ reservas, vacio, ocupada, onCambiar }: ListaDiaProps) {
  if (reservas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-azul/20 px-4 py-6 text-center text-sm text-azul/70">
        {vacio}
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {reservas.map((r) => (
        <TarjetaReserva
          key={r.id}
          reserva={r}
          ocupado={ocupada === r.id}
          onCambiar={(estado) => onCambiar(r.id, estado)}
        />
      ))}
    </ul>
  )
}

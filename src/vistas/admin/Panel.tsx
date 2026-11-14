// ============================================================
// VISTA · Panel del dueño
// Solo dibuja. Qué reservas se ven, los filtros y las acciones vienen de usePanel().
// La misma vista sirve para el panel real y para la demo: cambia solo la "fuente".
// ============================================================
import { Link } from 'react-router'
import { usePanel } from '../../controladores/usePanel'
import { barberos } from '../../modelos/datos/barberos'
import { negocio } from '../../modelos/datos/negocio'
import { fechaLarga } from '../../modelos/fechas'
import { pesos } from '../../modelos/formato'
import type { FuenteReservas } from '../../modelos/panel'
import type { Estado, ReservaAdmin } from '../../modelos/tipos'
import TarjetaReserva from './TarjetaReserva'

interface Props {
  email: string
  fuente: FuenteReservas // Supabase en el panel real, datos inventados en la demo
  demo?: boolean
}

export default function Panel({ email, fuente, demo = false }: Props) {
  const p = usePanel(fuente)
  const titulo = p.vista === 'dia' ? fechaLarga(p.fecha) : `Semana del ${fechaLarga(p.desde)}`
  const resumen = [
    { titulo: 'Reservas', valor: String(p.resumen.reservas) },
    { titulo: 'Por confirmar', valor: String(p.resumen.porConfirmar) },
    { titulo: 'Ingreso estimado', valor: pesos(p.resumen.ingresoEstimado) },
    { titulo: 'No asistieron', valor: String(p.resumen.noAsistieron) },
  ]

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
              onClick={p.salir}
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
                  aria-pressed={p.vista === v}
                  onClick={() => p.cambiarVista(v)}
                  className={`h-9 rounded-lg px-3 text-xs font-bold uppercase tracking-wider sm:h-7 ${
                    p.vista === v ? 'bg-azul text-white' : 'text-azul/70 hover:text-azul'
                  }`}
                >
                  {v === 'dia' ? 'Día' : 'Semana'}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Anterior"
              onClick={p.anterior}
              className="h-11 w-11 rounded-lg border border-azul/15 bg-white font-bold hover:bg-azul/5 sm:h-9 sm:w-9"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={p.irAHoy}
              className="h-11 rounded-lg border border-azul/15 bg-white px-3 text-xs font-bold uppercase tracking-wider hover:bg-azul/5 sm:h-9"
            >
              Hoy
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={p.siguiente}
              className="h-11 w-11 rounded-lg border border-azul/15 bg-white font-bold hover:bg-azul/5 sm:h-9 sm:w-9"
            >
              ›
            </button>
            <input
              type="date"
              aria-label="Elegir fecha"
              value={p.fecha}
              onChange={(e) => p.irAFecha(e.target.value)}
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
              aria-pressed={p.barbero === id}
              onClick={() => p.filtrarBarbero(id)}
              className={`h-10 rounded-full px-4 text-xs font-bold uppercase tracking-wider sm:h-8 ${
                p.barbero === id ? 'bg-azul text-white' : 'bg-white text-azul/70 ring-1 ring-azul/10 hover:text-azul'
              }`}
            >
              {nombre}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-azul/75">
            <input
              type="checkbox"
              checked={p.verCanceladas}
              onChange={(e) => p.mostrarCanceladas(e.target.checked)}
              className="h-4 w-4 accent-rojo"
            />
            Mostrar canceladas
          </label>
        </div>

        {p.error && (
          <p role="alert" className="mt-4 rounded-xl bg-rojo/10 px-4 py-3 text-sm font-semibold text-rojo">
            {p.error}
          </p>
        )}

        {/* Reservas agrupadas por día */}
        <div className="mt-6 space-y-8" aria-busy={p.cargando}>
          {p.vista === 'dia' ? (
            <ListaDia
              reservas={p.dias[0].reservas}
              vacio={p.esperandoRango ? 'Cargando reservas…' : p.dias[0].cerrado ? 'El local no atiende este día.' : 'Sin reservas.'}
              ocupada={p.ocupada}
              onCambiar={p.cambiar}
            />
          ) : (
            <>
              {p.dias
                .filter((d) => d.reservas.length > 0)
                .map(({ dia, reservas }) => (
                  <section key={dia}>
                    <h2 className="mb-3 font-titulo text-xl uppercase first-letter:uppercase">
                      {fechaLarga(dia)} <span className="text-azul/60">· {reservas.length}</span>
                    </h2>
                    <ListaDia reservas={reservas} vacio="" ocupada={p.ocupada} onCambiar={p.cambiar} />
                  </section>
                ))}
              {p.dias.some((d) => d.reservas.length === 0) && (
                <p className="rounded-2xl border border-dashed border-azul/20 px-4 py-4 text-sm text-azul/70">
                  {p.esperandoRango ? 'Cargando reservas…' : (
                    <>
                      <strong className="font-semibold">Sin reservas:</strong>{' '}
                      {p.dias
                        .filter((d) => d.reservas.length === 0)
                        .map((d) => textoCorto(d.dia, d.cerrado))
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

// 'lunes 16 de noviembre' → 'lun 16' (los días sin atención se marcan como cerrados)
function textoCorto(dia: string, cerrado: boolean) {
  const [nombre, numero] = fechaLarga(dia).replace(',', '').split(' ')
  return `${nombre.slice(0, 3)} ${numero ?? ''}${cerrado ? ' (cerrado)' : ''}`.trim()
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

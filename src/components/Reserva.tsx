import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { negocio } from '../data/negocio'

interface Opcion {
  id: number
  nombre: string
}

interface ServicioOpcion extends Opcion {
  precio: number
  duracionMin: number
}

interface Confirmada {
  servicio: string
  barbero: string
  fecha: string
  hora: string
}

// Fecha de hoy en formato yyyy-mm-dd según la hora del computador
function hoy() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

// '2026-11-16' → '16-11-2026'
function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}-${mes}-${anio}`
}

const campo = 'w-full rounded-lg border border-white/20 bg-white px-4 py-3 text-azul'
const etiqueta = 'mb-2 block text-sm font-semibold'

export default function Reserva() {
  const [servicios, setServicios] = useState<ServicioOpcion[]>([])
  const [barberos, setBarberos] = useState<Opcion[]>([])

  const [servicioId, setServicioId] = useState<number | null>(null)
  const [barberoId, setBarberoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')

  // Horas libres, junto con la combinación servicio-barbero-fecha a la que pertenecen
  const [horasCargadas, setHorasCargadas] = useState({ clave: '', horas: [] as string[] })
  const [recarga, setRecarga] = useState(0) // al aumentar, vuelve a pedir las horas
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [confirmada, setConfirmada] = useState<Confirmada | null>(null)

  // 1. Al abrir la página: traer servicios y barberos desde la base de datos
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('servicios')
      .select('id, nombre, precio, duracionMin:duracion_min')
      .order('id')
      .then(({ data }) => {
        if (data) {
          setServicios(data)
          setServicioId(data[0]?.id ?? null)
        }
      })
    supabase
      .from('barberos')
      .select('id, nombre')
      .order('id')
      .then(({ data }) => {
        if (data) {
          setBarberos(data)
          setBarberoId(data[0]?.id ?? null)
        }
      })
  }, [])

  // 2. Cada vez que cambia servicio, barbero o fecha: pedir las horas libres
  const clave = servicioId && barberoId && fecha ? `${servicioId}-${barberoId}-${fecha}` : ''
  const cargandoHoras = clave !== '' && horasCargadas.clave !== clave
  const horas = horasCargadas.clave === clave ? horasCargadas.horas : []

  useEffect(() => {
    if (!supabase || !clave) return
    let vigente = true // evita mostrar una respuesta vieja si el usuario cambió algo
    supabase
      .rpc('horas_disponibles', { p_barbero: barberoId, p_servicio: servicioId, p_fecha: fecha })
      .then(({ data, error }) => {
        if (!vigente) return
        if (error) setError('No pudimos cargar las horas. Intenta de nuevo.')
        const lista = error ? [] : (data as { hora: string }[]).map((h) => h.hora.slice(0, 5))
        setHorasCargadas({ clave, horas: lista })
      })
    return () => {
      vigente = false
    }
  }, [clave, servicioId, barberoId, fecha, recarga])

  // 3. Enviar la reserva
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase || !servicioId || !barberoId || !hora) return
    setEnviando(true)
    setError('')

    const { error } = await supabase.rpc('crear_reserva', {
      p_barbero: barberoId,
      p_servicio: servicioId,
      p_fecha: fecha,
      p_hora: hora,
      p_nombre: nombre,
      p_telefono: telefono,
    })
    setEnviando(false)

    if (error) {
      if (error.message.includes('HORA_NO_DISPONIBLE')) {
        setError('Esa hora se acaba de ocupar. Elige otra.')
        setHora('')
        setHorasCargadas({ clave: '', horas: [] })
        setRecarga((n) => n + 1)
      } else {
        setError('No pudimos guardar la reserva. Revisa tus datos e intenta de nuevo.')
      }
      return
    }

    setConfirmada({
      servicio: servicios.find((s) => s.id === servicioId)?.nombre ?? '',
      barbero: barberos.find((b) => b.id === barberoId)?.nombre ?? '',
      fecha: formatearFecha(fecha),
      hora,
    })
  }

  function nuevaReserva() {
    setConfirmada(null)
    setFecha('')
    setHora('')
    setNombre('')
    setTelefono('')
  }

  return (
    <section id="reserva" className="scroll-mt-28 bg-azul px-6 py-24 text-white">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-azul-claro">Agenda tu hora</p>
          <h2 className="mt-3 font-titulo text-4xl uppercase md:text-5xl">Reserva en línea</h2>
          <p className="mt-6 leading-relaxed text-white/80">
            Elige el servicio, tu barbero y una hora libre. Te contactamos por WhatsApp para
            confirmar.
          </p>
        </div>

        {/* Sin Supabase configurado: se ofrece WhatsApp */}
        {!supabase && (
          <div className="rounded-lg bg-white/10 p-6">
            <p className="font-semibold">Las reservas en línea no están activas.</p>
            <p className="mt-2 text-white/80">Escríbenos y te damos una hora.</p>
            <a
              href={`https://wa.me/${negocio.telefono}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-full bg-rojo px-8 py-3 font-semibold hover:bg-rojo/90"
            >
              Escribir por WhatsApp
            </a>
          </div>
        )}

        {/* Reserva confirmada */}
        {supabase && confirmada && (
          <div className="rounded-lg bg-white p-8 text-azul" role="status">
            <h3 className="font-titulo text-3xl uppercase">Reserva recibida</h3>
            <p className="mt-4 leading-relaxed">
              {confirmada.servicio} con {confirmada.barbero}, el {confirmada.fecha} a las{' '}
              {confirmada.hora}.
            </p>
            <p className="mt-2 text-azul/75">Te escribiremos por WhatsApp para confirmarla.</p>
            <button
              type="button"
              onClick={nuevaReserva}
              className="mt-8 rounded-full border border-azul/30 px-6 py-2 font-semibold hover:bg-azul/5"
            >
              Hacer otra reserva
            </button>
          </div>
        )}

        {/* Formulario */}
        {supabase && !confirmada && (
          <form onSubmit={enviar} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
              <div>
                <label htmlFor="servicio" className={etiqueta}>Servicio</label>
                <select
                  id="servicio"
                  value={servicioId ?? ''}
                  onChange={(e) => {
                    setServicioId(Number(e.target.value))
                    setHora('')
                  }}
                  className={campo}
                >
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — ${s.precio.toLocaleString('es-CL')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="barbero" className={etiqueta}>Barbero</label>
                <select
                  id="barbero"
                  value={barberoId ?? ''}
                  onChange={(e) => {
                    setBarberoId(Number(e.target.value))
                    setHora('')
                  }}
                  className={campo}
                >
                  {barberos.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fecha" className={etiqueta}>Fecha</label>
              <input
                id="fecha"
                type="date"
                required
                min={hoy()}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  setHora('')
                }}
                className={campo}
              />
            </div>

            {fecha && (
              <fieldset>
                <legend className={etiqueta}>Hora</legend>
                {cargandoHoras && <p className="text-white/70">Buscando horas libres…</p>}
                {!cargandoHoras && horas.length === 0 && (
                  <p className="text-white/70">No quedan horas libres ese día. Prueba otra fecha o barbero.</p>
                )}
                {!cargandoHoras && horas.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {horas.map((h) => (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={hora === h}
                        onClick={() => setHora(h)}
                        className={`rounded-md border py-2 text-sm font-semibold ${
                          hora === h
                            ? 'border-rojo bg-rojo text-white'
                            : 'border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className={etiqueta}>Nombre</label>
                <input
                  id="nombre"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={campo}
                />
              </div>
              <div>
                <label htmlFor="telefono" className={etiqueta}>Teléfono (WhatsApp)</label>
                <input
                  id="telefono"
                  type="tel"
                  required
                  pattern="\+?[0-9 ]{8,16}"
                  title="Solo números, por ejemplo +56 9 1234 5678"
                  placeholder="+56 9 1234 5678"
                  autoComplete="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={campo}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-rojo/20 px-4 py-3 text-sm font-semibold">
                {error}
              </p>
            )}

            <button
              disabled={!hora || enviando}
              className="mt-2 rounded-full bg-rojo py-3 font-semibold text-white hover:bg-rojo/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Reservando…' : hora ? `Reservar a las ${hora}` : 'Elige una hora'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

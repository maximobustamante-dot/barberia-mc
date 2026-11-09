import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { negocio } from '../data/negocio'
import { servicios as serviciosLocales } from '../data/servicios'
import { barberos as barberosLocales } from '../data/barberos'

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
  telefono?: string
  nombre?: string
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
  if (!fecha) return ''
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}-${mes}-${anio}`
}

const horasFallback = [
  '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00',
]

export default function Reserva() {
  const [servicios, setServicios] = useState<ServicioOpcion[]>(serviciosLocales)
  const [barberos, setBarberos] = useState<Opcion[]>(barberosLocales)

  const [servicioId, setServicioId] = useState<number | null>(serviciosLocales[0]?.id ?? 1)
  const [barberoId, setBarberoId] = useState<number | null>(barberosLocales[0]?.id ?? 1)
  const [fecha, setFecha] = useState(hoy())
  const [hora, setHora] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')

  // Horas libres
  const [horasCargadas, setHorasCargadas] = useState({ clave: '', horas: [] as string[] })
  const [recarga, setRecarga] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [confirmada, setConfirmada] = useState<Confirmada | null>(null)

  // 1. Escuchar eventos de selección externa desde TarjetaServicio y TarjetaBarbero
  useEffect(() => {
    const onSeleccionarServicio = (e: Event) => {
      const id = (e as CustomEvent<number>).detail
      if (id) {
        setServicioId(id)
        setHora('')
      }
    }
    const onSeleccionarBarbero = (e: Event) => {
      const id = (e as CustomEvent<number>).detail
      if (id) {
        setBarberoId(id)
        setHora('')
      }
    }

    window.addEventListener('seleccionar-servicio', onSeleccionarServicio)
    window.addEventListener('seleccionar-barbero', onSeleccionarBarbero)
    return () => {
      window.removeEventListener('seleccionar-servicio', onSeleccionarServicio)
      window.removeEventListener('seleccionar-barbero', onSeleccionarBarbero)
    }
  }, [])

  // 2. Traer servicios y barberos desde Supabase si está disponible
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('servicios')
      .select('id, nombre, precio, duracionMin:duracion_min')
      .order('id')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setServicios(data)
          setServicioId((prev) => prev ?? data[0].id)
        }
      })
    supabase
      .from('barberos')
      .select('id, nombre')
      .order('id')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBarberos(data)
          setBarberoId((prev) => prev ?? data[0].id)
        }
      })
  }, [])

  // 3. Obtener horas libres
  const clave = servicioId && barberoId && fecha ? `${servicioId}-${barberoId}-${fecha}` : ''
  const cargandoHoras = supabase !== null && clave !== '' && horasCargadas.clave !== clave
  const horas =
    supabase !== null
      ? horasCargadas.clave === clave
        ? horasCargadas.horas
        : []
      : horasFallback

  useEffect(() => {
    if (!supabase || !clave) return
    let vigente = true
    supabase
      .rpc('horas_disponibles', { p_barbero: barberoId, p_servicio: servicioId, p_fecha: fecha })
      .then(({ data, error }) => {
        if (!vigente) return
        if (error) setError('No pudimos cargar las horas disponibles. Intenta de nuevo.')
        const lista = error ? [] : (data as { hora: string }[]).map((h) => h.hora.slice(0, 5))
        setHorasCargadas({ clave, horas: lista })
      })
    return () => {
      vigente = false
    }
  }, [clave, servicioId, barberoId, fecha, recarga])

  // Datos del servicio y barbero seleccionados para el resumen
  const servicioActual = servicios.find((s) => s.id === servicioId)
  const barberoActual = barberos.find((b) => b.id === barberoId)

  // 4. Enviar la reserva
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!servicioId || !barberoId || !hora) {
      setError('Por favor selecciona servicio, barbero, fecha y hora.')
      return
    }

    setEnviando(true)
    setError('')

    if (supabase) {
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
          setError('Esa hora se acaba de ocupar. Por favor elige otra.')
          setHora('')
          setHorasCargadas({ clave: '', horas: [] })
          setRecarga((n) => n + 1)
        } else {
          setError('No pudimos guardar la reserva. Revisa tus datos e intenta de nuevo.')
        }
        return
      }
    } else {
      // Si no hay Supabase configurado, completamos vía WhatsApp directo
      const textoWA = encodeURIComponent(
        `Hola ${negocio.nombre}, quiero confirmar una hora:\n\n` +
          `💈 Servicio: ${servicioActual?.nombre} ($${servicioActual?.precio.toLocaleString('es-CL')})\n` +
          `👤 Barbero: ${barberoActual?.nombre}\n` +
          `📅 Fecha: ${formatearFecha(fecha)}\n` +
          `⏰ Hora: ${hora}\n` +
          `🙋‍♂️ Cliente: ${nombre}\n` +
          `📱 Contacto: ${telefono}\n\n` +
          `¿Me confirman la disponibilidad? Muchas gracias.`
      )
      window.open(`https://wa.me/${negocio.telefono}?text=${textoWA}`, '_blank')
      setEnviando(false)
    }

    setConfirmada({
      servicio: servicioActual?.nombre ?? '',
      barbero: barberoActual?.nombre ?? '',
      fecha: formatearFecha(fecha),
      hora,
      nombre,
      telefono,
    })
  }

  function nuevaReserva() {
    setConfirmada(null)
    setFecha(hoy())
    setHora('')
    setNombre('')
    setTelefono('')
    setError('')
  }

  return (
    <section id="reserva" className="scroll-mt-24 bg-azul px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-azul-claro">
            Sistema de reservas
          </p>
          <h2 className="mt-2 font-titulo text-4xl uppercase md:text-5xl">
            Agenda tu cita en segundos
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
            Elige el servicio, tu barbero favorito y el horario que mejor te acomode. Confirmamos de inmediato.
          </p>
        </div>

        {/* Pantalla de Reserva Confirmada (Comprobante / Ticket) */}
        {confirmada ? (
          <div
            role="status"
            className="mx-auto mt-12 max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#f7f4ee] p-8 text-azul shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/10 text-emerald-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Reserva recibida</p>
                <h3 className="font-titulo text-2xl uppercase md:text-3xl">¡Hora solicitada con éxito!</h3>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-azul/10 bg-hueso p-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Servicio</dt>
                  <dd className="font-bold text-azul">{confirmada.servicio}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Barbero</dt>
                  <dd className="font-bold text-azul">{confirmada.barbero}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Fecha</dt>
                  <dd className="font-bold text-azul">{confirmada.fecha}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Hora</dt>
                  <dd className="font-bold text-azul">{confirmada.hora} hrs</dd>
                </div>
              </dl>
            </div>

            <p className="mt-5 text-sm text-azul/75">
              Te contactaremos vía WhatsApp al número registrado para recordar tu cita. Si necesitas reprogramar, avísanos con al menos 2 horas de anticipación.
            </p>

            <button
              type="button"
              onClick={nuevaReserva}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-azul py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-azul/90 active:scale-95"
            >
              Hacer otra reserva
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              {/* PASO 1: Selección de Servicio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-[11px] text-white">1</span>
                  <span>Selecciona el servicio</span>
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {servicios.map((s) => {
                    const seleccionado = s.id === servicioId
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setServicioId(s.id)
                          setHora('')
                        }}
                        className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                          seleccionado
                            ? 'border-rojo bg-[#f7f4ee] text-azul shadow-md ring-1 ring-rojo'
                            : 'border-white/10 bg-white/5 text-stone-200 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-titulo text-lg uppercase">{s.nombre}</span>
                          <span
                            className={`font-titulo text-lg font-bold ${
                              seleccionado ? 'text-rojo' : 'text-azul-claro'
                            }`}
                          >
                            ${s.precio.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <span
                          className={`mt-2 text-xs font-medium ${
                            seleccionado ? 'text-azul/70' : 'text-stone-400'
                          }`}
                        >
                          ⏱ {s.duracionMin} minutos
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PASO 2: Selección de Barbero */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-[11px] text-white">2</span>
                  <span>Elige a tu barbero</span>
                </label>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {barberos.map((b) => {
                    const seleccionado = b.id === barberoId
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBarberoId(b.id)
                          setHora('')
                        }}
                        className={`flex flex-col items-center rounded-xl border p-3.5 text-center transition-all ${
                          seleccionado
                            ? 'border-rojo bg-[#f7f4ee] text-azul shadow-md ring-1 ring-rojo'
                            : 'border-white/10 bg-white/5 text-stone-200 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold uppercase ${
                            seleccionado ? 'bg-rojo text-white' : 'bg-white/10 text-stone-300'
                          }`}
                        >
                          {b.nombre.slice(0, 2)}
                        </div>
                        <span className="mt-2 font-titulo text-sm uppercase tracking-wide">
                          {b.nombre}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PASO 3: Fecha y Horas Disponibles */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-[11px] text-white">3</span>
                  <span>Fecha y horario</span>
                </label>

                <div className="mt-3">
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
                    className="w-full rounded-xl border border-white/15 bg-[#f7f4ee] px-4 py-3 text-azul font-semibold shadow-sm focus:border-rojo focus:ring-1 focus:ring-rojo/30"
                  />
                </div>

                {fecha && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Horarios disponibles para {formatearFecha(fecha)}:
                    </p>

                    {cargandoHoras ? (
                      <p className="mt-3 text-sm text-stone-400 animate-pulse">
                        Buscando horas libres…
                      </p>
                    ) : horas.length === 0 ? (
                      <p className="mt-3 text-sm text-stone-300">
                        No hay horas libres para esta fecha o barbero. Elige otro día.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                        {horas.map((h) => {
                          const seleccionada = hora === h
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setHora(h)}
                              className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                                seleccionada
                                  ? 'border-rojo bg-rojo text-[#f7f4ee] shadow-md shadow-black/30 scale-105'
                                  : 'border-white/15 bg-white/5 text-stone-300 hover:border-white/30 hover:bg-white/10'
                              }`}
                            >
                              {h}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PASO 4: Datos del cliente */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-[11px] text-white">4</span>
                  <span>Tus datos de contacto</span>
                </label>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nombre" className="mb-1 block text-xs font-semibold text-stone-300">
                      Nombre completo
                    </label>
                    <input
                      id="nombre"
                      required
                      placeholder="Ej: Cristian Gómez"
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#f7f4ee] px-4 py-3 text-sm text-azul shadow-sm focus:border-rojo focus:ring-1 focus:ring-rojo/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="mb-1 block text-xs font-semibold text-stone-300">
                      Teléfono (WhatsApp)
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      required
                      placeholder="+56 9 1234 5678"
                      pattern="\+?[0-9 ]{8,16}"
                      autoComplete="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#f7f4ee] px-4 py-3 text-sm text-azul shadow-sm focus:border-rojo focus:ring-1 focus:ring-rojo/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Resumen Dinámica de la Reserva */}
            <div>
              <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
                <h3 className="font-titulo text-2xl uppercase tracking-wider text-[#f5f2ec]">
                  Resumen de tu cita
                </h3>
                <p className="mt-1 text-xs text-stone-400">
                  Verifica los detalles antes de confirmar
                </p>

                <div className="mt-6 space-y-4 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Servicio:</span>
                    <span className="font-semibold text-stone-200">
                      {servicioActual?.nombre ?? 'No seleccionado'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Barbero:</span>
                    <span className="font-semibold text-stone-200">
                      {barberoActual?.nombre ?? 'No seleccionado'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Fecha:</span>
                    <span className="font-semibold text-stone-200">
                      {formatearFecha(fecha) || 'Por definir'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Hora:</span>
                    <span className="font-semibold text-stone-200">
                      {hora ? `${hora} hrs` : 'Por seleccionar'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Duración:</span>
                    <span className="font-semibold text-stone-200">
                      {servicioActual ? `${servicioActual.duracionMin} minutos` : '—'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
                    <span className="font-titulo text-lg uppercase text-stone-200">Total a pagar:</span>
                    <span className="font-titulo text-3xl font-bold text-azul-claro">
                      ${servicioActual?.precio.toLocaleString('es-CL') ?? '0'}
                    </span>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-xl bg-rojo/30 p-3 text-xs font-semibold text-stone-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!hora || enviando}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rojo py-4 text-center text-sm font-bold uppercase tracking-wider text-[#f5f2ec] shadow-lg shadow-black/40 transition-all hover:bg-rojo/85 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando ? (
                    <span>Procesando…</span>
                  ) : hora ? (
                    <span>Confirmar reserva · {hora} hrs</span>
                  ) : (
                    <span>Selecciona una hora</span>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] text-stone-400">
                  Sin pagos por adelantado · Pagas en el local al terminar
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

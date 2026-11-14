// ============================================================
// VISTA · Formulario de reserva
// Solo dibuja. Todo el estado y la lógica vienen del controlador useReserva().
// ============================================================
import { Link } from 'react-router'
import { useReserva } from '../../controladores/useReserva'
import { negocio } from '../../modelos/datos/negocio'
import { whatsappDelLocal } from '../../modelos/enlaces'
import { fechaCorta, pesos } from '../../modelos/formato'
import { formatearTelefono } from '../../modelos/telefono'

export default function Reserva() {
  const r = useReserva()

  return (
    <section id="reserva" className="scroll-mt-24 bg-azul px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-azul-claro">
            Sistema de reservas
          </p>
          <h2 className="mt-2 font-titulo text-4xl uppercase md:text-5xl">
            Reserva tu hora en segundos
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
            Elige el servicio, tu barbero favorito y el horario que mejor te acomode. Tu hora queda apartada al instante y te confirmamos por WhatsApp.
          </p>
        </div>

        {/* Sin Supabase configurado, o si no responde (p. ej. proyecto pausado): contacto por WhatsApp */}
        {!r.enLinea ? (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl shadow-xl">
            <h3 className="font-titulo text-2xl uppercase tracking-wider text-[#f5f2ec] md:text-3xl">
              Reserva tu hora por WhatsApp
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-300">
              {r.sinConexion
                ? 'En este momento no podemos mostrar las horas en línea. Escríbenos y te agendamos al tiro.'
                : 'Contáctanos directamente por WhatsApp para consultar disponibilidad y coordinar tu hora.'}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <a
                href={whatsappDelLocal()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-rojo px-8 py-4 font-semibold text-[#f5f2ec] shadow-lg shadow-black/40 transition-all hover:bg-rojo/85 hover:shadow-xl hover:shadow-black/60 active:scale-95"
              >
                <span>Contactar por WhatsApp</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <span className="text-xs text-stone-400">{formatearTelefono(negocio.telefono)}</span>
            </div>
          </div>
        ) : r.confirmada ? (
          /* Pantalla de Reserva Confirmada (Comprobante / Ticket) */
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
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Reserva recibida · Pendiente de confirmación
                </p>
                <h3 className="font-titulo text-2xl uppercase md:text-3xl">¡Hora solicitada con éxito!</h3>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-azul/10 bg-hueso p-5">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Servicio</dt>
                  <dd className="font-bold text-azul">{r.confirmada.servicio}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Barbero</dt>
                  <dd className="font-bold text-azul">{r.confirmada.barbero}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Fecha</dt>
                  <dd className="font-bold text-azul">{r.confirmada.fecha}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-azul/60">Hora</dt>
                  <dd className="font-bold text-azul">{r.confirmada.hora} hrs</dd>
                </div>
              </dl>
            </div>

            <p className="mt-5 text-sm text-azul/75">
              Te escribiremos por WhatsApp para confirmar tu hora. Si necesitas cambiarla, avísanos con al menos 2 horas de anticipación.
            </p>

            <button
              type="button"
              onClick={r.nuevaReserva}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-azul py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-azul/90 active:scale-95"
            >
              Hacer otra reserva
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault() // evita que el navegador recargue la página (comportamiento normal de un <form>)
              r.enviar()
            }} className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              {/* PASO 1: Selección de Servicio */}
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-xs text-white">1</span>
                  <span>Selecciona el servicio</span>
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {r.servicios.length === 0 ? (
                    <p className="col-span-2 text-sm text-stone-400 animate-pulse">
                      Cargando servicios…
                    </p>
                  ) : (
                    r.servicios.map((s) => {
                      const seleccionado = s.id === r.servicioId
                      return (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={seleccionado}
                          onClick={() => r.elegirServicio(s.id)}
                          className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all sm:p-4 ${
                            seleccionado
                              ? 'border-rojo bg-[#f7f4ee] text-azul shadow-md ring-1 ring-rojo'
                              : 'border-white/10 bg-white/5 text-stone-200 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                            <span className="font-titulo text-base uppercase leading-tight sm:text-lg">{s.nombre}</span>
                            <span
                              className={`font-titulo text-lg font-bold ${
                                seleccionado ? 'text-rojo' : 'text-azul-claro'
                              }`}
                            >
                              {pesos(s.precio)}
                            </span>
                          </div>
                          <span
                            className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                              seleccionado ? 'text-azul/75' : 'text-stone-300'
                            }`}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {s.duracionMin} min
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </fieldset>

              {/* PASO 2: Selección de Barbero */}
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-xs text-white">2</span>
                  <span>Elige a tu barbero</span>
                </legend>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {r.barberos.length === 0 ? (
                    <p className="col-span-3 text-sm text-stone-400 animate-pulse">
                      Cargando barberos…
                    </p>
                  ) : (
                    r.barberos.map((b) => {
                      const seleccionado = b.id === r.barberoId
                      return (
                        <button
                          key={b.id}
                          type="button"
                          aria-pressed={seleccionado}
                          onClick={() => r.elegirBarbero(b.id)}
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
                    })
                  )}
                </div>
              </fieldset>

              {/* PASO 3: Fecha y Horas Disponibles */}
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-xs text-white">3</span>
                  <span>Fecha y horario</span>
                </legend>

                <div className="mt-3">
                  <input
                    id="fecha"
                    aria-label="Fecha de la reserva"
                    type="date"
                    required
                    min={r.fechaMinima}
                    max={r.fechaMaxima}
                    value={r.fecha}
                    onChange={(e) => r.elegirFecha(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#f7f4ee] px-4 py-3 text-azul font-semibold shadow-sm focus:border-rojo focus:ring-1 focus:ring-rojo/30"
                  />
                </div>

                {r.fecha && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Horarios disponibles para {fechaCorta(r.fecha)}:
                    </p>

                    {r.errorHoras ? (
                      <p role="alert" className="mt-3 text-sm text-stone-200">
                        {r.errorHoras}{' '}
                        <button
                          type="button"
                          onClick={r.reintentarHoras}
                          className="font-semibold underline"
                        >
                          Reintentar
                        </button>
                      </p>
                    ) : !r.hayEleccion ? (
                      <p className="mt-3 text-sm text-stone-400">Elige servicio y barbero para ver las horas libres.</p>
                    ) : r.cargandoHoras ? (
                      <p className="mt-3 text-sm text-stone-400 animate-pulse">
                        Buscando horas libres…
                      </p>
                    ) : r.horas.length === 0 ? (
                      <p className="mt-3 text-sm text-stone-300">
                        No hay horas libres para esta fecha o barbero. Elige otro día.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                        {r.horas.map((h) => {
                          const seleccionada = r.hora === h
                          return (
                            <button
                              key={h}
                              type="button"
                              aria-pressed={seleccionada}
                              onClick={() => r.elegirHora(h)}
                              className={`h-11 rounded-xl border text-center text-sm font-bold transition-all ${
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
              </fieldset>

              {/* PASO 4: Datos del cliente */}
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-azul-claro">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rojo text-xs text-white">4</span>
                  <span>Tus datos de contacto</span>
                </legend>

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
                      value={r.nombre}
                      onChange={(e) => r.cambiarNombre(e.target.value)}
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
                      pattern="\+?[0-9 \(\)\-]{8,20}"
                      title="Ej: +56 9 1234 5678 (números, espacios, guiones o paréntesis)"
                      autoComplete="tel"
                      value={r.telefono}
                      onChange={(e) => r.cambiarTelefono(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#f7f4ee] px-4 py-3 text-sm text-azul shadow-sm focus:border-rojo focus:ring-1 focus:ring-rojo/30"
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Columna Derecha: Tarjeta Resumen Dinámica de la Reserva */}
            <div>
              <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
                <h3 className="font-titulo text-2xl uppercase tracking-wider text-[#f5f2ec]">
                  Resumen de tu hora
                </h3>
                <p className="mt-1 text-xs text-stone-400">
                  Verifica los detalles antes de confirmar
                </p>

                <div className="mt-6 space-y-4 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Servicio:</span>
                    <span className="font-semibold text-stone-200">
                      {r.servicioActual?.nombre ?? 'No seleccionado'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Barbero:</span>
                    <span className="font-semibold text-stone-200">
                      {r.barberoActual?.nombre ?? 'No seleccionado'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Fecha:</span>
                    <span className="font-semibold text-stone-200">
                      {fechaCorta(r.fecha) || 'Por definir'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Hora:</span>
                    <span className="font-semibold text-stone-200">
                      {r.hora ? `${r.hora} hrs` : 'Por seleccionar'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-400">Duración:</span>
                    <span className="font-semibold text-stone-200">
                      {r.servicioActual ? `${r.servicioActual.duracionMin} minutos` : '—'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
                    <span className="font-titulo text-lg uppercase text-stone-200">
                      Total <span className="font-sans text-xs normal-case text-stone-300">(pagas en el local)</span>
                    </span>
                    <span className="font-titulo text-3xl font-bold text-azul-claro">
                      {pesos(r.servicioActual?.precio ?? 0)}
                    </span>
                  </div>
                </div>

                {r.error && (
                  <p role="alert" className="mt-4 rounded-xl bg-rojo/30 p-3 text-xs font-semibold text-stone-200">
                    {r.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!r.hora || r.enviando}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rojo py-4 text-center text-sm font-bold uppercase tracking-wider text-[#f5f2ec] shadow-lg shadow-black/40 transition-all hover:bg-rojo/85 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {r.enviando ? (
                    <span>Procesando…</span>
                  ) : r.hora ? (
                    <span>Confirmar reserva · {r.hora} hrs</span>
                  ) : (
                    <span>Selecciona una hora</span>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-stone-300">
                  Sin pagos por adelantado · Pagas en el local al terminar
                </p>
                <p className="mt-2 text-center text-xs text-stone-300">
                  Usamos tu nombre y teléfono solo para gestionar tu hora.{' '}
                  <Link to="/privacidad" className="underline hover:text-stone-200">
                    Privacidad
                  </Link>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

import { useState, type FormEvent } from 'react'
import { negocio } from '../data/negocio'
import { servicios } from '../data/servicios'

interface FormReserva {
  nombre: string
  servicioId: number
  fecha: string
  hora: string
}

// Convierte '2026-11-07' en '07-11-2026' para el mensaje
function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}-${mes}-${anio}`
}

export default function Reserva() {
  const [form, setForm] = useState<FormReserva>({
    nombre: '',
    servicioId: servicios[0].id,
    fecha: '',
    hora: '',
  })

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const servicio = servicios.find((s) => s.id === form.servicioId)
    const mensaje = `Hola! Soy ${form.nombre}. Quiero reservar ${servicio?.nombre} el ${formatearFecha(form.fecha)} a las ${form.hora}.`
    window.open(`https://wa.me/${negocio.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const campo = 'w-full rounded-lg border border-white/20 bg-white px-4 py-3 text-azul'
  const etiqueta = 'mb-2 block text-sm font-semibold'

  return (
    <section id="reserva" className="scroll-mt-28 bg-azul px-6 py-24 text-white">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-azul-claro">Agenda tu hora</p>
          <h2 className="mt-3 font-titulo text-4xl uppercase md:text-5xl">Reserva por WhatsApp</h2>
          <p className="mt-6 leading-relaxed text-white/80">
            Completa el formulario y se abrirá WhatsApp con tu mensaje listo. Te confirmamos la
            hora por ahí mismo.
          </p>
        </div>

        <form onSubmit={enviar} className="grid gap-5">
          <div>
            <label htmlFor="nombre" className={etiqueta}>Nombre</label>
            <input
              id="nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={campo}
            />
          </div>

          <div>
            <label htmlFor="servicio" className={etiqueta}>Servicio</label>
            <select
              id="servicio"
              value={form.servicioId}
              onChange={(e) => setForm({ ...form, servicioId: Number(e.target.value) })}
              className={campo}
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — ${s.precio.toLocaleString('es-CL')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha" className={etiqueta}>Fecha</label>
              <input
                id="fecha"
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className={campo}
              />
            </div>
            <div>
              <label htmlFor="hora" className={etiqueta}>Hora</label>
              <input
                id="hora"
                type="time"
                required
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                className={campo}
              />
            </div>
          </div>

          <button className="mt-2 rounded-full bg-rojo py-3 font-semibold text-white hover:bg-rojo/90">
            Reservar por WhatsApp
          </button>
        </form>
      </div>
    </section>
  )
}

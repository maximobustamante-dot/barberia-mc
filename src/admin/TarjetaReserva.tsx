import { useState, type ReactNode } from 'react'
import { negocio } from '../data/negocio'
import { formatearTelefono } from '../lib/telefono'
import IconoWhatsApp from '../components/IconoWhatsApp'
import { ESTADOS, enlaceWhatsApp, horaDe, pesos, type Estado, type ReservaAdmin } from './util'

interface Props {
  reserva: ReservaAdmin
  ocupado: boolean
  onCambiar: (estado: Estado) => void
}

// Qué botones se muestran según el estado actual de la reserva
const ACCIONES: Record<Estado, { estado: Estado; texto: string; principal?: boolean }[]> = {
  pendiente: [{ estado: 'confirmada', texto: 'Confirmar', principal: true }],
  confirmada: [
    { estado: 'atendida', texto: 'Atendida', principal: true },
    { estado: 'no_asistio', texto: 'No asistió' },
  ],
  atendida: [{ estado: 'confirmada', texto: 'Deshacer' }],
  no_asistio: [{ estado: 'confirmada', texto: 'Deshacer' }],
  cancelada: [{ estado: 'pendiente', texto: 'Reactivar' }],
}

export default function TarjetaReserva({ reserva: r, ocupado, onCambiar }: Props) {
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const estado = ESTADOS[r.estado]
  const cancelada = r.estado === 'cancelada'
  const sePuedeCancelar = r.estado === 'pendiente' || r.estado === 'confirmada'

  return (
    <li
      className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
        cancelada ? 'border-azul/5 opacity-60' : 'border-azul/10'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <p className="font-titulo text-2xl leading-none tabular-nums">
            {horaDe(r.inicio)}
            <span className="mt-1 block font-sans text-xs text-azul/70">hasta {horaDe(r.fin)}</span>
          </p>
          <div>
            <p className={`font-semibold ${cancelada ? 'line-through' : ''}`}>{r.cliente_nombre}</p>
            <p className="text-sm text-azul/75">
              {r.servicio} · {r.barbero} · {pesos(r.precio)}
            </p>
            <p className="text-sm text-azul/70 tabular-nums">{formatearTelefono(r.cliente_telefono)}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>

      {/* Acciones: en celular, grilla de 2 columnas; en pantallas grandes, una fila */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-azul/10 pt-3 sm:flex sm:flex-wrap sm:justify-end">
        <a
          href={enlaceWhatsApp(r, negocio.nombre)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Escribir a ${r.cliente_nombre} por WhatsApp`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25d366]/15 px-4 text-sm font-semibold text-emerald-900 ring-1 ring-[#25d366]/40 hover:bg-[#25d366]/25 sm:mr-auto sm:h-9"
        >
          <IconoWhatsApp className="h-4 w-4" />
          WhatsApp
        </a>

        {confirmandoCancelar ? (
          <>
            <p className="col-span-2 self-center text-sm font-semibold text-rojo sm:col-auto">¿Cancelar esta hora?</p>
            <Boton
              disabled={ocupado}
              peligro
              onClick={() => {
                setConfirmandoCancelar(false)
                onCambiar('cancelada')
              }}
            >
              Sí, cancelar
            </Boton>
            <Boton disabled={ocupado} onClick={() => setConfirmandoCancelar(false)}>
              No
            </Boton>
          </>
        ) : (
          <>
            {ACCIONES[r.estado].map((a) => (
              <Boton key={a.estado} disabled={ocupado} principal={a.principal} onClick={() => onCambiar(a.estado)}>
                {a.texto}
              </Boton>
            ))}
            {sePuedeCancelar && (
              <Boton disabled={ocupado} onClick={() => setConfirmandoCancelar(true)}>
                Cancelar
              </Boton>
            )}
          </>
        )}
      </div>
    </li>
  )
}

interface BotonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  principal?: boolean
  peligro?: boolean
}

function Boton({ children, onClick, disabled, principal, peligro }: BotonProps) {
  const color = peligro
    ? 'bg-rojo text-white hover:bg-rojo/90'
    : principal
      ? 'bg-azul text-white hover:bg-azul/90'
      : 'border border-azul/15 bg-white text-azul hover:bg-hueso'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-lg px-3.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 sm:h-9 ${color}`}
    >
      {children}
    </button>
  )
}

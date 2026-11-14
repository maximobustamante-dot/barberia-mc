// ============================================================
// MODELO · Enlaces a WhatsApp e Instagram
// wa.me es el formato oficial de WhatsApp para abrir un chat: wa.me/<número>?text=<mensaje>
// ============================================================
import { negocio } from './datos/negocio'
import { diaDe, fechaLarga, horaDe } from './fechas'
import { normalizarTelefono } from './telefono'
import type { ReservaAdmin } from './tipos'

// Chat con el local, opcionalmente con un mensaje ya escrito
export function whatsappDelLocal(mensaje?: string) {
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  return `https://wa.me/${negocio.telefono}${texto}`
}

export const instagramDelLocal = () => `https://instagram.com/${negocio.instagram}`

// Chat con el cliente de una reserva, con el mensaje de confirmación listo (panel del dueño)
export function whatsappDelCliente(r: ReservaAdmin) {
  const mensaje =
    `Hola ${r.cliente_nombre}, te escribimos de ${negocio.nombre} para confirmar tu hora de ` +
    `${r.servicio} el ${fechaLarga(diaDe(r.inicio))} a las ${horaDe(r.inicio)}. ` +
    `¿Nos confirmas tu asistencia?`
  return `https://wa.me/${normalizarTelefono(r.cliente_telefono)}?text=${encodeURIComponent(mensaje)}`
}

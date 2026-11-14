// ============================================================
// CONTROLADOR · "Reservar este" desde las tarjetas de Servicios y Equipo
// Las tarjetas están lejos del formulario, así que avisan con un evento del navegador
// (CustomEvent y dispatchEvent vienen del navegador; 'pedir-reserva' es nombre nuestro).
// useReserva escucha el aviso y elige el servicio o barbero.
// ============================================================
const EVENTO = 'pedir-reserva'

interface PedidoReserva {
  servicioId?: number
  barberoId?: number
}

export function pedirReserva(pedido: PedidoReserva) {
  window.dispatchEvent(new CustomEvent<PedidoReserva>(EVENTO, { detail: pedido }))
  document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })
}

// Devuelve la función para dejar de escuchar
export function escucharPedidos(aviso: (pedido: PedidoReserva) => void) {
  const alRecibir = (e: Event) => aviso((e as CustomEvent<PedidoReserva>).detail)
  window.addEventListener(EVENTO, alRecibir)
  return () => window.removeEventListener(EVENTO, alRecibir)
}

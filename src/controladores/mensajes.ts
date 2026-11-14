// ============================================================
// CONTROLADOR · Qué texto ve la persona para cada código del modelo
// El modelo dice QUÉ pasó (un código); aquí se decide CÓMO se le cuenta al usuario.
// Record<Codigo, string> obliga a tener un texto para cada código: si el modelo agrega
// uno nuevo y aquí falta, TypeScript avisa.
// ============================================================
import type { ErrorPanel } from '../modelos/panel'
import type { ErrorReserva } from '../modelos/reservas'
import type { ResultadoLogin } from '../modelos/sesion'
import { DIAS_MAXIMO } from '../modelos/reservas'

export const MENSAJES_RESERVA: Record<ErrorReserva, string> = {
  HORA_NO_DISPONIBLE: 'Esa hora ya fue tomada. Por favor elige otra.',
  FECHA_FUERA_DE_RANGO: `Solo se puede reservar hasta ${DIAS_MAXIMO} días hacia adelante.`,
  DEMASIADAS_RESERVAS: 'Estamos recibiendo muchas reservas. Intenta en unos minutos o escríbenos por WhatsApp.',
  LIMITE_RESERVAS: 'Ya tienes 2 horas reservadas con este teléfono. Escríbenos por WhatsApp si necesitas otra.',
  OTRO: 'No pudimos guardar la reserva. Revisa tus datos e intenta de nuevo.',
}

// Avisos del formulario que se revisan antes de llamar a la base
export const MENSAJES_FORMULARIO = {
  faltaElegir: 'Por favor selecciona servicio, barbero, fecha y hora.',
  nombreCorto: 'Escribe tu nombre (al menos 2 letras).',
  telefonoInvalido: 'Revisa tu teléfono, por ejemplo +56 9 1234 5678.',
  sinHoras: 'No pudimos cargar las horas disponibles. Intenta de nuevo.',
}

export const MENSAJES_PANEL: Record<ErrorPanel, string> = {
  NO_AUTORIZADO: 'Tu sesión no tiene permiso. Vuelve a iniciar sesión.',
  HORA_NO_DISPONIBLE: 'Esa hora ya la tomó otro cliente, no se puede reactivar.',
  RESERVA_NO_EXISTE: 'La reserva ya no existe. Actualiza la lista.',
  RANGO_INVALIDO: 'El rango de fechas es demasiado largo.',
  OTRO: 'No se pudo completar la acción. Revisa tu conexión e intenta de nuevo.',
}

export const MENSAJES_LOGIN: Record<Exclude<ResultadoLogin, 'ok'>, string> = {
  credenciales: 'Correo o contraseña incorrectos.', // mismo texto para correo o contraseña: no se revela cuál falló
  'demasiados-intentos': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
}

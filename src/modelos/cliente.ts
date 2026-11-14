// ============================================================
// MODELO · Datos del cliente que reserva
// Misma regla que nombre_valido() en SQL (migración 003). La base la vuelve a revisar:
// esto es solo para mostrar un mensaje claro antes de enviar.
// ============================================================

// Letras latinas (tildes, ñ, ü, ł…), espacios, apóstrofo, guion y punto; entre 2 y 60.
// El punto solo si va seguido de un espacio o al final ("Juan P." sí, "bit.ly" no).
// Sin números, barras ni saltos de línea: así nadie puede meter un link o un mensaje falso
// en el nombre (el dueño lo copia en el WhatsApp que le manda al cliente).
const NOMBRE = /^[A-Za-zÀ-ÖØ-öø-ÿĀ-ſ][A-Za-zÀ-ÖØ-öø-ÿĀ-ſ' .-]{1,59}$/
const PUNTO_PEGADO = /\.[^ ]/

// normalize('NFC') es de JavaScript: junta "e" + tilde escrita aparte en una sola letra "é".
// Se quitan solo espacios de los extremos (igual que trim() en SQL; el trim() de JS también
// quitaría saltos de línea y el navegador aceptaría algo que la base rechaza).
const limpiar = (nombre: string) => nombre.normalize('NFC').replace(/^ +| +$/g, '')

export function nombreValido(nombre: string) {
  const n = limpiar(nombre)
  return NOMBRE.test(n) && !PUNTO_PEGADO.test(n)
}

// ============================================================
// MODELO · Teléfonos chilenos (las mismas reglas que la base de datos).
// Se usan en la página pública y en el panel.
// ============================================================

// Solo dígitos y con el 56 de Chile (igual que normalizar_telefono en SQL)
export function normalizarTelefono(telefono: string) {
  const numero = telefono.replace(/\D/g, '')
  return numero.length === 9 && numero.startsWith('9') ? `56${numero}` : numero
}

// '56912345678' → '+56 9 1234 5678' (si no calza, se muestra tal cual)
export function formatearTelefono(telefono: string) {
  const n = normalizarTelefono(telefono)
  return n.length === 11 && n.startsWith('569')
    ? `+56 9 ${n.slice(3, 7)} ${n.slice(7)}`
    : telefono
}

// Lo que se guarda en la base: se aceptan guiones y paréntesis al escribir, pero la tabla
// reservas solo permite números y espacios ('+56 (9) 1234-5678' → '+56 9 1234 5678')
export const limpiarTelefono = (t: string) => t.replace(/[()-]/g, ' ').replace(/\s+/g, ' ').trim()

// ¿La base lo va a aceptar? Misma regla que el check de la tabla reservas (schema.sql)
export const telefonoValido = (t: string) => /^\+?[0-9 ]{8,16}$/.test(limpiarTelefono(t))

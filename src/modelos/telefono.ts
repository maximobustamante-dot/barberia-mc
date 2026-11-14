// ============================================================
// MODELO · Teléfonos chilenos (las mismas reglas que la base de datos).
// Se usan en la página pública y en el panel.
// ============================================================

// Prefijos con que se puede escribir un celular chileno antes de los 9 dígitos
const PREFIJOS_CHILE = ['', '0', '56', '560', '0056', '00560']

// Solo dígitos y con el 56 de Chile, igual que normalizar_telefono en SQL (migración 003):
// +56 9 1234 5678 · 912345678 · 0056 9 1234 5678 · 56 09 1234 5678 → '56912345678'
export function normalizarTelefono(telefono: string) {
  const numero = telefono.replace(/\D/g, '')
  const celular = numero.slice(-9)
  return numero.length >= 9 && celular.startsWith('9') && PREFIJOS_CHILE.includes(numero.slice(0, -9))
    ? `56${celular}`
    : numero
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

// ¿La base lo va a aceptar? El formato de la tabla reservas (schema.sql) y, desde la
// migración 003, que sea un celular chileno: 56 9 + 8 dígitos (TELEFONO_INVALIDO si no)
export function telefonoValido(t: string) {
  const limpio = limpiarTelefono(t)
  return /^\+?[0-9 ]{8,16}$/.test(limpio) && /^569\d{8}$/.test(normalizarTelefono(limpio))
}

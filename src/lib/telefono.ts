// Teléfonos chilenos: se usan en la página pública y en el panel

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

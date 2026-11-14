// ============================================================
// MODELO · Cómo se escriben los datos para mostrarlos
// ============================================================

// 12000 → '$12.000' (toLocaleString viene de JavaScript; 'es-CL' usa punto de miles)
export const pesos = (n: number) => `$${n.toLocaleString('es-CL')}`

// '2026-11-16' → '16-11-2026'
export function fechaCorta(fecha: string) {
  if (!fecha) return ''
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}-${mes}-${anio}`
}

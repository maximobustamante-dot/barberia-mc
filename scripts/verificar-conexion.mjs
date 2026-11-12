// =====================================================================
// npm run verificar
//
// Revisa, desde tu computador y con la MISMA clave que usa la página,
// que la app esté bien conectada a Supabase y que la seguridad funcione:
//   - .env.local tiene la URL y la clave publicable (no la secreta)
//   - el registro de usuarios nuevos está cerrado
//   - servicios y barberos de la base coinciden con src/data/
//   - el público puede ver horas libres pero NO puede leer reservas ni usar el panel
//   - (opcional) tu usuario de dueño entra y ve el panel
//
// No crea, cambia ni borra nada en la base.
// =====================================================================
import { readFileSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { createClient } from '@supabase/supabase-js'

const resultados = []
function anotar(ok, prueba, detalle = '') {
  resultados.push(ok)
  const icono = ok === null ? '⚠️ ' : ok ? '✅' : '❌'
  console.log(`${icono} ${prueba}${detalle ? `  ·  ${detalle}` : ''}`)
}

// ---------------------------------------------------------------------
// 1. Leer .env.local (lo mismo que hace Vite con las variables VITE_)
// ---------------------------------------------------------------------
console.log('\n· Configuración')
if (!existsSync('.env.local')) {
  anotar(false, 'Existe .env.local', 'cópialo desde .env.example y pon tus datos de Supabase')
  process.exit(1)
}
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
)
const url = env.VITE_SUPABASE_URL ?? ''
const clave = env.VITE_SUPABASE_KEY ?? ''

anotar(/^https?:\/\/[^/]+\/?$/.test(url), 'VITE_SUPABASE_URL tiene formato correcto', url.includes('/rest/v1') ? 'quítale /rest/v1/ del final' : url)
const secreta = clave.startsWith('sb_secret_') || (() => {
  try {
    return JSON.parse(Buffer.from(clave.split('.')[1] ?? '', 'base64url').toString()).role === 'service_role'
  } catch {
    return false
  }
})()
anotar(!!clave && !secreta, 'VITE_SUPABASE_KEY es la clave publicable', secreta ? '¡es la SECRETA! cámbiala y regenera la secreta en Supabase' : clave ? `${clave.slice(0, 16)}…` : 'falta')
if (!url || !clave || secreta) process.exit(1)

const supabase = createClient(url, clave, { auth: { persistSession: false } })

// ---------------------------------------------------------------------
// 2. Configuración de Supabase Auth (endpoint público /auth/v1/settings)
// ---------------------------------------------------------------------
console.log('\n· Login (Supabase Auth)')
try {
  const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: clave } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const ajustes = await r.json()
  anotar(ajustes.disable_signup === true, 'Registro de usuarios nuevos cerrado',
    ajustes.disable_signup ? '' : 'Authentication → Sign In / Providers → desactiva "Allow new users to sign up"')
  if (ajustes.external && 'anonymous_users' in ajustes.external) {
    anotar(ajustes.external.anonymous_users === false, 'Inicio de sesión anónimo apagado',
      ajustes.external.anonymous_users ? 'desactiva "Allow anonymous sign-ins"' : '')
  }
} catch (e) {
  anotar(false, 'Conexión con Supabase Auth', `no responde (${e.message}). ¿URL correcta? ¿Proyecto pausado?`)
  process.exit(1)
}

// ---------------------------------------------------------------------
// 3. Lo que ve el público (cualquier visitante de la página)
// ---------------------------------------------------------------------
console.log('\n· Base de datos vista por el público')

// Datos que muestra la página (src/data). Node 22.18+ entiende TypeScript simple;
// si tu versión no puede, esta comparación se salta.
async function datosDeLaPagina(archivo, nombre) {
  try {
    return (await import(new URL(`../src/data/${archivo}`, import.meta.url)))[nombre]
  } catch {
    return null
  }
}

const { data: servicios, error: e1 } = await supabase.from('servicios').select('id, nombre, precio, duracion_min').order('id')
anotar(!e1 && servicios.length > 0, 'Lee los servicios', e1 ? e1.message : `${servicios.length} servicios`)
const { data: barberos, error: e2 } = await supabase.from('barberos').select('id, nombre').order('id')
anotar(!e2 && barberos.length > 0, 'Lee los barberos', e2 ? e2.message : barberos.map((b) => b.nombre).join(', '))

const pagServicios = await datosDeLaPagina('servicios.ts', 'servicios')
const pagBarberos = await datosDeLaPagina('barberos.ts', 'barberos')
if (pagServicios && servicios) {
  const distintos = pagServicios.filter((p) => {
    const b = servicios.find((s) => s.id === p.id)
    return !b || b.nombre !== p.nombre || b.precio !== p.precio || b.duracion_min !== p.duracionMin
  })
  anotar(distintos.length === 0, 'Servicios de la base = src/data/servicios.ts',
    distintos.length ? `distintos: ${distintos.map((d) => `${d.id} ${d.nombre}`).join(', ')}` : '')
} else {
  anotar(null, 'Servicios de la base = src/data/servicios.ts', 'no se pudo comparar (actualiza Node a 22.18 o más)')
}
if (pagBarberos && barberos) {
  const distintos = pagBarberos.filter((p) => barberos.find((b) => b.id === p.id)?.nombre !== p.nombre)
  anotar(distintos.length === 0, 'Barberos de la base = src/data/barberos.ts',
    distintos.length ? `distintos: ${distintos.map((d) => `${d.id} ${d.nombre}`).join(', ')}` : '')
}

// Próximo día hábil (en Chile) para consultar horas
const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
const dia = new Date(`${hoy}T12:00:00Z`)
do dia.setUTCDate(dia.getUTCDate() + 1)
while (dia.getUTCDay() === 0 || dia.getUTCDay() === 6)
const fecha = dia.toISOString().slice(0, 10)

const { data: horas, error: e3 } = await supabase.rpc('horas_disponibles', { p_barbero: 1, p_servicio: 1, p_fecha: fecha })
anotar(!e3 && horas.length > 0, 'Consulta horas disponibles', e3 ? e3.message : `${fecha}: ${horas.length} horas libres`)

// Cosas que el público NO debe poder hacer (que fallen es lo correcto)
const prohibidas = [
  ['NO puede leer reservas (nombres y teléfonos)', () => supabase.from('reservas').select('*').limit(1)],
  ['NO puede leer horarios internos', () => supabase.from('horarios').select('*').limit(1)],
  ['NO puede leer administradores', () => supabase.from('administradores').select('*').limit(1)],
  ['NO puede cambiar precios', () => supabase.from('servicios').update({ precio: 1 }).eq('id', -1).select()],
  ['NO puede usar el panel (admin_reservas)', () => supabase.rpc('admin_reservas', { p_desde: hoy, p_hasta: hoy })],
  ['NO puede cambiar estados (admin_cambiar_estado)', () =>
    supabase.rpc('admin_cambiar_estado', { p_reserva: '00000000-0000-4000-8000-000000000000', p_estado: 'cancelada' })],
]
for (const [prueba, intentar] of prohibidas) {
  const { error } = await intentar()
  anotar(!!error, prueba, error ? `rechazado: ${error.message}` : '¡LO PERMITIÓ! revisa los permisos (corre supabase/verificar.sql)')
}

// ---------------------------------------------------------------------
// 4. (Opcional) Login del dueño
// ---------------------------------------------------------------------
console.log('\n· Login del dueño (opcional)')
const leer = (pregunta, oculto = false) =>
  new Promise((listo) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (oculto) rl._writeToOutput = (s) => rl.output.write(s.includes(pregunta) ? s : '') // no muestra la contraseña
    rl.question(pregunta, (r) => {
      rl.close()
      if (oculto) process.stdout.write('\n')
      listo(r.trim())
    })
  })

const correo = process.stdin.isTTY ? await leer('Correo del dueño (Enter para saltar): ') : ''
if (!correo) {
  console.log('   (saltado)')
} else {
  const contrasena = await leer('Contraseña (no se muestra): ', true)
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
  anotar(!error, 'Inicia sesión', error ? error.message : correo)
  if (!error) {
    const { data: admin, error: e4 } = await supabase.rpc('es_admin')
    anotar(admin === true, 'Es administrador', e4 ? e4.message : admin ? '' : 'falta el insert into administradores')
    const { data: filas, error: e5 } = await supabase.rpc('admin_reservas', { p_desde: hoy, p_hasta: fecha })
    anotar(!e5, 'Ve las reservas del panel', e5 ? e5.message : `${filas.length} reservas entre hoy y ${fecha}`)
    const { error: e6 } = await supabase.from('reservas').select('*').limit(1)
    anotar(!!e6, 'Aun con sesión, NO lee la tabla reservas directo', e6 ? 'rechazado (todo pasa por las funciones)' : '¡LO PERMITIÓ!')
    await supabase.auth.signOut()
  }
}

// ---------------------------------------------------------------------
const fallas = resultados.filter((r) => r === false).length
console.log(fallas ? `\n❌ ${fallas} prueba(s) fallaron. Revisa los mensajes de arriba.\n` : '\n✅ Todo en orden: la página está conectada y protegida.\n')
process.exit(fallas ? 1 : 0)

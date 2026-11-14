// ============================================================
// VISTA · Formulario de login del dueño. La lógica está en useLogin().
// ============================================================
import { Link } from 'react-router'
import { useLogin } from '../../controladores/useLogin'
import { negocio } from '../../modelos/datos/negocio'

export default function Login() {
  const l = useLogin()

  return (
    <main className="grid min-h-screen place-items-center bg-azul px-6 py-12 text-azul">
      <div className="w-full max-w-sm">
        <p className="text-center font-titulo text-2xl uppercase tracking-wider text-white">
          {negocio.nombre}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault() // un <form> recarga la página al enviarse; esto lo evita
            l.entrar()
          }} className="mt-6 rounded-2xl bg-hueso p-8 shadow-2xl">
          <h1 className="font-titulo text-3xl uppercase">Panel del local</h1>
          <p className="mt-1 text-sm text-azul/70">Acceso solo para el equipo.</p>

          <label htmlFor="email" className="mt-6 block text-xs font-bold uppercase tracking-wider">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={l.email}
            onChange={(e) => l.cambiarEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-azul/15 bg-white px-4 py-3"
          />

          <label htmlFor="clave" className="mt-4 block text-xs font-bold uppercase tracking-wider">
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            required
            autoComplete="current-password"
            value={l.clave}
            onChange={(e) => l.cambiarClave(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-azul/15 bg-white px-4 py-3"
          />

          {l.error && (
            <p role="alert" className="mt-4 rounded-lg bg-rojo/10 px-3 py-2 text-sm font-semibold text-rojo">
              {l.error}
            </p>
          )}

          <button
            type="submit"
            disabled={l.enviando}
            className="mt-6 w-full rounded-xl bg-rojo py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-rojo/90 disabled:opacity-60"
          >
            {l.enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
          <Link to="/" className="text-white/70 hover:text-white">
            ← Volver a la página
          </Link>
          {/* Para el portafolio: el panel con datos inventados, sin contraseña */}
          <Link to="/admin/demo" className="font-semibold text-white/70 hover:text-white">
            Ver demo del panel →
          </Link>
        </div>
      </div>
    </main>
  )
}

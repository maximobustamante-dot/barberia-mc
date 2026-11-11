import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { negocio } from '../data/negocio'

export default function Login() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setEnviando(true)
    setError('')

    // Supabase Auth revisa el correo y la contraseña.
    // Si son correctos, Admin.tsx se entera solo (onAuthStateChange).
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
    setEnviando(false)

    if (error) {
      // Mismo mensaje para correo o contraseña malos: no se revela cuál falló
      setError(
        error.status === 429
          ? 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
          : 'Correo o contraseña incorrectos.',
      )
      setClave('')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-azul px-6 py-12 text-azul">
      <div className="w-full max-w-sm">
        <p className="text-center font-titulo text-2xl uppercase tracking-wider text-white">
          {negocio.nombre}
        </p>

        <form onSubmit={entrar} className="mt-6 rounded-2xl bg-hueso p-8 shadow-2xl">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-azul/15 bg-white px-4 py-3"
          />

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-rojo/10 px-3 py-2 text-sm font-semibold text-rojo">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-6 w-full rounded-xl bg-rojo py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-rojo/90 disabled:opacity-60"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center text-sm text-white/70 hover:text-white">
          ← Volver a la página
        </Link>
      </div>
    </main>
  )
}

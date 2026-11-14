// ============================================================
// CONTROLADOR · Formulario de login
// Si el login sale bien, useSesionAdmin se entera solo (alCambiarSesion) y muestra el panel.
// ============================================================
import { useState } from 'react'
import { iniciarSesion } from '../modelos/sesion'
import { MENSAJES_LOGIN } from './mensajes'

export function useLogin() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function entrar() {
    setEnviando(true)
    setError('')
    const resultado = await iniciarSesion(email, clave)
    setEnviando(false)
    if (resultado !== 'ok') {
      setError(MENSAJES_LOGIN[resultado])
      setClave('') // se borra la contraseña tras un error
    }
  }

  return { email, clave, enviando, error, cambiarEmail: setEmail, cambiarClave: setClave, entrar }
}

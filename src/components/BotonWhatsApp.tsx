import { useEffect, useState } from 'react'
import { negocio } from '../data/negocio'
import IconoWhatsApp from './IconoWhatsApp'

// Botón fijo abajo a la derecha. Aparece después del hero y se esconde
// mientras se ve el formulario de reserva (ahí ya hay otra forma de contactar).
export default function BotonWhatsApp() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('inicio')
    const reserva = document.getElementById('reserva')
    if (!hero || !reserva) return
    const enPantalla = { hero: true, reserva: false }

    // IntersectionObserver (del navegador) avisa cuando una sección entra o sale de la pantalla
    const observador = new IntersectionObserver((cambios) => {
      for (const c of cambios) {
        if (c.target === hero) enPantalla.hero = c.isIntersecting
        if (c.target === reserva) enPantalla.reserva = c.isIntersecting
      }
      setVisible(!enPantalla.hero && !enPantalla.reserva)
    })
    observador.observe(hero)
    observador.observe(reserva)
    return () => observador.disconnect()
  }, [])

  const mensaje = encodeURIComponent(`Hola, quiero consultar por una hora en ${negocio.nombre}.`)
  return (
    <a
      href={`https://wa.me/${negocio.telefono}?text=${mensaje}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/30 transition-all duration-300 hover:scale-105 sm:right-5 sm:bottom-5 sm:h-14 sm:w-14 ${
        visible ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <IconoWhatsApp className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  )
}

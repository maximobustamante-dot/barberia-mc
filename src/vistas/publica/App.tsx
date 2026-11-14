import Navbar from './Navbar'
import Hero from './Hero'
import Nosotros from './Nosotros'
import Servicios from './Servicios'
import Equipo from './Equipo'
import Ubicacion from './Ubicacion'
import Reserva from './Reserva'
import PreguntasFrecuentes from './PreguntasFrecuentes'
import Footer from './Footer'
import BotonWhatsApp from './BotonWhatsApp'
import DatosEstructurados from './DatosEstructurados'

// VISTA · Página pública (ruta "/"): ordena las secciones
export default function App() {
  return (
    <>
      <DatosEstructurados />
      <Navbar />
      <main>
        <Hero />
        <Nosotros />
        <Servicios />
        <Equipo />
        <Ubicacion />
        <Reserva />
        <PreguntasFrecuentes />
      </main>
      <Footer />
      <BotonWhatsApp />
    </>
  )
}

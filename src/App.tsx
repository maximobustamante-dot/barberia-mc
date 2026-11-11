import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Nosotros from './components/Nosotros'
import Servicios from './components/Servicios'
import Equipo from './components/Equipo'
import Ubicacion from './components/Ubicacion'
import Reserva from './components/Reserva'
import PreguntasFrecuentes from './components/PreguntasFrecuentes'
import Footer from './components/Footer'
import BotonWhatsApp from './components/BotonWhatsApp'
import DatosEstructurados from './components/DatosEstructurados'

// Página pública (ruta "/")
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

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Nosotros from './components/Nosotros'
import Servicios from './components/Servicios'
import Equipo from './components/Equipo'
import Ubicacion from './components/Ubicacion'
import Reserva from './components/Reserva'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Nosotros />
        <Servicios />
        <Equipo />
        <Ubicacion />
        <Reserva />
      </main>
      <Footer />
    </>
  )
}

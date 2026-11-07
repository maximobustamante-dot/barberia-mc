import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Servicios from './components/Servicios'
import Equipo from './components/Equipo'
import Reserva from './components/Reserva'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Servicios />
        <Equipo />
        <Reserva />
      </main>
      <Footer />
    </>
  )
}
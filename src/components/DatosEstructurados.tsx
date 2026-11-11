import { negocio } from '../data/negocio'
import { servicios } from '../data/servicios'

const DIAS_INGLES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Ficha del negocio en el formato que entiende Google (schema.org).
// Ayuda a que aparezca con dirección, horario y precios en los resultados.
// No se ve en la página.
export default function DatosEstructurados() {
  const ficha = {
    '@context': 'https://schema.org',
    '@type': 'BarberShop',
    name: negocio.nombre,
    telephone: `+${negocio.telefono}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: negocio.direccion,
      addressLocality: negocio.comuna,
      addressCountry: 'CL',
    },
    openingHoursSpecification: negocio.apertura.map((a) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: a.dias.map((d) => DIAS_INGLES[d]),
      opens: a.abre,
      closes: a.cierra,
    })),
    sameAs: [`https://instagram.com/${negocio.instagram}`],
    makesOffer: servicios.map((s) => ({
      '@type': 'Offer',
      price: s.precio,
      priceCurrency: 'CLP',
      itemOffered: { '@type': 'Service', name: s.nombre, description: s.descripcion },
    })),
  }

  return <script type="application/ld+json">{JSON.stringify(ficha)}</script>
}

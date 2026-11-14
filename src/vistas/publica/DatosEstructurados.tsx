import { negocio } from '../../modelos/datos/negocio'
import { servicios } from '../../modelos/datos/servicios'
import { instagramDelLocal } from '../../modelos/enlaces'

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
    sameAs: [instagramDelLocal()],
    makesOffer: servicios.map((s) => ({
      '@type': 'Offer',
      price: s.precio,
      priceCurrency: 'CLP',
      itemOffered: { '@type': 'Service', name: s.nombre, description: s.descripcion },
    })),
  }

  return <script type="application/ld+json">{JSON.stringify(ficha)}</script>
}

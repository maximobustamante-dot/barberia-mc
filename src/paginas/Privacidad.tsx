import { Link } from 'react-router'
import { negocio } from '../data/negocio'
import IconoTijeras from '../components/IconoTijeras'

// Texto de ejemplo para la plantilla. Con cada cliente real hay que revisarlo:
// quién es el responsable, por cuánto tiempo se guardan los datos y dónde.
export default function Privacidad() {
  return (
    <main className="min-h-screen bg-hueso px-6 py-16 text-azul">
      <title>{`Privacidad · ${negocio.nombre}`}</title>
      <article className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2.5 font-titulo text-2xl uppercase tracking-wider">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rojo text-white">
            <IconoTijeras className="h-4 w-4" />
          </span>
          {negocio.nombre}
        </Link>
        <h1 className="mt-10 font-titulo text-4xl uppercase">Aviso de privacidad</h1>

        <div className="mt-8 space-y-6 leading-relaxed text-azul/85">
          <section>
            <h2 className="font-titulo text-xl uppercase text-azul">Qué datos pedimos</h2>
            <p className="mt-2">
              Al reservar en línea te pedimos tu nombre y tu teléfono, junto con el servicio, el barbero, la
              fecha y la hora que eliges.
            </p>
          </section>
          <section>
            <h2 className="font-titulo text-xl uppercase text-azul">Para qué los usamos</h2>
            <p className="mt-2">
              Solo para agendar tu hora y contactarte por WhatsApp o llamada para confirmarla, recordártela o
              avisarte de algún cambio. No los vendemos ni los compartimos con terceros para publicidad.
            </p>
          </section>
          <section>
            <h2 className="font-titulo text-xl uppercase text-azul">Dónde se guardan</h2>
            <p className="mt-2">
              En una base de datos en la nube con acceso restringido: solo el equipo de {negocio.nombre} puede
              ver las reservas, con usuario y contraseña.
            </p>
          </section>
          <section>
            <h2 className="font-titulo text-xl uppercase text-azul">Cuánto tiempo</h2>
            <p className="mt-2">
              Guardamos los datos de cada reserva hasta 12 meses después de la fecha de la hora. Después
              los borramos.
            </p>
          </section>
          <section>
            <h2 className="font-titulo text-xl uppercase text-azul">Tus derechos</h2>
            <p className="mt-2">
              Puedes pedir ver, corregir o eliminar tus datos cuando quieras, conforme a la ley chilena de
              protección de datos personales. Escríbenos por{' '}
              <a href={`https://wa.me/${negocio.telefono}`} className="font-semibold underline hover:text-rojo">
                WhatsApp
              </a>{' '}
              o pásate por el local en {negocio.direccion}, {negocio.comuna}.
            </p>
          </section>
        </div>

        <Link to="/" className="mt-12 inline-block text-sm font-semibold text-azul/70 hover:text-rojo">
          ← Volver a la página
        </Link>
      </article>
    </main>
  )
}

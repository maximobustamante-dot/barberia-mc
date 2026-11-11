import { negocio } from '../data/negocio'

const preguntas = [
  {
    p: '¿Tengo que reservar o puedo llegar sin hora?',
    r: 'Puedes llegar sin hora y te atendemos si hay un espacio libre, pero con reserva te aseguras tu barbero y no esperas.',
  },
  {
    p: '¿Cómo sé que mi reserva quedó confirmada?',
    r: 'Al reservar tu hora queda apartada. Luego te escribimos por WhatsApp para confirmarla.',
  },
  {
    p: '¿Puedo cambiar o cancelar mi hora?',
    r: 'Sí. Escríbenos por WhatsApp con al menos 2 horas de anticipación y la movemos o liberamos sin costo.',
  },
  {
    p: '¿Qué medios de pago aceptan?',
    r: 'Efectivo, tarjetas de débito y crédito, y transferencia. Se paga en el local al terminar.',
  },
  {
    p: '¿Atienden a niños?',
    r: 'Sí, tenemos corte infantil para niños de hasta 12 años.',
  },
  {
    p: '¿Qué pasa si llego tarde?',
    r: 'Te esperamos hasta 10 minutos. Después de eso puede que tengamos que mover tu hora para no atrasar al siguiente cliente.',
  },
]

export default function PreguntasFrecuentes() {
  return (
    <section id="preguntas" className="scroll-mt-24 bg-hueso px-6 py-24 text-azul">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rojo">Dudas</p>
          <h2 className="mt-2 font-titulo text-4xl uppercase md:text-5xl">Preguntas frecuentes</h2>
          <p className="mt-4 text-azul/75">
            ¿Te quedó otra duda?{' '}
            <a
              href={`https://wa.me/${negocio.telefono}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-rojo underline-offset-4 hover:underline"
            >
              Escríbenos por WhatsApp
            </a>
            .
          </p>
        </div>

        {/* <details> abre y cierra cada respuesta sin JavaScript */}
        <div className="divide-y divide-azul/10 border-y border-azul/10">
          {preguntas.map(({ p, r }) => (
            <details key={p} className="group py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {p}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-5 w-5 shrink-0 text-rojo transition-transform duration-200 group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </summary>
              <p className="mt-3 leading-relaxed text-azul/75">{r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

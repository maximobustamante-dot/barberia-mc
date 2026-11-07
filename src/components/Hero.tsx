export default function Hero() {
return (
    <section
    id="inicio"
    className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-900 px-6 text-center text-white"
    >
      {/* Capa 1: foto de fondo oscurecida */}
    <div className="absolute inset-0 bg-[url(/hero.jpg)] bg-cover bg-center opacity-40" />

      {/* Capa 2: contenido */}
    <div className="relative max-w-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-azul-claro">
        Barbería de barrio
        </p>

        <h1 className="mt-4 font-titulo text-5xl uppercase leading-tight md:text-7xl">
        Cortes clásicos,
        <br />
        estilo actual
        </h1>

        <p className="mt-6 text-lg text-neutral-300">
        Corte, fade y barba con atención personalizada.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <a
            href="#reserva"
            className="rounded-full bg-rojo px-8 py-3 font-semibold hover:bg-rojo/90"
        >
            Reservar hora
        </a>
        <a
            href="#servicios"
            className="rounded-full border border-white/40 px-8 py-3 font-semibold hover:bg-white/10"
        >
            Ver servicios
        </a>
        </div>
    </div>
    </section>
)
}
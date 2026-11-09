import { useState } from 'react'

function calcularEstadoAbierto(): boolean {
  const ahora = new Date()
  const dia = ahora.getDay()
  const minutos = ahora.getHours() * 60 + ahora.getMinutes()
  // Lunes a viernes: 10:00 (600) a 20:00 (1200)
  // Sábado: 10:00 (600) a 18:00 (1080)
  // Domingo: cerrado
  if (dia >= 1 && dia <= 5) {
    return minutos >= 600 && minutos < 1200
  }
  if (dia === 6) {
    return minutos >= 600 && minutos < 1080
  }
  return false
}

export default function Hero() {
  const [abierto] = useState(calcularEstadoAbierto)

  return (
    <section
      id="inicio"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-[#101114] px-6 pt-32 pb-20 text-center text-[#eae6df] md:min-h-screen"
    >
      {/* Capa 1: foto de fondo con oscurecimiento profundo y brillo controlado */}
      <div
        className="absolute inset-0 bg-[url(/fondo_barberia.webp)] bg-cover bg-center opacity-30 contrast-105 brightness-90"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#101114]/90 via-[#101114]/70 to-[#101114]"
        aria-hidden="true"
      />

      {/* Capa 2: Contenido central */}
      <div className="relative z-10 max-w-3xl">
        {/* Badges superiores: Estado en vivo + Calificación con brillo bajo */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold tracking-wide uppercase text-stone-300 shadow-sm backdrop-blur-md">
            <span
              className={`h-2 w-2 rounded-full ${
                abierto ? 'bg-emerald-500' : 'bg-amber-600'
              }`}
            />
            {abierto ? 'Abierto hoy' : 'Cerrado ahora · Agenda tu hora'}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/25 bg-amber-600/10 px-3.5 py-1 text-xs font-semibold text-amber-200/80 shadow-sm backdrop-blur-md">
            <span className="text-amber-400">★</span>
            <span>4.9 en Google</span>
            <span className="text-stone-400">· 180+ reseñas</span>
          </span>
        </div>

        {/* Título principal limpio sin tinte azul y brillo suave */}
        <h1 className="mt-6 font-titulo text-4xl uppercase tracking-wide leading-tight text-[#f3efe8] sm:text-6xl md:text-7xl">
          Cortes clásicos,
          <br />
          estilo con carácter
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-stone-300 sm:text-lg md:text-xl">
          Cortes de precisión, degradados perfectos y perfilado de barba con toalla caliente. Cero apuros y atención al detalle.
        </p>

        {/* Botones de llamada a la acción en tonos sobrios */}
        <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row sm:items-center sm:gap-4">
          <a
            href="#reserva"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-rojo px-8 py-3.5 font-semibold text-[#f5f2ec] shadow-lg shadow-black/40 transition-all hover:bg-rojo/85 hover:shadow-xl hover:shadow-black/60 active:scale-95"
          >
            <span>Reservar hora</span>
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          <a
            href="#servicios"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 font-semibold text-stone-200 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
          >
            Ver servicios y precios
          </a>
        </div>

        {/* Puntos de valor / Confianza con brillo atenuado */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-white/10 pt-6 text-xs text-stone-400 uppercase tracking-widest sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-rojo font-bold">✓</span>
            <span>Atención puntual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rojo font-bold">✓</span>
            <span>Productos premium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-rojo font-bold">✓</span>
            <span>Toalla caliente incluida</span>
          </div>
        </div>
      </div>

      {/* Franja clásica de barbería con bajo brillo */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(-45deg,var(--color-rojo)_0_12px,#ded9cf_12px_24px,var(--color-azul)_24px_36px,#ded9cf_36px_48px)] opacity-75"
      />
    </section>
  )
}

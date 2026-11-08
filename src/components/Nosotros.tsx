import { negocio } from '../data/negocio'

export default function Nosotros() {
const { subtitulo, titulo, parrafos, foto } = negocio.nosotros

return (
<section id="nosotros" className="scroll-mt-28 bg-hueso px-6 py-24 text-azul">
    <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
    <div>
        <p className="text-sm uppercase tracking-[0.3em] text-rojo">{subtitulo}</p>
        <h2 className="mt-3 font-titulo text-4xl uppercase md:text-5xl">{titulo}</h2>
        {parrafos.map((texto) => (
        <p key={texto} className="mt-4 leading-relaxed text-azul/80">
            {texto}
        </p>
        ))}
    </div>

    <img
    src={foto}
alt={`Interior de ${negocio.nombre}`}
        className="aspect-[4/5] w-full rounded-2xl bg-neutral-300 object-cover"
    />
</div>
</section>
)
}
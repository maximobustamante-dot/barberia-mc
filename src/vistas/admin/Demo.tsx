// ============================================================
// VISTA · /admin/demo: el mismo panel del dueño con reservas inventadas y sin login.
// No toca Supabase: sirve para mostrar el proyecto sin publicar una contraseña.
// ============================================================
import { useFuenteDemo } from '../../controladores/usePanel'
import { negocio } from '../../modelos/datos/negocio'
import Panel from './Panel'

export default function Demo() {
  const fuente = useFuenteDemo()

  return (
    <>
      <title>{`Demo del panel · ${negocio.nombre}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <Panel email="demo@ejemplo.cl" fuente={fuente} demo />
    </>
  )
}

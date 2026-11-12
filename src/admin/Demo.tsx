import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { negocio } from '../data/negocio'
import Panel from './Panel'
import { fuenteDemo } from './fuente'

// /admin/demo: el mismo panel del dueño, pero con reservas inventadas y sin login.
// No toca Supabase: sirve para mostrar el proyecto sin publicar una contraseña.
export default function Demo() {
  const navegar = useNavigate()
  // useMemo: la fuente se crea una sola vez, así los cambios de la demo no se pierden al redibujar
  const fuente = useMemo(() => fuenteDemo(() => navegar('/')), [navegar])

  return (
    <>
      <title>{`Demo del panel · ${negocio.nombre}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <Panel email="demo@ejemplo.cl" fuente={fuente} demo />
    </>
  )
}

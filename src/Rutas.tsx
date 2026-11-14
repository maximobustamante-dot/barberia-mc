import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router'
import App from './vistas/publica/App.tsx'
import Privacidad from './vistas/paginas/Privacidad.tsx'
import NoEncontrada from './vistas/paginas/NoEncontrada.tsx'

// El panel se descarga solo cuando alguien entra a /admin,
// así los clientes no cargan código que no usan.
const Admin = lazy(() => import('./vistas/admin/Admin.tsx'))
const Demo = lazy(() => import('./vistas/admin/Demo.tsx'))
const cargando = <div className="grid min-h-screen place-items-center">Cargando…</div>

// Qué componente se muestra según la dirección (URL)
export default function Rutas() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={cargando}>
            <Admin />
          </Suspense>
        }
      />
      <Route
        path="/admin/demo"
        element={
          <Suspense fallback={cargando}>
            <Demo />
          </Suspense>
        }
      />
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

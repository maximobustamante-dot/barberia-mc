import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router'
import App from './App.tsx'
import Privacidad from './paginas/Privacidad.tsx'
import NoEncontrada from './paginas/NoEncontrada.tsx'

// El panel se descarga solo cuando alguien entra a /admin,
// así los clientes no cargan código que no usan.
const Admin = lazy(() => import('./admin/Admin.tsx'))

// Qué componente se muestra según la dirección (URL)
export default function Rutas() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<div className="grid min-h-screen place-items-center">Cargando…</div>}>
            <Admin />
          </Suspense>
        }
      />
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  )
}

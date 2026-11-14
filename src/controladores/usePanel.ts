// ============================================================
// CONTROLADOR · Panel del dueño (y su demo)
// Decide qué rango de fechas se ve, pide las reservas a la "fuente" del modelo,
// aplica filtros, calcula el resumen y cambia estados. La vista Panel.tsx solo dibuja.
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { diaDe, hoyChile, lunesDe, sumarDias } from '../modelos/fechas'
import { aperturaDeFecha } from '../modelos/horario'
import { fuenteDemo, type ErrorPanel, type FuenteReservas } from '../modelos/panel'
import type { Estado, ReservaAdmin } from '../modelos/tipos'
import { MENSAJES_PANEL } from './mensajes'

type VistaPanel = 'dia' | 'semana'

export function usePanel(fuente: FuenteReservas) {
  const [vista, setVista] = useState<VistaPanel>('dia')
  const [fecha, setFecha] = useState(hoyChile)
  const [barbero, setBarbero] = useState<number | 'todos'>('todos')
  const [verCanceladas, setVerCanceladas] = useState(false)

  const [recarga, setRecarga] = useState(0) // al aumentar, vuelve a pedir las reservas
  const [cargadas, setCargadas] = useState({
    clave: '',
    rango: '',
    filas: [] as ReservaAdmin[],
    error: null as ErrorPanel | null,
  })
  const [ocupada, setOcupada] = useState<string | null>(null) // reserva que se está actualizando
  const [aviso, setAviso] = useState<ErrorPanel | null>(null)

  // Rango de fechas que se muestra
  const desde = vista === 'dia' ? fecha : lunesDe(fecha)
  const hasta = vista === 'dia' ? fecha : sumarDias(desde, 6)
  const rango = `${desde}_${hasta}`
  const clave = `${rango}_${recarga}`
  const cargando = cargadas.clave !== clave // hay una petición en curso (también al refrescar)
  const nuevoRango = cargadas.rango !== rango // cambió la fecha o la vista y aún no llegan sus reservas

  // 1. Pedir las reservas del rango
  useEffect(() => {
    let vigente = true // si cambia la fecha antes de que llegue la respuesta, se ignora
    fuente.cargar(desde, hasta).then(({ filas, error }) => {
      if (vigente) setCargadas({ clave, rango, filas, error })
    })
    return () => {
      vigente = false
    }
  }, [clave, rango, desde, hasta, fuente])

  // 2. Actualizar solo: al volver a la pestaña ('focus' es un evento del navegador) y cada 2 minutos
  useEffect(() => {
    const actualizar = () => setRecarga((n) => n + 1)
    const cadaRato = setInterval(actualizar, 120_000)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(cadaRato)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  // 3. Cambiar el estado de una reserva
  async function cambiar(id: string, estado: Estado) {
    setOcupada(id)
    setAviso(null)
    const error = await fuente.cambiar(id, estado)
    setOcupada(null)
    setAviso(error)
    setRecarga((n) => n + 1)
  }

  // Filtros. Al cambiar de fecha no se muestran las reservas del rango anterior; al refrescar
  // los mismos días (tras una acción, cada 2 min o al volver a la pestaña) la lista se queda.
  const filas = nuevoRango ? [] : cargadas.filas
  const delBarbero = filas.filter((r) => barbero === 'todos' || r.barbero_id === barbero)
  const activas = delBarbero.filter((r) => r.estado !== 'cancelada')
  const visibles = verCanceladas ? delBarbero : activas

  const resumen = {
    reservas: activas.length,
    porConfirmar: activas.filter((r) => r.estado === 'pendiente').length,
    ingresoEstimado: activas.filter((r) => r.estado !== 'no_asistio').reduce((suma, r) => suma + r.precio, 0),
    noAsistieron: activas.filter((r) => r.estado === 'no_asistio').length,
  }

  // Días del rango, cada uno con sus reservas y si el local atiende ese día
  const dias = Array.from({ length: vista === 'dia' ? 1 : 7 }, (_, i) => sumarDias(desde, i)).map((dia) => ({
    dia,
    cerrado: !aperturaDeFecha(dia),
    reservas: visibles.filter((r) => diaDe(r.inicio) === dia),
  }))

  const paso = vista === 'dia' ? 1 : 7
  const error = aviso ?? cargadas.error

  return {
    vista,
    fecha,
    desde,
    barbero,
    verCanceladas,
    resumen,
    dias,
    cargando,
    esperandoRango: nuevoRango,
    ocupada,
    error: error ? MENSAJES_PANEL[error] : '',
    // Acciones
    cambiarVista: setVista,
    irAFecha: (f: string) => f && setFecha(f),
    anterior: () => setFecha(sumarDias(fecha, -paso)),
    siguiente: () => setFecha(sumarDias(fecha, paso)),
    irAHoy: () => setFecha(hoyChile()),
    filtrarBarbero: setBarbero,
    mostrarCanceladas: setVerCanceladas,
    cambiar,
    salir: () => fuente.salir(),
  }
}

// Fuente de datos inventados para /admin/demo. useMemo (de React) la crea una sola vez,
// así los cambios hechos en la demo no se pierden cuando la pantalla se vuelve a dibujar.
// "Salir de la demo" vuelve a la página de inicio (useNavigate es de React Router).
export function useFuenteDemo() {
  const navegar = useNavigate()
  return useMemo(() => fuenteDemo(() => navegar('/')), [navegar])
}

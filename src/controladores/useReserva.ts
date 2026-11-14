// ============================================================
// CONTROLADOR · Formulario de reserva pública
// Guarda lo que eligió el cliente, pide los datos al modelo y decide qué mensaje mostrar.
// La vista (vistas/publica/Reserva.tsx) solo dibuja lo que este hook le entrega.
//
// Los nombres que empiezan con "use" son hooks: regla de React. Solo se pueden llamar
// dentro de un componente, y React los vuelve a ejecutar cada vez que algo cambia.
// ============================================================
import { useEffect, useState } from 'react'
import { nombreValido } from '../modelos/cliente'
import { hoyChile, sumarDias } from '../modelos/fechas'
import { fechaCorta } from '../modelos/formato'
import {
  DIAS_MAXIMO,
  cargarCatalogo,
  crearReserva,
  horasDisponibles,
  reservaEnLinea,
} from '../modelos/reservas'
import { telefonoValido } from '../modelos/telefono'
import type { BarberoReservable, ServicioReservable } from '../modelos/tipos'
import { MENSAJES_FORMULARIO, MENSAJES_RESERVA } from './mensajes'
import { escucharPedidos } from './pedirReserva'

interface ReservaConfirmada {
  servicio: string
  barbero: string
  fecha: string // 'dd-mm-aaaa'
  hora: string
}

export function useReserva() {
  // Catálogo (viene de la base)
  const [servicios, setServicios] = useState<ServicioReservable[]>([])
  const [barberos, setBarberos] = useState<BarberoReservable[]>([])
  const [sinConexion, setSinConexion] = useState(false) // la base no respondió (¿Supabase pausado?)

  // Lo que elige el cliente
  const [servicioId, setServicioId] = useState<number | null>(null)
  const [barberoId, setBarberoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(hoyChile) // hoy en Chile, no en el computador del visitante
  const [hora, setHora] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')

  // Horas libres, avisos y resultado
  const [horasCargadas, setHorasCargadas] = useState({ clave: '', horas: [] as string[] })
  const [recarga, setRecarga] = useState(0) // al aumentar, vuelve a pedir las horas
  const [errorHoras, setErrorHoras] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmada, setConfirmada] = useState<ReservaConfirmada | null>(null)

  // 1. "Reservar este" desde las tarjetas de Servicios y Equipo
  useEffect(
    () =>
      escucharPedidos(({ servicioId, barberoId }) => {
        if (servicioId) setServicioId(servicioId)
        if (barberoId) setBarberoId(barberoId)
        setHora('')
        setError('')
        setConfirmada(null)
      }),
    [],
  )

  // 2. Servicios y barberos activos. Si la base no responde → se ofrece WhatsApp.
  useEffect(() => {
    if (!reservaEnLinea) return
    cargarCatalogo().then((catalogo) => {
      if (!catalogo) {
        setSinConexion(true)
        return
      }
      setServicios(catalogo.servicios)
      setBarberos(catalogo.barberos)
      // Se respeta lo que ya eligió desde una tarjeta; si no, el primero de la lista
      setServicioId((prev) => (prev && catalogo.servicios.some((s) => s.id === prev) ? prev : catalogo.servicios[0].id))
      setBarberoId((prev) => (prev && catalogo.barberos.some((b) => b.id === prev) ? prev : catalogo.barberos[0].id))
    })
  }, [])

  // 3. Horas libres para el servicio, barbero y fecha elegidos
  const clave = servicioId && barberoId && fecha ? `${servicioId}-${barberoId}-${fecha}` : ''
  const cargandoHoras = reservaEnLinea && clave !== '' && horasCargadas.clave !== clave
  const horas = horasCargadas.clave === clave ? horasCargadas.horas : []

  useEffect(() => {
    if (!clave || !servicioId || !barberoId) return
    let vigente = true // si el cliente cambia algo antes de la respuesta, esa respuesta se ignora
    horasDisponibles(barberoId, servicioId, fecha).then((lista) => {
      if (!vigente) return
      setErrorHoras(lista ? '' : MENSAJES_FORMULARIO.sinHoras)
      setHorasCargadas({ clave, horas: lista ?? [] })
    })
    return () => {
      vigente = false
    }
  }, [clave, servicioId, barberoId, fecha, recarga])

  function volverAPedirHoras() {
    setHorasCargadas({ clave: '', horas: [] }) // así la vista muestra "Buscando horas libres…"
    setRecarga((n) => n + 1)
  }

  // Cambiar servicio, barbero o fecha obliga a elegir hora de nuevo y borra los avisos
  function cambiarSeleccion(cambio: () => void) {
    cambio()
    setHora('')
    setError('')
    setErrorHoras('')
  }

  const servicioActual = servicios.find((s) => s.id === servicioId)
  const barberoActual = barberos.find((b) => b.id === barberoId)

  // 4. Enviar: primero se revisa aquí (mensajes claros) y después la base revisa de nuevo
  async function enviar() {
    if (!servicioId || !barberoId || !hora) return setError(MENSAJES_FORMULARIO.faltaElegir)
    if (!nombreValido(nombre)) return setError(MENSAJES_FORMULARIO.nombreInvalido)
    if (!telefonoValido(telefono)) return setError(MENSAJES_FORMULARIO.telefonoInvalido)

    setEnviando(true)
    setError('')
    const problema = await crearReserva({ barberoId, servicioId, fecha, hora, nombre, telefono })
    setEnviando(false)

    if (problema) {
      setError(MENSAJES_RESERVA[problema])
      if (problema === 'HORA_NO_DISPONIBLE') {
        setHora('')
        volverAPedirHoras()
      }
      return
    }

    setConfirmada({
      servicio: servicioActual?.nombre ?? '',
      barbero: barberoActual?.nombre ?? '',
      fecha: fechaCorta(fecha),
      hora,
    })
    setHora('')
    volverAPedirHoras() // la hora recién tomada ya no debe aparecer
  }

  function nuevaReserva() {
    setConfirmada(null)
    setHora('')
    setNombre('')
    setTelefono('')
    setError('')
  }

  return {
    // ¿Se puede reservar en línea? (hay base configurada y respondió)
    enLinea: reservaEnLinea && !sinConexion,
    sinConexion,
    servicios,
    barberos,
    servicioId,
    barberoId,
    servicioActual,
    barberoActual,
    fecha,
    fechaMinima: hoyChile(),
    fechaMaxima: sumarDias(hoyChile(), DIAS_MAXIMO),
    hora,
    nombre,
    telefono,
    horas,
    hayEleccion: clave !== '', // ya hay servicio, barbero y fecha
    cargandoHoras,
    errorHoras,
    error,
    enviando,
    confirmada,
    // Acciones que la vista conecta a botones y campos
    elegirServicio: (id: number) => cambiarSeleccion(() => setServicioId(id)),
    elegirBarbero: (id: number) => cambiarSeleccion(() => setBarberoId(id)),
    elegirFecha: (f: string) => cambiarSeleccion(() => setFecha(f)),
    elegirHora: (h: string) => {
      setHora(h)
      setError('')
    },
    cambiarNombre: setNombre,
    cambiarTelefono: setTelefono,
    reintentarHoras: () => {
      setErrorHoras('')
      volverAPedirHoras()
    },
    enviar,
    nuevaReserva,
  }
}

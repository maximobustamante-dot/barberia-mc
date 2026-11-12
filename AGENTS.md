# AGENTS.md · Contexto del proyecto Barbería

Léelo antes de tocar código. Sirve para cualquier asistente (Claude, ChatGPT, Copilot, etc.)
y para personas nuevas en el equipo.

## Qué es

Página web de **una barbería genérica** ("Barbería", Providencia, Santiago) hecha como **muestra de
portafolio** para vender páginas a pymes chilenas. No es de un cliente real: los nombres, precios y
textos son de ejemplo y se cambian en `src/data/`.

Tiene tres partes:

1. **Página pública** (`/`): hero, nosotros, servicios, equipo, ubicación, reserva en línea,
   preguntas frecuentes y footer. Es una sola página que navega con anclas (`#reserva`, `#servicios`…).
2. **Reservas en línea**: el cliente elige servicio, barbero, fecha y hora libre, deja nombre y
   teléfono. Sin cuenta ni pago. Queda en estado `pendiente` y el local confirma por WhatsApp.
3. **Panel del dueño** (`/admin`): login con correo y contraseña; ve las reservas del día o la
   semana, confirma, marca atendida / no asistió, cancela y escribe al cliente por WhatsApp.
   `/admin/demo` muestra el mismo panel con datos inventados y sin login (para el portafolio).

## Equipo y forma de trabajo

- Repositorio: `github.com/maximobustamante-dot/barberia-mc` (público).
- Una **rama por tarea** (`navbar-`, `pruebas-ch`, `login-dashboard`…) → Pull Request → merge a `main`.
- El dueño del proyecto es el único con acceso a Supabase y a las claves. Quien no tenga
  `.env.local` igual puede trabajar: la página funciona y la reserva muestra un botón de WhatsApp.
- Todo el código, comentarios y textos van en **español de Chile**. Los nombres de componentes y
  variables también son en español (`Reserva`, `horasCargadas`, `enviar`).

## Tecnologías

| Herramienta | Para qué |
|---|---|
| React 19 + TypeScript | Componentes de la interfaz |
| Vite 8 | Servidor de desarrollo (`npm run dev`) y build (`npm run build`) |
| Tailwind CSS v4 | Estilos con clases; colores y fuentes en `src/index.css` (`@theme`) |
| React Router 7 | Rutas `/`, `/admin`, `/admin/demo`, `/privacidad` y 404 (`src/Rutas.tsx`) |
| Supabase | Base de datos PostgreSQL + login (Supabase Auth) |
| oxlint | Revisión de código (`npm run lint`) |
| Vitest | Pruebas unitarias (`npm test`), archivos `*.test.ts` junto al código |
| GitHub Actions | `.github/workflows/ci.yml`: lint, pruebas, build y `verificar.sql` en cada PR |

## Estructura

```
index.html                  Metadatos SEO, fuentes de Google, raíz de React
vercel.json                 Para que /admin funcione al publicar en Vercel
public/                     Imágenes y robots.txt (fotos reales pendientes)
src/
  main.tsx                  Arranca React con el router
  Rutas.tsx                 Qué página se muestra en cada dirección
  App.tsx                   Página pública: ordena las secciones
  index.css                 Paleta y fuentes (@theme)
  types.ts                  Tipos de Negocio, Servicio, Barbero
  data/                     Contenido editable: negocio.ts, servicios.ts, barberos.ts
  lib/supabase.ts           Cliente de Supabase (null si falta .env.local; frena la clave secreta)
  lib/horario.ts            "Abierto ahora / Abre mañana" en hora de Chile
  lib/telefono.ts           Normaliza y formatea teléfonos chilenos
  components/               Secciones de la página pública
    Reserva.tsx             Formulario de reserva conectado a Supabase
  paginas/                  Privacidad y 404
  admin/                    Panel del dueño (se carga solo al entrar a /admin)
    Admin.tsx               Decide qué mostrar: cargando / login / sin permiso / panel
    Login.tsx               Formulario de correo y contraseña
    Panel.tsx               Resumen, filtros y lista de reservas (recibe una "fuente" de datos)
    fuente.ts               Fuente Supabase (panel real) y fuente demo (datos inventados en memoria)
    Demo.tsx                /admin/demo: el panel con la fuente demo, sin login
    TarjetaReserva.tsx      Una reserva con sus botones de acción
    util.ts                 Fechas en hora de Chile, estados, enlace de WhatsApp
supabase/
  schema.sql                Etapa 1: tablas, seguridad, reservas sin cuenta
  migraciones/              Cambios posteriores, se corren en orden
    002_login_dashboard.sql Etapa 2: administradores, panel y frenos contra abuso
  verificar.sql             39 pruebas de seguridad; se corre en el SQL Editor y deshace todo
  pruebas/                  Para correr verificar.sql fuera de Supabase (CI): emula roles y auth
scripts/verificar-conexion.mjs  npm run verificar: conexión y permisos contra el Supabase real
docs/                       PRUEBAS.md (informe), DESPLIEGUE.md (Vercel), capturas/
.github/workflows/ci.yml    Revisión automática en cada Pull Request
.claude/agents/             Agentes revisores (solo aconsejan, no programan)
```

## Base de datos (Supabase)

Tablas: `barberos`, `servicios`, `horarios` (por barbero y día de la semana), `reservas`,
`administradores` (qué usuarios de Supabase Auth son dueños).

**Regla de seguridad principal:** el navegador **nunca** lee ni escribe `reservas`, `horarios` ni
`administradores` directamente (RLS + `revoke`). Todo pasa por funciones SQL `security definer`:

| Función | Quién | Qué hace |
|---|---|---|
| `horas_disponibles(barbero, servicio, fecha)` | público | Horas libres cada 30 min, hora de Chile |
| `crear_reserva(...)` | público | Revalida la hora y los frenos (abajo) y guarda |
| `es_admin()` | con sesión | ¿El usuario es administrador? |
| `admin_reservas(desde, hasta)` | administrador | Reservas del rango (máx. 62 días) |
| `admin_cambiar_estado(id, estado)` | administrador | Cambia el estado de una reserva |

- Estados: `pendiente`, `confirmada`, `atendida`, `no_asistio`, `cancelada`.
- La restricción `sin_cruces` impide dos reservas activas del mismo barbero que se traslapen.
- Frenos de la reserva pública: hasta 30 días hacia adelante, máximo 2 reservas futuras por
  teléfono (normalizado con `normalizar_telefono`) y máximo 30 reservas nuevas por hora en total.
- Errores que las funciones devuelven al frontend: `HORA_NO_DISPONIBLE`, `LIMITE_RESERVAS`,
  `FECHA_FUERA_DE_RANGO`, `DEMASIADAS_RESERVAS`, `NO_AUTORIZADO`, `RANGO_INVALIDO`,
  `ESTADO_INVALIDO`, `RESERVA_NO_EXISTE`.
- Para cambiar la base: **crea un archivo nuevo** en `supabase/migraciones/` (`003_...sql`) y
  córrelo en el SQL Editor. No edites una migración que ya se corrió.

### Instalar desde cero

1. Crear proyecto en Supabase → SQL Editor → correr `schema.sql`, luego cada migración en orden.
2. Authentication → Users → Add user (correo y contraseña del dueño, "Auto Confirm User").
3. `insert into administradores (user_id, nombre) select id, 'Dueño' from auth.users where email = '...';`
4. Authentication → Sign In / Providers → desactivar "Allow new users to sign up" y
   "Allow anonymous sign-ins". URL Configuration → Site URL = dominio publicado.
5. Copiar `.env.example` como `.env.local` con la URL del proyecto y la **clave publicable**.

## Reglas para quien modifique el código

- **Nunca** poner en el código ni en el repo la clave `sb_secret_...` / `service_role`. La clave
  publicable sí puede ir en el navegador (está protegida por RLS), pero vive en `.env.local`.
- Si una función nueva expone datos, la verificación de permisos va **en SQL** (`es_admin()`),
  no solo en React.
- Fechas y horas de reservas siempre en zona `America/Santiago` (ver `src/admin/util.ts`).
- Mantener los textos cortos y en es-CL. Precios con `toLocaleString('es-CL')`.
- Antes de subir: `npm run lint`, `npm test` y `npm run build` sin errores (la CI los repite).
- Si agregas una función SQL o cambias permisos, agrega su prueba en `supabase/verificar.sql`
  (lista `pruebas`: grupo, descripción, rol, consulta, resultado esperado) y córrelo.
- Si el panel necesita una acción nueva, agrégala a `FuenteReservas` en `src/admin/fuente.ts`
  en las dos fuentes (Supabase y demo).
- `vercel.json` trae cabeceras de seguridad (CSP). Si agregas un servicio externo (otro mapa,
  analytics, imágenes de otro dominio), hay que permitirlo ahí o el navegador lo bloquea.

## Cosas a saber (deuda conocida)

- Los colores en `index.css` se llaman `azul`, `azul-claro`, `hueso`, `rojo` por la paleta original,
  pero desde el rediseño `azul` es **carbón** (#121316) y `azul-claro` es **piedra**. Los nombres se
  mantuvieron para no romper las clases existentes.
- Servicios y barberos están **dos veces**: en `src/data/` (lo que muestra la página) y en la base
  (lo que usa la reserva). Si cambias uno, cambia el otro. Los `id` deben coincidir:
  `TarjetaServicio` y `TarjetaBarbero` mandan el `id` al formulario de reserva.
- El horario está en `negocio.ts` dos veces (`horario` para mostrar, `apertura` para calcular) y
  en la tabla `horarios` de Supabase. Si cambia, hay que cambiar los tres.
- La insignia "Más pedido" se activa con `destacado: true` en `src/data/servicios.ts`.
- Faltan las fotos reales: `public/nosotros.jpg` y `public/barberos/{matias,javier,diego}.jpg`.
  Mientras tanto se ve un respaldo con iniciales.
- `src/paginas/Privacidad.tsx` es un texto de ejemplo; revisarlo con cada cliente real.
- `/admin/demo` y el link "Ver demo del panel" del login son para el portafolio: quitarlos en
  la página de un cliente real.
- El plan gratuito de Supabase pausa el proyecto tras 7 días sin uso; la demo del panel sigue
  funcionando, la reserva pública no.

## Pendientes / ideas

- Captcha (Cloudflare Turnstile) en la reserva, validado en una Edge Function: es el freno real
  contra bots para un cliente en producción.
- Borrar automáticamente reservas de más de 12 meses (lo promete la página de privacidad).
- Bloquear horas o días (vacaciones, feriados) desde el panel.
- Editar servicios, precios y barberos desde el panel (hoy se hace en Supabase → Table Editor).
- Recordatorio automático por WhatsApp o correo el día antes.
- Galería de trabajos y reseñas reales de Google.
- Publicar en Vercel: pasos en `docs/DESPLIEGUE.md`.
- Etapa 3: cuentas de clientes (historial, cancelar su propia hora).

## Agentes revisores

En `.claude/agents/` hay dos agentes que **solo aconsejan, no programan**:

- `revisor-seguridad.md`: login, panel, RLS y funciones SQL.
- `revisor-diseno.md`: diseño, móvil y accesibilidad.

En Claude Code se usan pidiendo "usa el agente revisor-seguridad". En otro asistente, copia el
contenido del archivo como instrucciones.

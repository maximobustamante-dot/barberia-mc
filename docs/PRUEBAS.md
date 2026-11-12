# Informe de pruebas

Qué se probó del proyecto, cómo y con qué resultado. Fecha de la última corrida completa:
**12 de noviembre de 2026** (rama `login-dashboard`).

**Resumen:** 39 pruebas de seguridad de la base, 25 pruebas unitarias y 34 comprobaciones de
punta a punta en el navegador. **Todas pasaron.** Durante las pruebas apareció un solo error, y era
del entorno de prueba, no del proyecto (ver [Hallazgos](#hallazgos)).

| Capa | Herramienta | Pruebas | Resultado | Cómo repetirlas |
|---|---|---|---|---|
| Base de datos y permisos | SQL (`supabase/verificar.sql`) | 39 | ✅ 39/39 | SQL Editor de Supabase o `bash supabase/pruebas/correr.sh` |
| Lógica de la página | Vitest | 25 | ✅ 25/25 | `npm test` |
| Conexión página ↔ Supabase | `scripts/verificar-conexion.mjs` | 15 + 4 opcionales | ✅ | `npm run verificar` |
| De punta a punta (navegador) | Playwright | 34 | ✅ 34/34 | Manual (ver [más abajo](#4-de-punta-a-punta-en-el-navegador)) |
| Calidad de código | TypeScript + oxlint + build | — | ✅ sin errores | `npm run lint` · `npm run build` |

Las capas 1, 2 y 5 corren solas en GitHub Actions en cada Pull Request (`.github/workflows/ci.yml`).

---

## 1. Seguridad de la base de datos

**Archivo:** `supabase/verificar.sql`

**Qué hace:** se conecta como cada tipo de visitante, igual que Supabase cuando llega una
petición, e intenta hacer cosas permitidas y prohibidas. Al final deshace todo: no deja
reservas guardadas. Se comprobó que después de correrlo la tabla `reservas` queda igual que antes.

**Roles probados:**

- `anon`: cualquier visitante de la página, sin sesión. Usa la clave publicable, que es pública.
- `usuario`: alguien con sesión iniciada que **no** está en la tabla `administradores`.
- `admin`: el dueño (un usuario de la tabla `administradores`).

### Resultados

| # | Grupo | Prueba | Esperado | Resultado |
|---|---|---|---|---|
| 1 | Estructura | Migración 002 aplicada | sí | ✅ |
| 2 | Estructura | RLS activado en las 5 tablas | sí | ✅ |
| 3 | Estructura | Existe la regla `sin_cruces` | sí | ✅ |
| 4 | Estructura | Las 5 funciones son `security definer` con `search_path` fijo | sí | ✅ |
| 5 | Estructura | Hay al menos un administrador | sí | ✅ |
| 6 | Estructura | Ningún usuario de Auth sin ser administrador | sí | ✅ |
| 7–9 | Público | Ve servicios, barberos y horas disponibles | permitido | ✅ |
| 10 | Público | Leer `reservas` (nombres y teléfonos) | rechazado | ✅ `permission denied` |
| 11 | Público | Leer `horarios` | rechazado | ✅ |
| 12 | Público | Leer `administradores` | rechazado | ✅ |
| 13 | Público | Insertar una reserva directo en la tabla, saltándose las reglas | rechazado | ✅ |
| 14 | Público | Cambiar precios | rechazado | ✅ |
| 15 | Público | Agregar barberos | rechazado | ✅ |
| 16–18 | Público | Usar `es_admin`, `admin_reservas`, `admin_cambiar_estado` | rechazado | ✅ |
| 19 | Usuario sin permiso | `es_admin()` | falso | ✅ |
| 20–21 | Usuario sin permiso | Ver reservas del panel / cambiar estados | `NO_AUTORIZADO` | ✅ |
| 22–23 | Usuario sin permiso | Leer `reservas` / `administradores` directo | rechazado | ✅ |
| 24 | Reserva pública | Reserva válida | se guarda | ✅ |
| 25 | Reserva pública | La hora tomada deja de ofrecerse | sí | ✅ |
| 26 | Reserva pública | Misma hora, otro cliente | `HORA_NO_DISPONIBLE` | ✅ |
| 27 | Reserva pública | 2.ª reserva del mismo teléfono escrito distinto (`56900000001`) | permitida | ✅ |
| 28 | Reserva pública | 3.ª reserva del mismo teléfono (`9 0000 0001`) | `LIMITE_RESERVAS` | ✅ |
| 29 | Reserva pública | Fecha a más de 30 días | `FECHA_FUERA_DE_RANGO` | ✅ |
| 30 | Administrador | `es_admin()` | verdadero | ✅ |
| 31 | Administrador | Ve las reservas recién creadas | 2 | ✅ |
| 32–33 | Administrador | Confirma una reserva y el cambio queda guardado | sí | ✅ |
| 34 | Administrador | Estado inventado (`pagada`) | `ESTADO_INVALIDO` | ✅ |
| 35 | Administrador | Reserva que no existe | `RESERVA_NO_EXISTE` | ✅ |
| 36 | Administrador | Rango de más de 62 días | `RANGO_INVALIDO` | ✅ |
| 37 | Administrador | Leer la tabla `reservas` directo (incluso siendo admin) | rechazado | ✅ |
| 38–39 | Reserva pública | Reserva n.º 31 en la misma hora (freno contra bots) | `DEMASIADAS_RESERVAS` | ✅ |

**Que el script detecte los problemas:**

- Sin ningún administrador, las pruebas 5 y 30–36 salieron ❌ con el aviso "No hay administradores".
- Con un usuario extra registrado que no es administrador, la prueba 6 salió ❌.

Es decir, el script no da ✅ por defecto.

**Dónde se corrió:** PostgreSQL 16 con `supabase/pruebas/emular-supabase.sql`, que crea los mismos
roles y la función `auth.uid()` que trae Supabase, y en GitHub Actions. **En el Supabase real del
proyecto hay que correrlo una vez** (ver [Pendiente](#pendiente-verificar-en-el-supabase-real)).

---

## 2. Pruebas unitarias (Vitest)

`npm test` corre 25 pruebas en 4 archivos:

| Archivo | Qué comprueba |
|---|---|
| `src/lib/telefono.test.ts` | `+56 9 1234 5678`, `56912345678`, `9 1234 5678` y `+56 (9) 1234-5678` quedan iguales (igual que `normalizar_telefono` en SQL). Formato para mostrar. |
| `src/lib/horario.test.ts` | "Abierto ahora / Abre mañana / Abre el lunes" en hora de Chile, incluyendo el cierre exacto (20:00), el sábado y el domingo. |
| `src/admin/util.test.ts` | Conversión hora de Chile → UTC en verano (UTC-3) y en invierno (UTC-4). Una reserva a las 23:30 sigue siendo de ese día. Suma de días entre meses y años. Lunes de la semana. Enlace de WhatsApp. Mensajes de error. |
| `src/admin/fuente.test.ts` | La demo del panel no genera reservas el domingo, nunca cruza dos reservas del mismo barbero, genera siempre los mismos datos y guarda los cambios de estado. |

---

## 3. Conexión de la página con Supabase

`npm run verificar` corre desde el computador con **la misma clave que usa la página** y no
cambia nada en la base. Revisa:

1. `.env.local` tiene la URL correcta y la clave **publicable** (detecta si alguien pegó la secreta).
2. El registro de usuarios nuevos está cerrado y el inicio de sesión anónimo está apagado.
3. Servicios y barberos de la base coinciden con `src/data/`. Es la deuda conocida de tener los
   datos en dos lugares.
4. El público puede consultar horas libres.
5. El público **no** puede leer reservas, horarios ni administradores, cambiar precios ni usar
   las funciones del panel.
6. Opcional: pide el correo y la contraseña del dueño (la contraseña no se muestra al escribirla).
   Comprueba que entra, que es administrador, que ve las reservas y que aun así no puede leer la
   tabla directo.

**Probado contra un servidor que imita Supabase:**

- Con todo en orden: todo ✅.
- Con el registro abierto: ❌ con el paso para cerrarlo.
- Con un precio distinto en `src/data/servicios.ts`: ❌ que dice qué servicio difiere.
- Con la URL terminada en `/rest/v1/` y la clave secreta: ❌ en ambos.
- El login del dueño: 4/4 ✅.

---

## 4. De punta a punta en el navegador

Con Playwright (Chromium) se manejó la página como lo haría una persona: hacer clic, escribir,
reservar y entrar al panel. La página se sirvió con las cabeceras de seguridad de `vercel.json`
y estaba conectada a una base PostgreSQL con `schema.sql` + `002`.

| Área | Comprobación | |
|---|---|---|
| Reserva pública | Una reserva válida queda guardada | ✅ |
| | 2.ª reserva del mismo teléfono escrito distinto: permitida | ✅ |
| | 3.ª reserva del mismo teléfono: mensaje "Ya tienes 2 horas reservadas…" | ✅ |
| | La hora tomada ya no aparece para el mismo barbero | ✅ |
| | El resumen muestra la duración del servicio | ✅ |
| Página pública | Datos estructurados para Google (JSON-LD), `/privacidad` y página 404 | ✅ |
| Login | `/admin` tiene `noindex` (Google no lo muestra) | ✅ |
| | Contraseña mala → "Correo o contraseña incorrectos." y se borra la contraseña | ✅ |
| | Correo que no existe → **el mismo** mensaje (no revela qué correos existen) | ✅ |
| | Usuario válido que no es admin → pantalla "Sin acceso" y **ninguna** reserva visible | ✅ |
| | El dueño entra al panel | ✅ |
| Panel | Ve exactamente las 4 reservas creadas desde la página (una sin enviar no aparece) | ✅ |
| | Resumen: 4 reservas, 4 por confirmar, ingreso estimado $52.000 (18.000 + 14.000 + 8.000 + 12.000) | ✅ |
| | Confirmar, y botón de WhatsApp con el número normalizado y el mensaje listo | ✅ |
| | Cancelar en dos pasos; "Mostrar canceladas" la vuelve a mostrar | ✅ |
| | **Al cancelar, esa hora vuelve a ofrecerse en la página pública** | ✅ |
| | Vista semana y filtro por barbero | ✅ |
| | La sesión se mantiene al recargar; cerrar sesión vuelve a pedir login | ✅ |
| Demo | `/admin/demo` muestra reservas inventadas y **no hace ninguna petición a Supabase** | ✅ |
| Celular (iPhone 13) | Página y panel sin scroll horizontal | ✅ |
| Seguridad del navegador | Ningún recurso bloqueado por la CSP de `vercel.json` | ✅ |

Las capturas de `docs/capturas/` salieron de esta corrida.

---

## 5. Revisiones manuales

Se hicieron con los agentes de `.claude/agents/`, que solo aconsejan. Sus recomendaciones se
aplicaron en el commit "Aplica revisión de seguridad y de diseño".

- **Seguridad** (`revisor-seguridad`): login con mensaje genérico, permisos revisados en SQL y no
  solo en React, frenos contra abuso, cabeceras CSP, registro cerrado y freno contra la clave secreta.
- **Diseño** (`revisor-diseno`): móvil, botones de 44 px en el celular, contraste del foco,
  formularios accesibles (`fieldset`/`legend`, `aria-pressed`).

---

## Hallazgos

| Hallazgo | Tipo | Estado |
|---|---|---|
| "undefined minutos" en el resumen de la reserva durante las pruebas | Error del **servidor de prueba**: no respetaba el alias `duracionMin:duracion_min`, que Supabase sí respeta | Corregido en el entorno de prueba. La página no tenía el error. |
| Un caso de prueba de horario esperaba "Abierto" a las 09:00 | Error en la **prueba** | Corregido |
| El plan gratuito de Supabase **pausa el proyecto tras 7 días sin uso** | Riesgo para la demo pública | Mitigado: `/admin/demo` funciona sin Supabase. La reserva pública mostraría un error hasta reactivar el proyecto. |

## Límites de estas pruebas

- Las pruebas de punta a punta se hicieron contra un PostgreSQL local que imita Supabase, no
  contra el proyecto real (desde el entorno de prueba no hay acceso a Internet). El SQL de las
  migraciones es el mismo, pero el login real lo maneja Supabase Auth.
- No se probaron captcha, envío de correos ni la recuperación de contraseña: no están implementados.
- No hay pruebas de carga.

## Pendiente: verificar en el Supabase real

Lo hace el dueño del proyecto, porque es el único con las claves:

- [ ] Correr `supabase/verificar.sql` en el SQL Editor: todas ✅.
- [ ] Correr `npm run verificar` (con el login del dueño): todas ✅.
- [ ] Entrar a `/admin` con la cuenta del dueño y confirmar una reserva de prueba.

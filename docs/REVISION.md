# Historial de revisión de código

Registro del ciclo de revisión con el agente `revisor-codigo` (`.claude/agents/revisor-codigo.md`).
El agente **solo indica** qué está mal y dónde. El programador corrige, comprueba con
`npm run lint`, `npm test` y `npm run build`, y vuelve a pedir revisión. El ciclo se repite hasta
`VEREDICTO: APROBADO`.

**Gravedades:**

- **Crítico:** rompe la app o expone datos.
- **Alto:** error que un usuario puede encontrar.
- **Medio:** código de más, confuso o frágil.
- **Bajo:** detalle.
- **Sugerencia:** opcional.

**APROBADO** = no queda nada Crítico, Alto ni Medio sin resolver.

---

## Ciclo 1 · 14 de noviembre de 2026 · rama `revision-codigo`

| Ronda | Revisó | Hallazgos | Veredicto |
|---|---|---|---|
| 1 | Todo el repositorio (commit `9ac3dd9`) | 2 Altos, 5 Medios, 8 Bajos, 1 Sugerencia | Cambios pendientes |
| 2 | Correcciones de la ronda 1 (`2af5bed`) | 16/16 resueltos · 1 Medio nuevo (causado por un arreglo), 4 Bajos | Cambios pendientes |
| 3 | Correcciones de la ronda 2 (`4e46335`) | 5/5 resueltos · 2 Bajos | **Aprobado** |

Los 2 Bajos de la ronda 3 también se corrigieron, antes del merge.

### Ronda 1

| # | Gravedad | Hallazgo | Qué se hizo |
|---|---|---|---|
| R1-01 | Alto | Si Supabase falla o está pausado, la reserva queda en "Cargando…" para siempre | Si no cargan servicios o barberos, se muestra el bloque "Reserva tu hora por WhatsApp" |
| R1-02 | Alto | Los mensajes de error no se borraban al resolverse | Aviso de horas separado, con "Reintentar"; cambiar la selección limpia los avisos |
| R1-03 | Medio | La fecha mínima de la reserva usaba la hora del computador del visitante, no la de Chile | Fechas movidas a `src/lib/fechas.ts` (hora de Chile), usadas por la reserva y el panel |
| R1-04 | Medio | Las categorías de servicios dependían de ids escritos a mano | Campo `categoria` en cada servicio de `src/data/servicios.ts` |
| R1-05 | Medio | El horario estaba repetido en el panel y en la demo (5 lugares en vez de 3) | `aperturaDeFecha()` en `src/lib/horario.ts` lee `negocio.apertura` |
| R1-06 | Medio | Restos de la plantilla de Vite (`icons.svg`, `hero.png`, favicon de Vite) y una foto sin usar | Borrados los restos y favicon propio. `public/image.png` queda para que decida el dueño (licencia desconocida) |
| R1-07 | Medio | Datos guardados que nunca se mostraban (`Confirmada`) | Quitados |
| R1-08 | Bajo | Ícono de tijeras copiado en 3 archivos | Componente `IconoTijeras` |
| R1-09 | Bajo | Teléfono repetido y sin formato en el bloque de WhatsApp | Una sola vez, con `formatearTelefono()` |
| R1-10 | Bajo | El teléfono rechazaba guiones sin explicar por qué; un nombre de solo espacios pasaba | Se aceptan guiones y paréntesis (`limpiarTelefono()`), con `title` y validación del nombre |
| R1-11 | Bajo | El resumen del panel mostraba un momento los números del día anterior | Se vacía al cambiar de fecha (esto causó el R2-01) |
| R1-12 | Bajo | Nombres en inglés (`scrolled`, `handleScroll`, `amenities`) | Pasados a español |
| R1-13 | Bajo | El menú móvil cerrado recibía el foco con Tab | Atributo `inert` |
| R1-14 | Bajo | `correr.sh` escondía los errores de SQL en la CI | Solo se ocultan los avisos (`PGOPTIONS`) |
| R1-15 | Bajo | `og:image` con ruta relativa | Paso agregado en `docs/DESPLIEGUE.md` (se hace al tener dominio) |
| R1-16 | Sugerencia | Tailwind en `dependencies`; `.gitignore` con restos de la plantilla | Movido a `devDependencies`; `.gitignore` limpio |

### Ronda 2

| # | Gravedad | Hallazgo | Qué se hizo |
|---|---|---|---|
| R2-01 | Medio | **Regresión de R1-11:** el panel se vaciaba en cada refresco y después de cada botón | La lista solo se vacía al cambiar de rango; al refrescar los mismos días se mantiene |
| R2-02 | Bajo | Teléfonos como `--------` pasaban el navegador pero los rechazaba la base | `telefonoValido()`, con la misma regla que la tabla, y pruebas |
| R2-03 | Bajo | El aviso de horas no se borraba al cambiar de fecha | Se borra al cambiar la selección y al reintentar |
| R2-04 | Bajo | Sin barberos activos, "Cargando…" para siempre | Lista vacía = bloque de WhatsApp |
| R2-05 | Bajo | Comentario equivocado en `IconoTijeras` | Corregido |

### Ronda 3

| # | Gravedad | Hallazgo | Qué se hizo |
|---|---|---|---|
| R3-01 | Bajo | "Reintentar" mostraba "No hay horas libres" mientras buscaba | Se limpia la lista antes de reintentar |
| R3-02 | Bajo | El mensaje decía "8 a 16 números" pero la regla cuenta caracteres | El mensaje ya no da una cantidad |

### Cómo se comprobó

- Después de cada ronda: `npm run lint` sin avisos, `npm test` (25 → 29 pruebas) y `npm run build` sin errores.
- `supabase/verificar.sql`: 39/39 en PostgreSQL.
- Pruebas en el navegador (Playwright) de cada arreglo:
  - Supabase caído → bloque de WhatsApp.
  - Teléfono con guion → se guarda como `9 1234 5678`.
  - Nombre vacío y teléfono inválido → mensaje propio.
  - Filtros por categoría.
  - Menú móvil con `inert`.
  - Día cerrado en la demo, leído desde `negocio.apertura`.
  - Al confirmar, la lista del panel no baja de 11 tarjetas.
  - El resumen no cambia al refrescar.

### Lección del ciclo

El arreglo de R1-11 introdujo R2-01, y solo se notó porque el revisor volvió a mirar el código
corregido. Por eso el ciclo no termina con la primera corrección: siempre hay una ronda más
para revisar lo que cambió.

---

## Ronda MVC · 14 de noviembre de 2026 · rama `estructura-mvc`

Revisión de la reestructuración de `src/` en Modelo · Vista · Controlador
([ARQUITECTURA.md](ARQUITECTURA.md)), comparando línea a línea la lógica vieja con la nueva.
**Veredicto: APROBADO, sin regresiones de comportamiento.**

| # | Gravedad | Hallazgo | Qué se hizo |
|---|---|---|---|
| RM-01 | Bajo | El candado "solo vale el aviso más reciente" de /admin quedó un poco más débil al mover el `setTimeout` al modelo | `alCambiarSesion()` ya no entrega avisos pendientes después de dejar de escuchar |
| RM-02 | Bajo | Cuatro textos del formulario seguían escritos en `useReserva` | Movidos a `MENSAJES_FORMULARIO` en `mensajes.ts` |
| RM-03 | Bajo | Comentarios duplicados y líneas en blanco sobrantes del movimiento | Limpiados |
| RM-04 | Bajo | `RANGO_INVALIDO` ahora tiene texto propio ("El rango de fechas es demasiado largo.") en vez del genérico | **Cambio intencional**: todos los códigos de la base tienen su texto. Hoy no se puede ver, porque el panel pide máximo 7 días. |
| RM-05 | Sugerencia | La vista `Admin.tsx` elegía la fuente de datos real | La entrega `useSesionAdmin()`, igual que la demo usa `useFuenteDemo()` |
| RM-06 | Sugerencia | Tipos exportados que nadie usaba fuera de su archivo | Quitado el `export` |
| RM-07 | Sugerencia | Número de comprobaciones en el navegador | La suite de punta a punta sigue siendo de 34 ([PRUEBAS.md](PRUEBAS.md)). En esta ronda se corrió completa, junto con las 14 pruebas de las rondas 1 y 2 (48 en total). |

**Verificación después de la reestructuración:**

- Lint sin avisos, 35 pruebas unitarias y build.
- `verificar.sql` 39/39 y `npm run verificar` todo ✅.
- Las 48 comprobaciones en el navegador, todas ✅.
- Comparación del tamaño publicado (con las variables de Supabase puestas): 531,1 KB → 532,9 KB, menos de 1 KB comprimido.

# Informe de seguridad · ataque simulado

**Fecha:** 14 de noviembre de 2026 · **Rama:** `seguridad`

Se atacó el proyecto como lo haría alguien de afuera, con lo único que cualquiera puede sacar de
la página publicada: la URL de Supabase y la **clave publicable**, que vienen dentro del JavaScript
de la página. También se probó con una cuenta con sesión iniciada que **no** es administradora.

**Resultado:**

| | Base de datos | Página web | Total |
|---|---|---|---|
| Antes (schema + 002) | 30 de 38 ataques bloqueados | 11 de 11 bloqueados | **41 de 49** |
| Después (+ migración 003) | 36 de 38 bloqueados | 11 de 11 bloqueados | **47 de 49** |

Nadie pudo **robar datos de clientes, volverse administrador ni inyectar SQL**. Se encontraron
problemas en la reserva pública: los de contenido malicioso y teléfono quedaron corregidos; el de
los bots necesita un captcha. Está explicado abajo.

El agente `revisor-seguridad` revisó las correcciones en dos rondas y encontró dos errores en
versiones anteriores de la migración, los dos corregidos antes de llegar a Supabase:

- Uno habría roto el panel con reservas antiguas (ver S-01).
- El otro habría hecho que en Supabase la migración se deshiciera completa (ver S-04).

## Cómo se hizo

- **Base de datos:** una copia exacta de la base (`schema.sql` + migraciones) en PostgreSQL, con
  los mismos roles que usa Supabase (`anon`, `authenticated`).
  - Cada ataque corre con el rol del atacante, igual que una petición real a la API.
  - Script: `supabase/pruebas/ataque.py`. Solo corre contra la base de prueba: tiene un freno.
- **Página web:** la página compilada se sirvió con las cabeceras de `vercel.json` y se atacó con
  un navegador real (Chromium + Playwright).
- **Dependencias:** `npm audit`.
- **No se atacó el Supabase real.** Un ataque de prueba no debe tocar datos de verdad, y desde el
  entorno de prueba no hay acceso. Lo que depende de Supabase en sí está en
  [Fuera de alcance](#fuera-de-alcance).

## Resultados por tipo de ataque

| Ataque | Cómo se intentó | Resultado |
|---|---|---|
| **Robar nombres y teléfonos** | `select` a `reservas`, `auth.users` y `administradores`; llamar `admin_reservas` sin ser admin | 🛡️ Bloqueado (6/6): `permission denied` y `NO_AUTORIZADO` |
| **Volverse administrador** | Insertarse en `administradores`, cambiar estados, precios, barberos y horarios, llamar funciones internas | 🛡️ Bloqueado (7/7) |
| **Inyección SQL** | `'); drop table reservas;--` en el nombre, la hora y el id del barbero | 🛡️ Bloqueado (4/4): los parámetros tienen tipo y no hay SQL dinámico |
| **Saltarse las reglas de la reserva** | Pasado, 3 AM, 10:07, domingo, barbero inexistente o desactivado, a 1 año, hora tomada, nombre de 500 caracteres, teléfono con letras | 🛡️ Bloqueado (10/10) |
| **Ataques simultáneos** | 12 reservas a la misma hora en el mismo instante; 9 con el mismo teléfono | 🛡️ Bloqueado: se guardó 1 y 2, como corresponde (`sin_cruces` + `pg_advisory_xact_lock`) |
| **Contenido malicioso en el nombre** | HTML `<img onerror>`, un link de phishing, saltos de línea, caracteres invisibles | ⚠️ **Se guardaba** → ✅ corregido en 003 (S-01) |
| **Saltarse el límite de 2 por teléfono** | `0056 9 …` y `56 09 …` | ⚠️ **Funcionaba** → ✅ corregido en 003 (S-02) |
| **Inundar la agenda con un bot** | 40 reservas con teléfonos inventados | ⚠️ **Funciona**: 30 reservas falsas por hora, y mientras dure el ataque nadie más puede reservar → pendiente (S-03) |
| **XSS en el panel del dueño** | Reservas con `<img onerror=alert(1)>`, `<script>`, `"><svg onload>` y el dueño abre el panel | 🛡️ Bloqueado: React lo muestra como texto, 0 scripts ejecutados |
| **Robar la sesión con un script** | Cargar un script de otro dominio, un `<script>` escrito dentro de la página, mandar datos con `fetch` | 🛡️ Bloqueado por la CSP de `vercel.json` (3/3) |
| **Clickjacking** | Meter `/admin` dentro de un `<iframe>` de otro sitio | 🛡️ Bloqueado (`frame-ancestors 'none'`) |
| **Archivos expuestos** | `/.env`, `/.env.local`, `/.git/config`, `/src/...`, `/supabase/schema.sql` | 🛡️ No existen en lo publicado (5/5) |
| **Secretos en el JavaScript** | Buscar `sb_secret_`, `service_role` y tokens JWT en lo publicado | 🛡️ Ninguno. Solo está la clave publicable, que es pública por diseño |
| **Dependencias vulnerables** | `npm audit` | 🛡️ 0 vulnerabilidades |

## Hallazgos

### S-01 · Medio · El nombre aceptaba links, HTML y mensajes falsos ✅ corregido

**El ataque:**

1. El atacante reserva con el **teléfono de otra persona** (la víctima) y un "nombre" como
   `Paga tu hora aquí: bit.ly/...` o un texto con saltos de línea que parece un aviso del local.
2. El dueño ve la reserva en el panel y aprieta "WhatsApp" para confirmarla.
3. El mensaje que se abre lleva el nombre adentro (`Hola <nombre>, te escribimos de…`), así que
   el dueño le manda, **desde el número del local**, un link de phishing a la víctima.

En el panel el HTML no se ejecutaba, porque React lo escapa, así que no había XSS. El riesgo era el
mensaje.

**La corrección** (migración 003 + página):

- El nombre solo acepta letras latinas (tildes, ñ, ü, ł…), espacios, apóstrofo, guion y punto,
  entre 2 y 60. El punto solo vale seguido de un espacio o al final: "Juan P." pasa y "bit.ly" no.
- Antes de revisarlo se normaliza a NFC, así que "José" escrito con el acento aparte también pasa.
- Se revisa en tres lugares:
  - `nombre_valido()` dentro de `crear_reserva`, que devuelve el error `NOMBRE_INVALIDO`;
  - un trigger que revisa solo las reservas **nuevas**, como segunda capa;
  - `nombreValido()` en la página, para dar un mensaje claro antes de enviar.
- Las reservas que ya existían no se tocan, y el panel puede seguir cambiándoles el estado.

Una primera versión usaba una restricción `CHECK … NOT VALID`. El agente `revisor-seguridad` detectó
que PostgreSQL igual la revisa cada vez que se **actualiza** una fila vieja: el panel no habría
podido confirmar ni cancelar reservas antiguas con nombres como "María José R.". Se cambió por el
trigger y se agregó la prueba "Puede confirmar una reserva vieja con nombre antiguo".

**Lo que no se puede evitar del todo:** una frase de estafa sin link ("Paga aqui en bit ly abc") sigue
siendo un nombre válido. La regla elimina los links clicables y los mensajes con saltos de línea,
pero el dueño debe desconfiar de nombres raros antes de escribirle a alguien.

### S-02 · Bajo · El límite de 2 reservas por teléfono se saltaba ✅ corregido

**El ataque:** después de 2 reservas con `+56 9 7777 1111`, una tercera con `0056 9 7777 1111` o
`56 09 7777 1111` pasaba, porque `normalizar_telefono` las veía como números distintos. El revisor
encontró otras formas (`056 9 …`, `99 1234 5678`), además de números que no son celulares, a los
que WhatsApp no puede escribir.

**La corrección** (en SQL y en `modelos/telefono.ts`, que hacen exactamente lo mismo):

- `normalizar_telefono` toma los últimos 9 dígitos de un celular chileno y acepta los prefijos `56`,
  `0056`, `0`, `560` y `00560`. Todas las formas quedan como `56977771111`.
- `crear_reserva` exige que el resultado sea un celular chileno (`569` + 8 dígitos). Si no, responde
  `TELEFONO_INVALIDO`. Eso cierra cualquier otra forma de escribirlo.
- **Decisión de negocio:** quien tenga un número extranjero no puede reservar en línea. El mensaje
  le sugiere escribir por WhatsApp. WhatsApp necesita un celular de todas formas.

**Lo que sigue posible:** reservar con el teléfono **de otra persona**. Dos reservas falsas con su
número la dejan sin poder reservar (`LIMITE_RESERVAS`) hasta que el dueño las cancele, y el dueño
le escribe a alguien que no pidió nada. No hay forma de comprobar el teléfono sin un código por
SMS o WhatsApp. El captcha de S-03 reduce mucho este abuso.

### S-03 · Medio (Alto con un cliente real) · Un bot puede llenar la agenda ⚠️ pendiente

**El ataque:** un bot reserva con nombres y teléfonos inventados.

- Cada teléfono puede tener 2 reservas, pero el bot inventa uno nuevo cada vez.
- El freno general (30 reservas por hora) lo detiene después de 30, pero desde ese momento
  **también bloquea a los clientes reales** (`DEMASIADAS_RESERVAS`).
- El bot puede repetirlo **cada hora**: unas 720 reservas falsas al día. La agenda de 30 días tiene
  cerca de 1.500 bloques de 30 minutos entre los 3 barberos, y una reserva de 60 minutos ocupa 2.
  En 1 o 2 días la agenda queda llena.
- Mientras dure el ataque, los clientes reales no pueden reservar nunca, no solo durante una hora.
- Las reservas falsas quedan "pendientes" y ocupan sus horas hasta que el dueño las cancele una por
  una, y cancelarlas no baja el contador del freno.

**Por qué no se arregló solo con SQL:**

- La base no puede distinguir a un bot de una persona: los dos llegan con la misma clave publicable.
- Limitar por IP desde PostgreSQL depende de cabeceras que no se pudieron verificar aquí.
- Bajar o quitar el freno general solo cambia qué se rompe primero.

**La corrección recomendada:**

1. Poner **Cloudflare Turnstile** (un captcha gratuito e invisible) en el formulario.
2. Crear una **Supabase Edge Function** que valide el captcha antes de llamar a `crear_reserva`.
3. Quitarle a `anon` el permiso directo sobre `crear_reserva`.

Necesita una cuenta de Cloudflare (gratis) y desplegar la función. Está anotado en
`AGENTS.md → Pendientes`.

**Mientras tanto:** el bot crea a lo más 30 reservas por hora, pero puede seguir hora tras hora.
Para un portafolio el riesgo es aceptable. **Para un cliente real, el captcha es obligatorio antes
de publicar.**

### S-04 · Bajo · La API pública mostraba ~100 funciones internas ✅ corregido en la copia local · en Supabase, riesgo aceptado si no se puede mover

**El problema:** la extensión `btree_gist`, que se usa para la regla `sin_cruces`, estaba en el
esquema `public`. Por eso sus funciones internas (`gbt_int4_compress`, `cash_dist`…) se podían
llamar desde la API.

- Eran inofensivas: cálculos sin datos.
- Pero ampliaban la superficie de ataque, y el "Security Advisor" de Supabase lo marca como
  advertencia.

**La corrección:** la migración 003 mueve la extensión al esquema `extensions`. Ahora el público
solo puede llamar **2 funciones propias**: `horas_disponibles` y `crear_reserva`.

- En Supabase el usuario `postgres` **no es superusuario**. Aunque la extensión figure a su
  nombre, sus funciones internas suelen ser de `supabase_admin`, y PostgreSQL no deja moverla.
- Si pasa, la migración atrapa el error, avisa con un NOTICE ("btree_gist no se pudo mover") y
  **aplica todo lo demás**.
- Se comprobó simulando ese escenario: un usuario sin superusuario y la extensión creada por otro.
  - Las versiones anteriores de 003 fallaban ahí y se deshacían completas.
  - La versión final aplica el nombre, el teléfono y el trigger, y solo deja la extensión donde estaba.
- En ese caso la prueba "btree_gist fuera de public" de `verificar.sql` queda en ❌. Es un **riesgo
  aceptado**: son funciones de cálculo sin acceso a datos. Para moverla habría que pedirlo al
  soporte de Supabase.
- **Nunca** apagar y volver a prender `btree_gist` en Database → Extensions para "arreglarlo": eso
  borra la extensión con todo lo que depende de ella, incluida la regla `sin_cruces`.

## Fuera de alcance

Estas cosas las maneja Supabase y no se pueden probar en una copia local:

| Tema | Estado | Qué hacer |
|---|---|---|
| Fuerza bruta contra el login | Supabase Auth limita los intentos por IP | Usar una contraseña larga y única para la cuenta del dueño |
| Registro de cuentas nuevas | Debe estar apagado | `npm run verificar` lo comprueba contra el Supabase real |
| Tokens (JWT) falsificados | Supabase firma y verifica los tokens | Nunca publicar la clave `sb_secret_…` (la página se niega a arrancar si alguien la pega) |
| Spam de "recuperar contraseña" | Los endpoints `/auth/v1/recover` y `/auth/v1/otp` se pueden llamar directo con la clave publicable, aunque la página no tenga esa opción. Supabase limita cuántos correos manda | Revisar Authentication → Rate Limits |
| `rls_auto_enable` (Supabase) | Si al crear el proyecto se activó "RLS automático", Supabase crea esta función en `public` y, por sus permisos por defecto, `anon` figura con permiso para ejecutarla. No se puede llamar desde la API (es de tipo `event_trigger`) y solo activa RLS. Se encontró en el Supabase real al correr `verificar.sql` | Por orden: `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;` (el RLS automático sigue funcionando) |
| Configuración de Auth | Revisar a mano | Solo el proveedor Email activo; largo mínimo de contraseña de 12 o más; Redirect URLs limitadas al dominio publicado; protección de contraseñas filtradas (es de un plan de pago: si no está disponible, usar una contraseña única) |
| Doble factor (MFA) para el dueño | No activado | Opcional: Supabase permite TOTP (app de autenticación) |

**Riesgo aceptado:** la sesión del dueño se guarda en `localStorage`, que es como lo hace
Supabase. Un XSS podría leerla, pero la CSP bloquea los scripts inyectados (probado arriba) y
React escapa todo lo que viene de la base.

## Cómo repetir las pruebas

```bash
# Seguridad de la base (también corre en la CI en cada Pull Request): 53 pruebas
bash supabase/pruebas/correr.sh

# El ataque completo (SOLO contra la base de prueba; ver instrucciones al inicio del archivo)
python3 supabase/pruebas/ataque.py barberia_ataque

# Contra el Supabase real (solo lee, no cambia nada)
npm run verificar
```

## Cómo aplicar la migración 003 en Supabase

1. **Respaldo:** Table Editor → `reservas` → Export to CSV.
2. **Revisar quién es dueño de `btree_gist`** (SQL Editor):
   `select extowner::regrole, extnamespace::regnamespace from pg_extension where extname = 'btree_gist';`
3. Pegar `supabase/migraciones/003_seguridad.sql` completo en el SQL Editor → **Run**. Se puede volver
   a correr sin problema.
4. Pegar `supabase/verificar.sql` → **Run**, en un horario sin clientes: una prueba bloquea la
   tabla `reservas` unos segundos y crea por un momento una reserva de prueba que después deshace.
   Todo debe salir ✅. Si solo falla "btree_gist fuera de public", es lo esperado en Supabase
   (ver S-04).
5. Probar en `/admin` que puedes confirmar y cancelar una reserva.

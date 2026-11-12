# Publicar la página (Vercel + Supabase)

Pasos para tener un link público de la demo. Los hace el dueño del proyecto, porque necesita las
claves de Supabase y una cuenta de Vercel. Vercel es gratis para proyectos personales.

## 1. Antes de publicar

- [ ] La rama con los cambios ya está unida a `main` en GitHub (Pull Request → Merge).
- [ ] En Supabase ya se corrieron `schema.sql` y `migraciones/002_login_dashboard.sql`.
- [ ] `supabase/verificar.sql` da todo ✅.
- [ ] Borraste las reservas de prueba: `delete from reservas;` en el SQL Editor.

## 2. Crear el proyecto en Vercel

1. Entra a <https://vercel.com> con tu cuenta de GitHub.
2. **Add New… → Project**, elige el repositorio `barberia-mc` y pulsa **Import**.
3. Vercel detecta Vite solo. Deja *Build Command* `npm run build` y *Output Directory* `dist`.
4. Abre **Environment Variables** y agrega estas dos:

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | La misma de tu `.env.local` (`https://xxxx.supabase.co`, sin `/rest/v1/`) |
   | `VITE_SUPABASE_KEY` | La clave **publicable** (`sb_publishable_...`). **Nunca la secreta.** |

5. Pulsa **Deploy**. En uno o dos minutos te da un link del tipo `https://barberia-mc.vercel.app`.

`vercel.json` ya hace que `/admin`, `/admin/demo` y `/privacidad` funcionen al recargar la página,
y agrega las cabeceras de seguridad.

## 3. Avisarle a Supabase el dominio nuevo

En Supabase, ve a **Authentication → URL Configuration**:

- **Site URL**: el link de Vercel (`https://barberia-mc.vercel.app`).
- **Redirect URLs**: ese mismo link y `http://localhost:5173`, para seguir probando en tu computador.

## 4. Comprobar

- [ ] Abre el link y haz una reserva de prueba.
- [ ] Entra a `/admin` con tu cuenta y confirma esa reserva.
- [ ] Abre `/admin/demo`: debe mostrar datos inventados.
- [ ] Borra la reserva de prueba.
- [ ] Pega el link en el README, en la línea "Demo en vivo".

Cada vez que hagas merge a `main`, Vercel vuelve a publicar solo.
Cada Pull Request también recibe un link de vista previa.

## Cosas a saber

- **El plan gratuito de Supabase pausa el proyecto tras 7 días sin actividad.** Si un reclutador
  abre la demo y la reserva da error, es eso. Se reactiva en Supabase → *Restore project*.
  `/admin/demo` funciona siempre, porque no usa Supabase.
- Si agregas un servicio externo (analytics, otro mapa, imágenes de otro dominio), permítelo en
  la `Content-Security-Policy` de `vercel.json`. Si no, el navegador lo bloquea.
- Para un **cliente real**:
  - Quita la ruta `/admin/demo` y el link "Ver demo del panel" del login.
  - Usa datos y fotos reales.
  - Revisa el texto de privacidad.
  - Considera el plan pagado de Supabase y un captcha (ver Pendientes en `AGENTS.md`).

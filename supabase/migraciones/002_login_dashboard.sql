-- =====================================================================
-- Barbería · Etapa 2: login del dueño y panel de reservas
--
-- Se corre UNA vez en Supabase → SQL Editor → Run, sobre una base que
-- ya tiene schema.sql (etapa 1). No borra datos.
--
-- Después de correrlo:
--   1. Authentication → Users → Add user → Create new user
--      (correo y contraseña del dueño, marcar "Auto Confirm User").
--   2. Correr, cambiando el correo:
--        insert into administradores (user_id, nombre)
--        select id, 'Dueño' from auth.users where email = 'correo@del-dueno.cl';
--   3. Authentication → Sign In / Providers → desactivar
--      "Allow new users to sign up" (nadie más puede crearse cuenta)
--      y revisar que "Allow anonymous sign-ins" esté apagado.
--   4. Authentication → URL Configuration → Site URL = el dominio publicado
--      (por ejemplo https://barberia.vercel.app); en Redirect URLs solo ese
--      dominio y http://localhost:5173.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nuevos estados para una reserva
--    atendida   = el cliente vino y se hizo el servicio
--    no_asistio = el cliente no llegó
-- ---------------------------------------------------------------------
alter table reservas drop constraint if exists reservas_estado_check;
alter table reservas add constraint reservas_estado_check
  check (estado in ('pendiente', 'confirmada', 'atendida', 'no_asistio', 'cancelada'));

-- ---------------------------------------------------------------------
-- 2. Quién es administrador
--    auth.users es la tabla de usuarios de Supabase Auth (la maneja Supabase).
--    Aquí solo guardamos qué usuarios de esa tabla son dueños del local.
-- ---------------------------------------------------------------------
create table if not exists administradores (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null default '',
  creado_en  timestamptz not null default now()
);

alter table administradores enable row level security;
revoke all on administradores from anon, authenticated;

-- ¿El usuario que hace la petición es administrador?
-- auth.uid() devuelve el id del usuario con sesión iniciada (o null).
create or replace function es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from administradores where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 3. Reservas de un rango de fechas (solo administradores)
-- ---------------------------------------------------------------------
create or replace function admin_reservas(p_desde date, p_hasta date)
returns table (
  id               uuid,
  inicio           timestamptz,
  fin              timestamptz,
  barbero_id       integer,
  barbero          text,
  servicio_id      integer,
  servicio         text,
  precio           integer,
  cliente_nombre   text,
  cliente_telefono text,
  estado           text,
  creada_en        timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not es_admin() then
    raise exception 'NO_AUTORIZADO' using errcode = '42501';
  end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta - p_desde > 62 then
    raise exception 'RANGO_INVALIDO';
  end if;

  return query
    select r.id, r.inicio, r.fin,
           r.barbero_id, b.nombre,
           r.servicio_id, s.nombre, s.precio,
           r.cliente_nombre, r.cliente_telefono, r.estado, r.creada_en
    from reservas r
    join barberos  b on b.id = r.barbero_id
    join servicios s on s.id = r.servicio_id
    where r.inicio >= (p_desde::timestamp at time zone 'America/Santiago')
      and r.inicio <  ((p_hasta + 1)::timestamp at time zone 'America/Santiago')
    order by r.inicio;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Cambiar el estado de una reserva (solo administradores)
--    Si se reactiva una cancelada cuya hora ya tomó otro cliente,
--    la regla sin_cruces lo impide y se devuelve HORA_NO_DISPONIBLE.
-- ---------------------------------------------------------------------
create or replace function admin_cambiar_estado(p_reserva uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not es_admin() then
    raise exception 'NO_AUTORIZADO' using errcode = '42501';
  end if;
  if p_estado not in ('pendiente', 'confirmada', 'atendida', 'no_asistio', 'cancelada') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  update reservas set estado = p_estado where id = p_reserva;
  if not found then
    raise exception 'RESERVA_NO_EXISTE';
  end if;
exception
  when exclusion_violation then
    raise exception 'HORA_NO_DISPONIBLE';
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Frenos contra abuso de la reserva pública
--    - Solo se puede reservar hasta 30 días hacia adelante.
--    - Máximo 2 reservas a futuro por teléfono.
--    - Máximo 30 reservas nuevas por hora en todo el local (freno para bots).
-- ---------------------------------------------------------------------

-- Deja el teléfono solo con dígitos y con el 56 de Chile:
-- "+56 9 1234 5678", "56912345678" y "9 1234 5678" quedan iguales.
create or replace function normalizar_telefono(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when length(d) = 9 and left(d, 1) = '9' then '56' || d
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x;
$$;

-- horas_disponibles: igual que en schema.sql, más el tope de 30 días
create or replace function horas_disponibles(
  p_barbero  integer,
  p_servicio integer,
  p_fecha    date
)
returns table (hora time)
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select make_interval(mins => duracion_min) as dur
    from servicios
    where id = p_servicio and activo
  ),
  candidatas as (
    select gs::time as hora, s.dur
    from horarios h
    join barberos b on b.id = h.barbero_id and b.activo
    cross join s
    cross join lateral generate_series(
      p_fecha + h.hora_inicio,
      p_fecha + h.hora_fin - s.dur,
      interval '30 minutes'
    ) as gs
    where h.barbero_id = p_barbero
      and h.dia_semana = extract(dow from p_fecha)
      and p_fecha <= (now() at time zone 'America/Santiago')::date + 30
  )
  select c.hora
  from candidatas c
  where ((p_fecha + c.hora) at time zone 'America/Santiago') > now() + interval '30 minutes'
    and not exists (
      select 1
      from reservas r
      where r.barbero_id = p_barbero
        and r.estado <> 'cancelada'
        and tstzrange(r.inicio, r.fin) && tstzrange(
              (p_fecha + c.hora) at time zone 'America/Santiago',
              (p_fecha + c.hora + c.dur) at time zone 'America/Santiago'
            )
    )
  order by c.hora;
$$;
create or replace function crear_reserva(
  p_barbero  integer,
  p_servicio integer,
  p_fecha    date,
  p_hora     time,
  p_nombre   text,
  p_telefono text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inicio   timestamptz;
  v_dur      interval;
  v_id       uuid;
  v_telefono text := normalizar_telefono(p_telefono);
begin
  if p_fecha > (now() at time zone 'America/Santiago')::date + 30 then
    raise exception 'FECHA_FUERA_DE_RANGO';
  end if;

  if not exists (
    select 1 from horas_disponibles(p_barbero, p_servicio, p_fecha) h where h.hora = p_hora
  ) then
    raise exception 'HORA_NO_DISPONIBLE';
  end if;

  -- Freno para bots: demasiadas reservas nuevas en la última hora
  if (select count(*) from reservas where creada_en > now() - interval '1 hour') >= 30 then
    raise exception 'DEMASIADAS_RESERVAS';
  end if;

  -- Si llegan dos reservas con el mismo teléfono al mismo tiempo, la segunda espera
  -- a que termine la primera (así no se saltan el límite). Función de PostgreSQL.
  perform pg_advisory_xact_lock(hashtext(v_telefono));

  if (
    select count(*) from reservas r
    where normalizar_telefono(r.cliente_telefono) = v_telefono
      and r.estado in ('pendiente', 'confirmada')
      and r.inicio > now()
  ) >= 2 then
    raise exception 'LIMITE_RESERVAS';
  end if;

  select make_interval(mins => duracion_min) into v_dur from servicios where id = p_servicio;
  v_inicio := (p_fecha + p_hora) at time zone 'America/Santiago';

  insert into reservas (barbero_id, servicio_id, inicio, fin, cliente_nombre, cliente_telefono)
  values (p_barbero, p_servicio, v_inicio, v_inicio + v_dur, trim(p_nombre), trim(p_telefono))
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'HORA_NO_DISPONIBLE';
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Permisos: las funciones de administrador solo para usuarios con sesión
--    (y adentro se revisa además que sean administradores).
--    Supabase da permiso a anon sobre funciones nuevas por su cuenta,
--    por eso se le quita de forma explícita.
-- ---------------------------------------------------------------------
revoke all on function normalizar_telefono(text) from public, anon, authenticated;
revoke all on function es_admin() from public, anon;
revoke all on function admin_reservas(date, date) from public, anon;
revoke all on function admin_cambiar_estado(uuid, text) from public, anon;
revoke all on function crear_reserva(integer, integer, date, time, text, text) from public;

grant execute on function es_admin() to authenticated;
grant execute on function admin_reservas(date, date) to authenticated;
grant execute on function admin_cambiar_estado(uuid, text) to authenticated;
grant execute on function crear_reserva(integer, integer, date, time, text, text) to anon, authenticated;

-- El público solo puede LEER barberos y servicios (Supabase da más permisos por defecto;
-- hoy RLS ya los bloquea, esto es una segunda capa por si alguien agrega una política amplia)
revoke insert, update, delete, truncate on barberos, servicios from anon, authenticated;

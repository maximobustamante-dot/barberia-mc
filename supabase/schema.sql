-- =====================================================================
-- Barbería · Etapa 1: reservas sin cuenta
-- Pegar completo en Supabase → SQL Editor → Run (una sola vez).
-- =====================================================================

-- Necesaria para impedir que dos reservas del mismo barbero se crucen
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table barberos (
  id            serial primary key,
  nombre        text not null,
  especialidad  text not null default '',
  activo        boolean not null default true
);

create table servicios (
  id            serial primary key,
  nombre        text not null,
  descripcion   text not null default '',
  precio        integer not null check (precio >= 0),          -- en pesos chilenos
  duracion_min  integer not null check (duracion_min between 5 and 240),
  activo        boolean not null default true
);

-- Horario de trabajo de cada barbero por día de la semana
-- dia_semana: 0 = domingo, 1 = lunes, ..., 6 = sábado
create table horarios (
  id            serial primary key,
  barbero_id    integer not null references barberos(id) on delete cascade,
  dia_semana    smallint not null check (dia_semana between 0 and 6),
  hora_inicio   time not null,
  hora_fin      time not null,
  check (hora_fin > hora_inicio)
);

create table reservas (
  id                uuid primary key default gen_random_uuid(),
  barbero_id        integer not null references barberos(id),
  servicio_id       integer not null references servicios(id),
  inicio            timestamptz not null,
  fin               timestamptz not null,
  cliente_nombre    text not null check (char_length(cliente_nombre) between 2 and 80),
  cliente_telefono  text not null check (cliente_telefono ~ '^\+?[0-9 ]{8,16}$'),
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'confirmada', 'cancelada')),
  creada_en         timestamptz not null default now(),
  check (fin > inicio),
  -- Un barbero no puede tener dos reservas activas que se crucen en el tiempo
  constraint sin_cruces exclude using gist (
    barbero_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado <> 'cancelada')
);

-- ---------------------------------------------------------------------
-- Seguridad (Row Level Security)
-- El público puede VER barberos y servicios activos.
-- Nadie del público puede leer ni escribir reservas directamente:
-- solo a través de las dos funciones de abajo.
-- ---------------------------------------------------------------------
alter table barberos  enable row level security;
alter table servicios enable row level security;
alter table horarios  enable row level security;
alter table reservas  enable row level security;

create policy "barberos visibles" on barberos  for select using (activo);
create policy "servicios visibles" on servicios for select using (activo);

revoke all on horarios, reservas from anon, authenticated;

-- ---------------------------------------------------------------------
-- Horas disponibles de un barbero para un servicio en una fecha
-- (bloques cada 30 minutos, hora de Chile, desde 30 min en adelante)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- Crear una reserva (valida que la hora siga libre)
-- Errores que devuelve: HORA_NO_DISPONIBLE
-- ---------------------------------------------------------------------
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
  v_inicio timestamptz;
  v_dur    interval;
  v_id     uuid;
begin
  if not exists (
    select 1 from horas_disponibles(p_barbero, p_servicio, p_fecha) h where h.hora = p_hora
  ) then
    raise exception 'HORA_NO_DISPONIBLE';
  end if;

  select make_interval(mins => duracion_min) into v_dur from servicios where id = p_servicio;
  v_inicio := (p_fecha + p_hora) at time zone 'America/Santiago';

  insert into reservas (barbero_id, servicio_id, inicio, fin, cliente_nombre, cliente_telefono)
  values (p_barbero, p_servicio, v_inicio, v_inicio + v_dur, trim(p_nombre), trim(p_telefono))
  returning id into v_id;

  return v_id;
exception
  -- Dos personas reservaron la misma hora al mismo tiempo
  when exclusion_violation then
    raise exception 'HORA_NO_DISPONIBLE';
end;
$$;

revoke all on function horas_disponibles(integer, integer, date) from public;
revoke all on function crear_reserva(integer, integer, date, time, text, text) from public;
grant execute on function horas_disponibles(integer, integer, date) to anon, authenticated;
grant execute on function crear_reserva(integer, integer, date, time, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Datos de ejemplo (los mismos de src/data/)
-- ---------------------------------------------------------------------
insert into barberos (nombre, especialidad) values
  ('Matías', 'Fade y diseños'),
  ('Javier', 'Cortes clásicos'),
  ('Diego',  'Barba y navaja');

insert into servicios (nombre, descripcion, precio, duracion_min) values
  ('Corte clásico',  'Tijera y máquina, lavado incluido.', 12000, 40),
  ('Fade',           'Degradado con terminación a navaja.', 14000, 45),
  ('Barba',          'Perfilado con toalla caliente.',       8000, 25),
  ('Corte + barba',  'El servicio completo.',               18000, 60),
  ('Corte infantil', 'Hasta 12 años.',                      10000, 30),
  ('Diseño de cejas','Limpieza y perfilado a navaja.',       5000, 15);

-- Lunes a viernes 10:00–20:00 y sábado 10:00–18:00 para los tres barberos
insert into horarios (barbero_id, dia_semana, hora_inicio, hora_fin)
select b.id, d, time '10:00', time '20:00' from barberos b, generate_series(1, 5) d
union all
select b.id, 6, time '10:00', time '18:00' from barberos b;

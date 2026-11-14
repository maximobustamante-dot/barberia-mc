-- =====================================================================
-- Barbería · Migración 003: arreglos del ataque simulado (docs/SEGURIDAD.md)
--
-- Correr UNA vez en Supabase → SQL Editor, después de 002. No borra ni cambia datos.
-- Se puede volver a correr sin problema. Después correr supabase/verificar.sql.
--
-- ANTES DE CORRERLA:
--   1. Respaldo: Table Editor → reservas → Export to CSV (o Database → Backups).
--   2. Revisar quién es dueño de btree_gist (paso 4):
--        select extowner::regrole, extnamespace::regnamespace from pg_extension where extname = 'btree_gist';
--      Si el dueño no es postgres, el paso 4 se salta solo y avisa con un NOTICE.
--      NUNCA apagar y volver a prender btree_gist en Database → Extensions: eso borra
--      la regla sin_cruces (la que impide reservas cruzadas).
--
-- Qué arregla:
--   1. El nombre de la reserva aceptaba links, HTML y saltos de línea. Un atacante podía
--      reservar con el teléfono de otra persona y un "nombre" como "Paga aquí: bit.ly/...":
--      el dueño, al apretar WhatsApp en el panel, le mandaba ese texto desde el número del local.
--   2. El teléfono: el límite de 2 reservas se saltaba escribiendo 0056 9… o 56 09…, y se
--      aceptaban números que no son celulares (WhatsApp no los abre). Ahora debe ser un
--      celular chileno: TELEFONO_INVALIDO si no.
--   3. La extensión btree_gist estaba en el esquema public, así que sus ~100 funciones internas
--      aparecían en la API pública. Se mueve al esquema extensions (recomendación de Supabase).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Nombre seguro: letras (con tildes y ñ), espacios, apóstrofo y guion. Entre 2 y 60.
-- ---------------------------------------------------------------------
create or replace function nombre_valido(p text)
returns boolean
language sql
immutable
set search_path = public
as $$
  -- normalize(…, NFC): "é" escrita como e + tilde aparte (algunos teclados) queda como una sola letra.
  -- Letras latinas (tildes, ñ, ü, ł…), espacios, apóstrofo, guion y punto.
  -- El punto solo si va seguido de un espacio o al final ("Juan P.", no "bit.ly").
  select n ~ '^[A-Za-zÀ-ÖØ-öø-ÿĀ-ſ][A-Za-zÀ-ÖØ-öø-ÿĀ-ſ'' .-]{1,59}$'
     and n !~ '\.[^ ]'
  from (select trim(normalize(coalesce(p, ''), NFC)) as n) x;
$$;
-- Nadie del público la llama directo. crear_reserva y el trigger de abajo son security definer
-- (corren como postgres), así que no hace falta dar permiso sobre ella a nadie más.
revoke all on function nombre_valido(text) from public, anon, authenticated;

-- Segunda capa en la tabla: un trigger que revisa SOLO las reservas nuevas (INSERT).
-- (Una restricción CHECK también revisaría las reservas viejas cada vez que el panel les
-- cambia el estado, y fallaría con nombres antiguos como "María José R.".)
create or replace function revisar_nombre_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not nombre_valido(new.cliente_nombre) then
    raise exception 'NOMBRE_INVALIDO';
  end if;
  return new;
end;
$$;
revoke all on function revisar_nombre_reserva() from public, anon, authenticated;

alter table reservas drop constraint if exists nombre_seguro; -- por si se corrió una versión anterior de 003
drop trigger if exists nombre_seguro on reservas;
create trigger nombre_seguro before insert on reservas
  for each row execute function revisar_nombre_reserva();

-- ---------------------------------------------------------------------
-- 2. Teléfono: todas las formas de escribir el mismo celular chileno cuentan como uno.
--    +56 9 1234 5678 · 56912345678 · 912345678 · 0056 9 1234 5678 · 56 09 1234 5678
--    Y crear_reserva exige que el resultado sea un celular chileno (56 9 + 8 dígitos).
-- ---------------------------------------------------------------------
create or replace function normalizar_telefono(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    -- últimos 9 dígitos = celular chileno (parte con 9) y lo de adelante es un prefijo de Chile
    when length(d) >= 9 and right(d, 9) like '9%'
         and left(d, length(d) - 9) in ('', '0', '56', '560', '0056', '00560')
      then '56' || right(d, 9)
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x;
$$;
revoke all on function normalizar_telefono(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. crear_reserva: igual que en 002, más la revisión del nombre y del teléfono
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
  v_inicio   timestamptz;
  v_dur      interval;
  v_id       uuid;
  v_telefono text := normalizar_telefono(p_telefono);
begin
  -- NUEVO en 003: el nombre no puede traer links, HTML, números ni saltos de línea
  if not nombre_valido(p_nombre) then
    raise exception 'NOMBRE_INVALIDO';
  end if;

  -- NUEVO en 003: solo celulares chilenos (así el límite por teléfono no se salta y wa.me abre bien)
  if v_telefono !~ '^569[0-9]{8}$' then
    raise exception 'TELEFONO_INVALIDO';
  end if;

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
  values (p_barbero, p_servicio, v_inicio, v_inicio + v_dur, trim(normalize(p_nombre, NFC)), trim(p_telefono))
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'HORA_NO_DISPONIBLE';
end;
$$;

revoke all on function crear_reserva(integer, integer, date, time, text, text) from public;
grant execute on function crear_reserva(integer, integer, date, time, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. btree_gist fuera de public (la regla sin_cruces sigue funcionando igual)
-- ---------------------------------------------------------------------
do $$
declare
  v_dueno regrole;
  v_esquema regnamespace;
begin
  select extowner::regrole, extnamespace::regnamespace into v_dueno, v_esquema
  from pg_extension where extname = 'btree_gist';

  if v_esquema is distinct from 'public'::regnamespace then
    return; -- ya está fuera de public (o no existe)
  end if;

  -- En Supabase 'postgres' no es superusuario: aunque la extensión figure a su nombre, sus
  -- funciones internas pueden ser de supabase_admin y PostgreSQL no deja moverla. Si pasa,
  -- este sub-bloque atrapa el error, avisa y el resto de la migración queda aplicado igual.
  begin
    create schema if not exists extensions;
    alter extension btree_gist set schema extensions;
  exception when insufficient_privilege then
    raise notice 'btree_gist no se pudo mover (dueño: %, usuario: %): %. Todo lo demás quedó aplicado. Ver docs/SEGURIDAD.md (S-04).',
      v_dueno, current_user, sqlerrm;
  end;
end $$;

commit;

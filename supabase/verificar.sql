-- =====================================================================
-- Barbería · Verificación de la base de datos
--
-- Pegar completo en Supabase → SQL Editor → Run. Se puede correr las veces
-- que quieras: NO deja datos guardados (las reservas de prueba se deshacen
-- al final) y no cambia ninguna configuración.
--
-- Prueba la base tal como la ve cada tipo de visitante:
--   anon     = cualquier persona en la página, sin sesión (clave publicable)
--   usuario  = alguien con sesión iniciada que NO es administrador
--   admin    = un usuario de la tabla administradores
--   base     = revisiones de estructura (como el dueño de la base)
--
-- Resultado: una tabla con ✅ / ❌ por prueba. Todo debería salir ✅.
-- Requisitos: schema.sql + migraciones/002 corridos y al menos un administrador.
-- =====================================================================

drop table if exists pg_temp.verificacion;
create temp table verificacion (n int, grupo text, prueba text, ok boolean, detalle text);

do $$
declare
  v_admin    uuid := (select user_id from administradores order by creado_en limit 1);
  v_extrano  uuid := '00000000-0000-4000-8000-000000000000'; -- usuario con sesión que no es admin
  v_fecha    date;  -- día hábil de prueba (pasado mañana o después)
  v_h1       time;
  v_h2       time;
  v_h3       time;
  v_lejos    date := (now() at time zone 'America/Santiago')::date + 40;
  pruebas    jsonb := '[]';
  resultados jsonb := '[]';
  t          jsonb;
  v          text;
  ok         boolean;
  detalle    text;
  i          int := 0;
begin
  -- Día de prueba: el primer lunes a viernes desde pasado mañana
  select d::date into v_fecha
  from generate_series((now() at time zone 'America/Santiago')::date + 2,
                       (now() at time zone 'America/Santiago')::date + 9, interval '1 day') d
  where extract(isodow from d) between 1 and 5
  limit 1;

  -- Horas libres para las reservas de prueba (servicio 3 = Barba, 25 min)
  select hora into v_h1 from horas_disponibles(1, 3, v_fecha) order by hora limit 1;
  select hora into v_h2 from horas_disponibles(1, 3, v_fecha) order by hora offset 4 limit 1;
  select hora into v_h3 from horas_disponibles(2, 3, v_fecha) order by hora limit 1;

  -- -------------------------------------------------------------------
  -- Lista de pruebas: grupo, descripción, rol, consulta y resultado esperado.
  -- esperado: OK (sin error) · VERDADERO · un código de error (NO_AUTORIZADO…)
  --           SIN_PERMISO = PostgreSQL rechaza por falta de permisos (42501)
  -- -------------------------------------------------------------------
  pruebas := jsonb_build_array(
    -- 1. Estructura
    jsonb_build_array('Estructura', 'Migración 002 aplicada (estados atendida / no_asistio)', 'base',
      $q$select pg_get_constraintdef(oid) like '%atendida%' from pg_constraint where conname = 'reservas_estado_check'$q$, 'VERDADERO'),
    jsonb_build_array('Estructura', 'RLS activado en las 5 tablas', 'base',
      $q$select count(*) = 5 from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity
         and relname in ('barberos','servicios','horarios','reservas','administradores')$q$, 'VERDADERO'),
    jsonb_build_array('Estructura', 'Regla sin_cruces (sin reservas cruzadas) existe', 'base',
      $q$select exists (select 1 from pg_constraint where conname = 'sin_cruces')$q$, 'VERDADERO'),
    jsonb_build_array('Estructura', 'Funciones security definer con search_path fijo', 'base',
      $q$select count(*) = 5 from pg_proc where pronamespace = 'public'::regnamespace and prosecdef
         and proconfig::text like '%search_path=public%'
         and proname in ('horas_disponibles','crear_reserva','es_admin','admin_reservas','admin_cambiar_estado')$q$, 'VERDADERO'),
    jsonb_build_array('Estructura', 'Hay al menos un administrador', 'base',
      $q$select exists (select 1 from administradores)$q$, 'VERDADERO'),
    jsonb_build_array('Estructura', 'Todo usuario de Auth es administrador (nadie extra se registró)', 'base',
      $q$select not exists (select 1 from auth.users u where not exists (select 1 from administradores a where a.user_id = u.id))$q$, 'VERDADERO'),

    -- 2. Público sin sesión (lo que puede hacer cualquiera con la clave publicable)
    jsonb_build_array('Público', 'Puede ver servicios', 'anon', 'select count(*) > 0 from servicios', 'VERDADERO'),
    jsonb_build_array('Público', 'Puede ver barberos', 'anon', 'select count(*) > 0 from barberos', 'VERDADERO'),
    jsonb_build_array('Público', 'Puede consultar horas disponibles', 'anon',
      format('select count(*) > 0 from horas_disponibles(1, 3, %L)', v_fecha), 'VERDADERO'),
    jsonb_build_array('Público', 'NO puede leer reservas', 'anon', 'select count(*) from reservas', 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede leer horarios', 'anon', 'select count(*) from horarios', 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede leer administradores', 'anon', 'select count(*) from administradores', 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede escribir reservas directo', 'anon',
      $q$insert into reservas (barbero_id, servicio_id, inicio, fin, cliente_nombre, cliente_telefono)
         values (1, 1, now() + interval '3 days', now() + interval '3 days 1 hour', 'Intruso', '+56900000000') returning 'insertó'$q$, 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede cambiar precios', 'anon', 'update servicios set precio = 1 returning ''cambió''', 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede agregar barberos', 'anon', $q$insert into barberos (nombre) values ('Falso') returning 'insertó'$q$, 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede usar es_admin()', 'anon', 'select es_admin()', 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede usar admin_reservas()', 'anon',
      'select count(*) from admin_reservas(current_date, current_date)', 'SIN_PERMISO'),
    jsonb_build_array('Público', 'NO puede usar admin_cambiar_estado()', 'anon',
      $q$select admin_cambiar_estado(gen_random_uuid(), 'cancelada')$q$, 'SIN_PERMISO'),

    -- 3. Usuario con sesión que no es administrador
    jsonb_build_array('Usuario sin permiso', 'es_admin() responde falso', 'usuario', 'select es_admin()', 'FALSO'),
    jsonb_build_array('Usuario sin permiso', 'NO puede ver reservas del panel', 'usuario',
      'select count(*) from admin_reservas(current_date, current_date)', 'NO_AUTORIZADO'),
    jsonb_build_array('Usuario sin permiso', 'NO puede cambiar estados', 'usuario',
      $q$select admin_cambiar_estado(gen_random_uuid(), 'cancelada')$q$, 'NO_AUTORIZADO'),
    jsonb_build_array('Usuario sin permiso', 'NO puede leer reservas directo', 'usuario', 'select count(*) from reservas', 'SIN_PERMISO'),
    jsonb_build_array('Usuario sin permiso', 'NO puede leer administradores', 'usuario', 'select count(*) from administradores', 'SIN_PERMISO'),

    -- 4. Reserva pública: reglas y frenos (estas reservas se deshacen al final)
    jsonb_build_array('Reserva pública', format('Reserva válida (%s %s, Matías)', v_fecha, v_h1), 'anon',
      format($q$select crear_reserva(1, 3, %L, %L, 'Prueba Verificación', '+56 9 0000 0001')$q$, v_fecha, v_h1), 'OK'),
    jsonb_build_array('Reserva pública', 'La hora tomada desaparece de las disponibles', 'anon',
      format('select not exists (select 1 from horas_disponibles(1, 3, %L) where hora = %L)', v_fecha, v_h1), 'VERDADERO'),
    jsonb_build_array('Reserva pública', 'Misma hora, otro cliente → rechazada', 'anon',
      format($q$select crear_reserva(1, 3, %L, %L, 'Otra Persona', '+56 9 0000 0002')$q$, v_fecha, v_h1), 'HORA_NO_DISPONIBLE'),
    jsonb_build_array('Reserva pública', 'Segunda reserva del mismo teléfono (otro formato) → permitida', 'anon',
      format($q$select crear_reserva(1, 3, %L, %L, 'Prueba Verificación', '56900000001')$q$, v_fecha, v_h2), 'OK'),
    jsonb_build_array('Reserva pública', 'Tercera reserva del mismo teléfono → rechazada', 'anon',
      format($q$select crear_reserva(2, 3, %L, %L, 'Prueba Verificación', '9 0000 0001')$q$, v_fecha, v_h3), 'LIMITE_RESERVAS'),
    jsonb_build_array('Reserva pública', 'Más de 30 días adelante → rechazada', 'anon',
      format($q$select crear_reserva(1, 3, %L, '10:00', 'Prueba Verificación', '+56 9 0000 0003')$q$, v_lejos), 'FECHA_FUERA_DE_RANGO'),

    -- 5. Administrador
    jsonb_build_array('Administrador', 'es_admin() responde verdadero', 'admin', 'select es_admin()', 'VERDADERO'),
    jsonb_build_array('Administrador', 'Ve las reservas de prueba en el panel', 'admin',
      format($q$select count(*) = 2 from admin_reservas(%L, %L) where cliente_nombre = 'Prueba Verificación'$q$, v_fecha, v_fecha), 'VERDADERO'),
    jsonb_build_array('Administrador', 'Puede confirmar una reserva', 'admin',
      format($q$select admin_cambiar_estado((select id from admin_reservas(%L, %L)
               where cliente_nombre = 'Prueba Verificación' order by inicio limit 1), 'confirmada')$q$, v_fecha, v_fecha), 'OK'),
    jsonb_build_array('Administrador', 'El cambio quedó guardado', 'admin',
      format($q$select exists (select 1 from admin_reservas(%L, %L)
               where cliente_nombre = 'Prueba Verificación' and estado = 'confirmada')$q$, v_fecha, v_fecha), 'VERDADERO'),
    jsonb_build_array('Administrador', 'Estado inventado → rechazado', 'admin',
      $q$select admin_cambiar_estado(gen_random_uuid(), 'pagada')$q$, 'ESTADO_INVALIDO'),
    jsonb_build_array('Administrador', 'Reserva que no existe → error claro', 'admin',
      $q$select admin_cambiar_estado(gen_random_uuid(), 'cancelada')$q$, 'RESERVA_NO_EXISTE'),
    jsonb_build_array('Administrador', 'Rango de más de 62 días → rechazado', 'admin',
      'select count(*) from admin_reservas(current_date, current_date + 100)', 'RANGO_INVALIDO'),
    jsonb_build_array('Administrador', 'Aun siendo admin, NO lee la tabla reservas directo', 'admin',
      'select count(*) from reservas', 'SIN_PERMISO'),

    -- 6. Freno para bots: se simulan 30 reservas recientes y se intenta una más
    jsonb_build_array('Reserva pública', '(preparación) 30 reservas en la última hora', 'base',
      $q$insert into reservas (barbero_id, servicio_id, inicio, fin, cliente_nombre, cliente_telefono, estado)
         select 3, 3, now() - interval '400 days' + g * interval '1 hour', now() - interval '400 days' + g * interval '1 hour' + interval '25 minutes',
                'Bot de prueba', '+56 9 1111 ' || lpad(g::text, 4, '0'), 'cancelada'
         from generate_series(1, 30) g
         returning 'ok'$q$, 'OK'),
    jsonb_build_array('Reserva pública', 'Reserva número 31 en una hora → rechazada', 'anon',
      format($q$select crear_reserva(2, 3, %L, %L, 'Bot de prueba', '+56 9 2222 0000')$q$, v_fecha, v_h3), 'DEMASIADAS_RESERVAS')
  );

  -- -------------------------------------------------------------------
  -- Correr cada prueba con el rol que corresponde
  -- -------------------------------------------------------------------
  begin
    for t in select value from jsonb_array_elements(pruebas) loop
      i := i + 1;
      v := null;

      -- Cambiar de rol como lo haría Supabase según quién hace la petición
      if t->>2 = 'base' then
        reset role;
        perform set_config('request.jwt.claims', '', true);
      elsif t->>2 = 'anon' then
        set local role anon;
        perform set_config('request.jwt.claims', '{"role":"anon"}', true);
      else
        set local role authenticated;
        perform set_config('request.jwt.claims',
          json_build_object('role', 'authenticated',
                            'sub', case when t->>2 = 'admin' then v_admin else v_extrano end)::text, true);
      end if;

      begin
        execute t->>3 into v;
        ok := case t->>4
                when 'OK' then true
                when 'VERDADERO' then v = 'true'
                when 'FALSO' then v = 'false'
                else false
              end;
        detalle := case when ok then coalesce('respuesta: ' || v, 'sin error')
                        else format('se esperaba %s, respondió %s', t->>4, coalesce(v, 'nada')) end;
      exception when others then
        ok := case t->>4
                when 'SIN_PERMISO' then sqlstate = '42501' and sqlerrm like 'permission denied%'
                else sqlerrm = t->>4
              end;
        detalle := case when ok then 'rechazado: ' || sqlerrm
                        else format('se esperaba %s, error: %s', t->>4, sqlerrm) end;
      end;

      resultados := resultados || jsonb_build_array(jsonb_build_object(
        'n', i, 'grupo', t->>0, 'prueba', t->>1, 'ok', ok, 'detalle', detalle));
    end loop;

    -- Deshacer todo lo que crearon las pruebas (las reservas de prueba no quedan guardadas)
    raise exception 'DESHACER_PRUEBAS';
  exception when others then
    if sqlerrm <> 'DESHACER_PRUEBAS' then
      raise;
    end if;
  end;

  reset role;
  perform set_config('request.jwt.claims', '', true);

  if v_admin is null then
    resultados := resultados || '[{"n":0,"grupo":"Aviso","prueba":"No hay administradores: las pruebas de Administrador fallan por eso","ok":false,"detalle":"Corre el insert into administradores"}]';
  end if;
  if v_h1 is null or v_h2 is null or v_h3 is null then
    resultados := resultados || '[{"n":0,"grupo":"Aviso","prueba":"No hubo horas libres para las reservas de prueba","ok":false,"detalle":"Revisa la tabla horarios"}]';
  end if;

  insert into verificacion
  select (r->>'n')::int, r->>'grupo', r->>'prueba', (r->>'ok')::boolean, r->>'detalle'
  from jsonb_array_elements(resultados) r;
end;
$$;

-- Resultado: todo debería salir ✅
select n,
       grupo,
       prueba,
       case when ok then '✅' else '❌' end as resultado,
       detalle
from verificacion
order by ok, n;

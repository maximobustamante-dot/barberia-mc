-- =====================================================================
-- SOLO PARA PRUEBAS AUTOMÁTICAS (GitHub Actions o un PostgreSQL local).
-- NO correr en Supabase: allá todo esto ya existe.
--
-- Imita lo mínimo que Supabase trae de fábrica para poder correr
-- schema.sql, las migraciones y verificar.sql en un PostgreSQL normal:
-- los roles anon / authenticated, la tabla auth.users y auth.uid().
-- =====================================================================
do $$
begin
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
exception when duplicate_object then null;
end $$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);

-- Igual que en Supabase: el id del usuario sale del token (JWT) de la petición
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
         (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;

-- Un dueño de prueba
insert into auth.users (id, email) values ('11111111-1111-4111-8111-111111111111', 'dueno@prueba.cl');

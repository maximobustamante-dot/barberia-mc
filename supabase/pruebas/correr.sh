#!/usr/bin/env bash
# Arma una base de prueba desde cero y corre verificar.sql.
# Uso: supabase/pruebas/correr.sh   (necesita psql y las variables PGHOST, PGUSER, etc.)
set -euo pipefail
cd "$(dirname "$0")/.."

BASE=${BASE_PRUEBA:-barberia_prueba}
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $BASE" -c "create database $BASE"

correr() { psql -v ON_ERROR_STOP=1 -q -d "$BASE" "$@"; }
correr -f pruebas/emular-supabase.sql
correr -f schema.sql
for m in migraciones/*.sql; do correr -f "$m"; done
correr -c "insert into administradores (user_id, nombre) select id, 'Dueño' from auth.users where email = 'dueno@prueba.cl'"

resultado=$(correr -f verificar.sql 2>/dev/null)
echo "$resultado"
if grep -q '❌' <<< "$resultado"; then
  echo "Hay pruebas que fallaron" >&2
  exit 1
fi
echo "Todas las pruebas de la base pasaron"

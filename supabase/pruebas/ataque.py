#!/usr/bin/env python3
"""Ataque simulado a la base de datos de la barbería. Resultados en docs/SEGURIDAD.md.

Cada intento corre con el rol que tendría el atacante en Supabase:
  anon    = cualquiera con la clave publicable (está en el código de la página)
  intruso = alguien con sesión iniciada que no es administrador

SOLO contra la base de prueba que arma supabase/pruebas/correr.sh (crea y BORRA reservas).
Nunca contra el Supabase real. Uso, con PGHOST/PGPORT/PGUSER apuntando al PostgreSQL de prueba:
  BASE_PRUEBA=barberia_ataque bash supabase/pruebas/correr.sh
  psql -d barberia_ataque -c "insert into auth.users (id, email) values ('22222222-2222-4222-8222-222222222222', 'intruso@prueba.cl')"
  python3 supabase/pruebas/ataque.py barberia_ataque
"""
import subprocess, sys, json, datetime, concurrent.futures as cf

BASE = sys.argv[1] if len(sys.argv) > 1 else 'ataque'
PSQL = ['psql', '-d', BASE, '-At', '-v', 'ON_ERROR_STOP=1', '-q']  # host, puerto y usuario salen de PGHOST, PGPORT, PGUSER
INTRUSO = '22222222-2222-4222-8222-222222222222'
CLAIMS = {
    'anon': ('anon', '{"role":"anon"}'),
    'intruso': ('authenticated', json.dumps({'role': 'authenticated', 'sub': INTRUSO})),
    'base': (None, ''),
}

def sql(rol, consulta):
    r, claims = CLAIMS[rol]
    pre = f"set local role {r}; select set_config('request.jwt.claims', '{claims}', true);" if r else ''
    p = subprocess.run(PSQL + ['-c', f'begin; {pre} {consulta}; commit;'], capture_output=True, text=True)
    out = [l for l in p.stdout.strip().splitlines() if l and l != '' and l != 'BEGIN' and l != 'COMMIT']
    if p.returncode != 0:
        err = p.stderr.strip().splitlines()[0].replace('ERROR:  ', '')
        return False, err
    return True, out[-1] if out else ''

# Freno: si no es la base de prueba (con el dueño de prueba de emular-supabase.sql), no se ataca
if sql('base', "select count(*) from auth.users where email = 'dueno@prueba.cl'")[1] != '1':
    sys.exit('Esta no parece la base de prueba (falta dueno@prueba.cl). No se ataca.')

resultados = []
def intento(grupo, ataque, rol, consulta, bloqueado_si, nota=''):
    ok, salida = sql(rol, consulta)
    bloqueado = bloqueado_si(ok, salida)
    resultados.append((grupo, ataque, bloqueado, salida[:110], nota))
    print(f"{'🛡️  BLOQUEADO' if bloqueado else '⚠️  LOGRADO  '} [{grupo}] {ataque}  →  {salida[:100]}")
    return ok, salida

falla = lambda ok, s: not ok
error = lambda codigo: (lambda ok, s: (not ok) and codigo in s)

# Día hábil de prueba y horas libres
hoy = datetime.date.today()
dia = hoy + datetime.timedelta(days=3)
while dia.weekday() > 4:
    dia += datetime.timedelta(days=1)
horas = sql('anon', f"select string_agg(hora::text, ',') from horas_disponibles(1, 3, '{dia}')")[1].split(',')
domingo = hoy + datetime.timedelta(days=(6 - hoy.weekday()) % 7 or 7)
print(f'Día de prueba {dia} · horas libres Matías: {len(horas)}\n')

def reservar(b, s, f, h, nombre, tel):
    n = nombre.replace("'", "''")
    return f"select crear_reserva({b}, {s}, '{f}', '{h}', '{n}', '{tel}')"

G = '1. Robar datos'
intento(G, 'Leer todas las reservas (nombres y teléfonos)', 'anon', 'select count(*) from reservas', falla)
intento(G, 'Leer reservas con sesión de un usuario cualquiera', 'intruso', 'select count(*) from reservas', falla)
intento(G, 'Leer usuarios de Auth (correos)', 'anon', 'select count(*) from auth.users', falla)
intento(G, 'Leer quién es administrador', 'anon', 'select count(*) from administradores', falla)
intento(G, 'Ver el panel sin ser admin (admin_reservas)', 'intruso', 'select count(*) from admin_reservas(current_date, current_date + 30)', error('NO_AUTORIZADO'))
intento(G, 'Ver el panel sin sesión', 'anon', 'select count(*) from admin_reservas(current_date, current_date + 30)', falla)

G = '2. Volverse administrador'
intento(G, 'Agregarse a la tabla administradores', 'intruso', f"insert into administradores (user_id, nombre) values ('{INTRUSO}', 'Hacker')", falla)
intento(G, 'Cambiar el estado de reservas ajenas', 'intruso', "select admin_cambiar_estado(gen_random_uuid(), 'cancelada')", error('NO_AUTORIZADO'))
intento(G, 'Llamar es_admin() para engañar al panel', 'intruso', 'select es_admin()', lambda ok, s: ok and s == 'f', 'responde falso')
intento(G, 'Cambiar precios', 'anon', 'update servicios set precio = 1', falla)
intento(G, 'Desactivar barberos', 'intruso', 'update barberos set activo = false', falla)
intento(G, 'Borrar horarios', 'anon', 'delete from horarios', falla)
intento(G, 'Llamar normalizar_telefono (función interna)', 'anon', "select normalizar_telefono('1')", falla)

G = '3. Inyección SQL'
intento(G, "Nombre con '); drop table reservas;--", 'anon', reservar(1, 3, dia, horas[0], "x'); drop table reservas;--", '+56 9 4000 0001'),
        lambda ok, s: True, 'se guarda como texto')
intento(G, 'La tabla reservas sigue existiendo', 'base', 'select count(*) from reservas', lambda ok, s: ok)
intento(G, 'Hora con inyección', 'anon', f"select crear_reserva(1, 3, '{dia}', '10:00''; drop table reservas;--', 'Ana', '+56 9 4000 0002')", falla)
intento(G, 'Barbero con inyección', 'anon', f"select * from horas_disponibles('1; drop table reservas', 3, '{dia}')", falla)

G = '4. Saltarse las reglas de la reserva'
intento(G, 'Reservar en el pasado', 'anon', reservar(1, 3, hoy - datetime.timedelta(days=1), '12:00', 'Ana Pérez', '+56 9 4000 0003'), error('HORA_NO_DISPONIBLE'))
intento(G, 'Reservar fuera de la grilla (10:07)', 'anon', reservar(1, 3, dia, '10:07', 'Ana Pérez', '+56 9 4000 0004'), error('HORA_NO_DISPONIBLE'))
intento(G, 'Reservar a las 3 AM', 'anon', reservar(1, 3, dia, '03:00', 'Ana Pérez', '+56 9 4000 0005'), error('HORA_NO_DISPONIBLE'))
intento(G, 'Reservar un domingo (cerrado)', 'anon', reservar(1, 3, domingo, '12:00', 'Ana Pérez', '+56 9 4000 0006'), error('HORA_NO_DISPONIBLE'))
intento(G, 'Reservar con un barbero que no existe', 'anon', reservar(999, 3, dia, horas[1], 'Ana Pérez', '+56 9 4000 0007'), error('HORA_NO_DISPONIBLE'))
intento(G, 'Reservar a 1 año', 'anon', reservar(1, 3, hoy + datetime.timedelta(days=365), '12:00', 'Ana Pérez', '+56 9 4000 0008'), error('FECHA_FUERA_DE_RANGO'))
sql('anon', reservar(1, 3, dia, horas[0], 'Primera Persona', '+56 9 4000 0099'))
intento(G, 'Reservar una hora ya tomada', 'anon', reservar(1, 3, dia, horas[0], 'Otra Persona', '+56 9 4000 0009'), error('HORA_NO_DISPONIBLE'))
intento(G, 'Nombre de 500 caracteres', 'anon', reservar(1, 3, dia, horas[2], 'A' * 500, '+56 9 4000 0010'), falla)
intento(G, 'Teléfono con letras', 'anon', reservar(1, 3, dia, horas[2], 'Ana Pérez', 'llámame'), falla)
sql('base', "update barberos set activo = false where id = 3")
intento(G, 'Reservar con un barbero desactivado', 'anon', reservar(3, 3, dia, '12:00', 'Ana Pérez', '+56 9 4000 0011'), error('HORA_NO_DISPONIBLE'))
sql('base', "update barberos set activo = true where id = 3")

G = '5. Contenido malicioso en la reserva'
intento(G, 'Nombre con HTML/JavaScript (<img onerror>)', 'anon', reservar(1, 3, dia, horas[3], '<img src=x onerror=alert(1)>', '+56 9 4000 0012'), falla,
        'se revisa además cómo lo muestra el panel')
intento(G, 'Nombre con un link de phishing', 'anon', reservar(1, 3, dia, horas[4], 'Paga en bit.ly/pago-barberia', '+56 9 4000 0013'), falla,
        'el dueño lo mandaría por WhatsApp a ese número')
intento(G, 'Nombre con saltos de línea (mensaje falso)', 'anon', reservar(1, 3, dia, horas[5], 'Ana\n\nTu hora fue anulada. Paga aquí:', '+56 9 4000 0014'), falla)
intento(G, 'Nombre con caracteres invisibles (U+202E)', 'anon', reservar(1, 3, dia, horas[6], 'Ana‮adnaS', '+56 9 4000 0015'), falla)

G = '6. Saltarse el límite de 2 reservas por teléfono'
sql('base', "delete from reservas where cliente_telefono like '%4000 00%'")
for i, t in enumerate(['+56 9 7777 1111', '56977771111']):
    sql('anon', reservar(2, 3, dia, horas[i], 'Mismo Cliente', t))
intento(G, 'Tercera reserva con +56 9 7777 1111', 'anon', reservar(2, 3, dia, horas[3], 'Mismo Cliente', '+56977771111'), error('LIMITE_RESERVAS'))
intento(G, 'Tercera reserva con 0056 9 7777 1111', 'anon', reservar(2, 3, dia, horas[4], 'Mismo Cliente', '0056 9 7777 1111'), error('LIMITE_RESERVAS'))
intento(G, 'Tercera reserva con 56 09 7777 1111', 'anon', reservar(2, 3, dia, horas[5], 'Mismo Cliente', '56 09 7777 1111'), error('LIMITE_RESERVAS'))

# ---------------------------------------------------------------- carreras
G = '7. Ataques simultáneos'
sql('base', 'delete from reservas')
def en_paralelo(consultas):
    with cf.ThreadPoolExecutor(len(consultas)) as ex:
        return list(ex.map(lambda c: sql('anon', c), consultas))
r = en_paralelo([reservar(1, 1, dia, horas[0], 'Cliente ' + 'abcdefghijklmnop'[i], f'+56 9 5100 00{i:02d}') for i in range(12)])
exitos = sum(ok for ok, _ in r)
resultados.append((G, '12 personas reservan la misma hora en el mismo instante', exitos == 1, f'{exitos} reservas guardadas', ''))
print(f"{'🛡️  BLOQUEADO' if exitos == 1 else '⚠️  LOGRADO  '} [{G}] 12 reservas a la misma hora al mismo tiempo → {exitos} guardadas")
sql('base', 'delete from reservas')
r = en_paralelo([reservar(1 + i % 3, 3, dia, horas[(i // 3) + 2], 'Mismo Teléfono', '+56 9 5200 0000') for i in range(9)])
exitos = sum(ok for ok, _ in r)
resultados.append((G, '9 reservas con el mismo teléfono en el mismo instante', exitos == 2, f'{exitos} reservas guardadas', ''))
print(f"{'🛡️  BLOQUEADO' if exitos == 2 else '⚠️  LOGRADO  '} [{G}] 9 reservas mismo teléfono al mismo tiempo → {exitos} guardadas")

# ---------------------------------------------------------------- inundación
G = '8. Inundar la agenda (bot)'
sql('base', 'delete from reservas')
guardadas = 0
for i in range(40):
    b = 1 + i % 3
    hs = sql('anon', f"select string_agg(hora::text, ',') from horas_disponibles({b}, 1, '{dia}')")[1]
    if not hs:
        continue
    ok, s = sql('anon', reservar(b, 1, dia, hs.split(',')[0], 'Bot Falso ' + 'abcdefghijklmnopqrstuvwxyzabcdefghijklmn'[i] * 2, f'+56 9 6{i:03d} 0000'))
    guardadas += ok
libres = sum(len((sql('anon', f"select string_agg(hora::text, ',') from horas_disponibles({b}, 1, '{dia}')")[1] or '').split(',')) for b in (1, 2, 3))
ok, s = sql('anon', reservar(1, 3, dia + datetime.timedelta(days=1), '12:00', 'Cliente Real', '+56 9 8888 0000'))
resultados.append((G, 'Un bot crea reservas falsas con teléfonos inventados', guardadas < 5, f'{guardadas} reservas falsas guardadas en segundos', ''))
resultados.append((G, 'Después, un cliente real intenta reservar', ok, s[:80], ''))
print(f"{'🛡️  BLOQUEADO' if guardadas < 5 else '⚠️  LOGRADO  '} [{G}] bot con teléfonos inventados → {guardadas} reservas falsas")
print(f"{'🛡️  BLOQUEADO' if ok else '⚠️  LOGRADO  '} [{G}] cliente real después del bot → {s[:80]}")

logrados = [r for r in resultados if not r[2]]
print(f'\nTotal: {len(resultados)} ataques · {len(resultados) - len(logrados)} bloqueados · {len(logrados)} lograron algo')

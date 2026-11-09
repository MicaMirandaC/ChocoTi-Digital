-- =============================================================================
-- ChocoTi-Digital | Fase 1 - Subsistema de Seguridad y Gestión de Usuarios
-- Motor de Base de Datos: SQLite 3 ('chocoti_security.db')
-- Chocolates Para Ti · Sucre, Bolivia
-- =============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =============================================================================
-- TABLA: roles
-- Define los 4 perfiles autorizados en el sistema ChocoTi-Digital.
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT        NOT NULL UNIQUE,
    descripcion TEXT
);

-- =============================================================================
-- TABLA: almacenes
-- Registra la Planta Central en Sucre y las agencias departamentales autorizadas.
-- =============================================================================
CREATE TABLE IF NOT EXISTS almacenes (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT        NOT NULL,
    ciudad      TEXT        NOT NULL,
    direccion   TEXT,
    tipo        TEXT        NOT NULL CHECK(tipo IN ('CENTRAL', 'AGENCIA')),
    activo      INTEGER     NOT NULL DEFAULT 1 -- 1 = Activo, 0 = Inactivo
);

-- =============================================================================
-- TABLA: usuarios
-- Almacena credenciales, perfiles y estado de usuarios internos y clientes externos.
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT        NOT NULL,
    email           TEXT        NOT NULL UNIQUE,
    password_hash   TEXT        NOT NULL,
    ci_nit          TEXT,
    telefono        TEXT,
    tipo_cliente    TEXT        NOT NULL CHECK(tipo_cliente IN ('MINORISTA', 'CORPORATIVO', 'INTERNO')),
    razon_social    TEXT,       -- Requerido para CLIENTE_CORPORATIVO (B2B)
    rol_id          INTEGER     NOT NULL,
    almacen_id      INTEGER,    -- Asociado a operadores de almacén (NULL para clientes)
    estado          TEXT        NOT NULL DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    fecha_creacion  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion DATETIME,
    FOREIGN KEY (rol_id)     REFERENCES roles(id)     ON UPDATE CASCADE,
    FOREIGN KEY (almacen_id) REFERENCES almacenes(id) ON UPDATE CASCADE
);

-- =============================================================================
-- TABLA: logs_acceso
-- Auditoría obligatoria de todos los intentos de autenticación (éxitos y fallos).
-- Permite rastrear IP, usuario involucrado, estado y detalles de seguridad.
-- =============================================================================
CREATE TABLE IF NOT EXISTS logs_acceso (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    usuario_id      INTEGER,    -- Puede ser NULL si el intento falló con un email inexistente
    fecha_hora      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen       TEXT,
    estado_login    TEXT        NOT NULL CHECK(estado_login IN ('EXITOSO', 'FALLIDO')),
    detalles        TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- TRIGGER: actualizar_ultima_conexion
-- Actualiza automáticamente la marca temporal de 'ultima_conexion' en la tabla
-- 'usuarios' cada vez que se registra un login con estado 'EXITOSO'.
-- =============================================================================
CREATE TRIGGER IF NOT EXISTS actualizar_ultima_conexion
AFTER INSERT ON logs_acceso
WHEN NEW.estado_login = 'EXITOSO' AND NEW.usuario_id IS NOT NULL
BEGIN
    UPDATE usuarios
    SET    ultima_conexion = NEW.fecha_hora
    WHERE  id = NEW.usuario_id;
END;

-- =============================================================================
-- DATOS SEMILLA: roles (4 Roles oficiales)
-- =============================================================================
INSERT OR IGNORE INTO roles (id, nombre, descripcion) VALUES
    (1, 'ADMINISTRADOR',        'Acceso total al sistema: gestión de usuarios, auditoría, almacenes y configuración global.'),
    (2, 'OPERADOR_ALMACEN',     'Gestión logística: control de existencias, despachos y recepción en almacén asignado.'),
    (3, 'CLIENTE_MINORISTA',    'Cliente consumidor final con acceso al catálogo digital, carrito y seguimiento de pedidos.'),
    (4, 'CLIENTE_CORPORATIVO',  'Cliente empresarial (B2B) con lista de precios mayorista, cotizaciones y pedidos institucionales.');

-- =============================================================================
-- DATOS SEMILLA: almacenes (Planta Central Sucre y Agencias oficiales)
-- =============================================================================
INSERT OR IGNORE INTO almacenes (id, nombre, ciudad, direccion, tipo, activo) VALUES
    (1, 'Planta Central Sucre',  'Sucre',         'Av. Hernando Siles 123 (Planta Matriz)', 'CENTRAL', 1),
    (2, 'Agencia La Paz',        'La Paz',        'Calle Comercio 456, Zona Central',       'AGENCIA', 1),
    (3, 'Agencia Cochabamba',    'Cochabamba',    'Blvd. Recoleta 789, Cala Cala',          'AGENCIA', 1),
    (4, 'Agencia Santa Cruz',    'Santa Cruz',    'Av. Cristo Redentor 1011, 2do Anillo',   'AGENCIA', 1);

-- =============================================================================
-- DATOS SEMILLA: usuarios (MOCK DATA PARA CADA UNO DE LOS 4 ROLES)
-- Contraseñas hasheadas con bcrypt (10 rondas):
--  - Administrador       : admin@chocolatesti.bo        | Password: Admin2024!
--  - Operador Sucre      : operador.sucre@chocolatesti.bo| Password: Operador2024!
--  - Operador La Paz     : operador.lapaz@chocolatesti.bo| Password: Operador2024!
--  - Cliente Minorista   : cliente@gmail.com            | Password: Cliente2024!
--  - Cliente Corporativo : empresa@acme.bo              | Password: Empresa2024!
-- =============================================================================
INSERT OR IGNORE INTO usuarios
    (id, nombre_completo, email, password_hash, ci_nit, telefono, tipo_cliente, razon_social, rol_id, almacen_id, estado, fecha_creacion)
VALUES
    -- 1. Rol: ADMINISTRADOR
    (1,
     'Administrador ChocoTi',
     'admin@chocolatesti.bo',
     '$2a$10$OSgtqZzk6nEDKpwGwMIw7eTWtgCnqzV0Im1vDnZWJHyJ6Sp7762cq',
     '1020304-CH',
     '72889900',
     'INTERNO',
     NULL,
     1,
     1,
     'ACTIVO',
     CURRENT_TIMESTAMP),

    -- 2. Rol: OPERADOR_ALMACEN (Planta Central Sucre)
    (2,
     'Operador Sucre',
     'operador.sucre@chocolatesti.bo',
     '$2a$10$Uo2/s1S5O4u1dfyoIUfGNurq2ayykm.RdTfNtaiq./Qt2gnKUM3Vq',
     '2030405-CH',
     '71223344',
     'INTERNO',
     NULL,
     2,
     1,
     'ACTIVO',
     CURRENT_TIMESTAMP),

    -- 3. Rol: OPERADOR_ALMACEN (Agencia La Paz)
    (3,
     'Operador La Paz',
     'operador.lapaz@chocolatesti.bo',
     '$2a$10$Uo2/s1S5O4u1dfyoIUfGNurq2ayykm.RdTfNtaiq./Qt2gnKUM3Vq',
     '3040506-LP',
     '73445566',
     'INTERNO',
     NULL,
     2,
     2,
     'ACTIVO',
     CURRENT_TIMESTAMP),

    -- 4. Rol: CLIENTE_MINORISTA
    (4,
     'Ana María Flores',
     'cliente@gmail.com',
     '$2a$10$rj1PMIVNc4ES5BF3w/etZeyiXRXxbPETAHOolhFTf5b5IG/6h6P4a',
     '5678901-SC',
     '78990011',
     'MINORISTA',
     NULL,
     3,
     NULL,
     'ACTIVO',
     CURRENT_TIMESTAMP),

    -- 5. Rol: CLIENTE_CORPORATIVO (B2B)
    (5,
     'Carlos Mendoza (ACME)',
     'empresa@acme.bo',
     '$2a$10$RldKcA/0vstBKAz7zxf8KOz.iThx4nqonDaTlM3PNJ023uOGiPkRy',
     '1023456789',
     '46412345',
     'CORPORATIVO',
     'ACME Distribuidora Bolivia S.R.L.',
     4,
     NULL,
     'ACTIVO',
     CURRENT_TIMESTAMP);

-- =============================================================================
-- DATOS SEMILLA: logs_acceso iniciales para auditoría
-- =============================================================================
INSERT OR IGNORE INTO logs_acceso (id, usuario_id, fecha_hora, ip_origen, estado_login, detalles) VALUES
    (1, 1, datetime('now', '-2 hours'), '127.0.0.1', 'EXITOSO', 'Inicio de sesión administrativo inicial'),
    (2, 2, datetime('now', '-1 hour'),  '192.168.1.10', 'EXITOSO', 'Apertura de turno almacén Sucre'),
    (3, NULL, datetime('now', '-45 minutes'), '190.181.45.12', 'FALLIDO', 'Intento con usuario inexistente: invitado@externo.bo'),
    (4, 4, datetime('now', '-20 minutes'), '181.115.12.34', 'EXITOSO', 'Ingreso portal e-commerce cliente minorista');

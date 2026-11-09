/**
 * @file config/initDb.js
 * @description Script de inicialización y migración: ejecuta schema.sql en SQLite.
 * ChocoTi-Digital | Capa 3: Persistencia y Acceso a Datos
 */

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('./database');

// Buscar schema.sql en posibles ubicaciones
const posiblesRutas = [
  path.resolve(__dirname, '..', '..', '..', 'database', 'schema.sql'),
  path.resolve(__dirname, '..', '..', 'database', 'schema.sql'),
  path.resolve(process.cwd(), 'database', 'schema.sql'),
  path.resolve(process.cwd(), '..', 'database', 'schema.sql'),
];

const schemaPath = posiblesRutas.find((p) => fs.existsSync(p));

if (!schemaPath) {
  console.error('[INIT-DB] No se encontró el archivo database/schema.sql.');
  process.exit(1);
}

try {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Ejecución del script DDL y semillas
  db.exec(schemaSql);

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        ChocoTi-Digital | Inicialización de BD          ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Base de datos: chocoti_security.db                     ║`);
  console.log(`║ Schema origen: ${path.basename(schemaPath).padEnd(40)}║`);
  console.log('║ Estado       : Tablas creadas y Semillas insertadas    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
} catch (err) {
  console.error('[INIT-DB] Error al inicializar la base de datos:', err);
  process.exit(1);
}

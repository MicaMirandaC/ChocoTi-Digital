/**
 * @file config/database.js
 * @description Conexión singleton a SQLite utilizando better-sqlite3.
 * Configura pragmas de integridad referencial, WAL mode y sincronización óptima.
 * ChocoTi-Digital | Capa 3: Persistencia y Acceso a Datos
 */

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Resolver ruta de la base de datos de manera robusta
let DB_PATH;
if (process.env.DB_PATH) {
  DB_PATH = path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.resolve(__dirname, '..', '..', process.env.DB_PATH);
} else {
  DB_PATH = path.resolve(__dirname, '..', '..', '..', 'database', 'chocoti_security.db');
}

// Garantizar que la carpeta contenedora exista
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

try {
  db = new Database(DB_PATH);

  // Integridad referencial mandatoria
  db.pragma('foreign_keys = ON');

  // Modo WAL (Write-Ahead Logging) para concurrencia de lectura/escritura sin bloqueos
  db.pragma('journal_mode = WAL');

  // Configuración de sincronización y rendimiento
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -32000'); // 32MB de cache

  // console.log(`[DB] Conectado exitosamente a: ${DB_PATH}`);
} catch (err) {
  console.error('[DB] Error crítico al inicializar conexión SQLite:', err.message);
  process.exit(1);
}

module.exports = db;

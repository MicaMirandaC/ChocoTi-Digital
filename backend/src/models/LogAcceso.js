/**
 * @file models/LogAcceso.js
 * @description Modelo de datos y DAO para la tabla 'logs_acceso'.
 * ChocoTi-Digital | Capa 3: Persistencia y Acceso a Datos
 */

'use strict';

const db = require('../config/database');

class LogAcceso {
  /**
   * Registra un evento de acceso en la bitácora.
   * @param {object} param
   * @param {number|null} param.usuario_id - ID del usuario o null si no existe
   * @param {string} param.ip_origen - IP del cliente solicitante
   * @param {'EXITOSO'|'FALLIDO'} param.estado_login - Resultado del intento
   * @param {string} [param.detalles] - Contexto adicional del intento
   * @returns {number} ID del registro insertado
   */
  static registrar({ usuario_id = null, ip_origen = '127.0.0.1', estado_login, detalles = '' }) {
    const stmt = db.prepare(`
      INSERT INTO logs_acceso (usuario_id, ip_origen, estado_login, detalles)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(usuario_id, ip_origen, estado_login, detalles);
    return result.lastInsertRowid;
  }

  /**
   * Consulta registros de logs con filtros opcionales.
   * @param {object} filtros
   * @param {number} [filtros.usuario_id]
   * @param {string} [filtros.estado_login]
   * @param {number} [filtros.limite=100]
   * @param {number} [filtros.offset=0]
   * @returns {Array<object>}
   */
  static findAll(filtros = {}) {
    const condiciones = [];
    const params = [];

    if (filtros.usuario_id) {
      condiciones.push('l.usuario_id = ?');
      params.push(Number(filtros.usuario_id));
    }

    if (filtros.estado_login) {
      condiciones.push('l.estado_login = ?');
      params.push(filtros.estado_login.toUpperCase());
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const limite = Number(filtros.limite) > 0 ? Number(filtros.limite) : 100;
    const offset = Number(filtros.offset) > 0 ? Number(filtros.offset) : 0;

    const stmt = db.prepare(`
      SELECT
        l.id,
        l.usuario_id,
        u.nombre_completo AS usuario_nombre,
        u.email           AS usuario_email,
        l.fecha_hora,
        l.ip_origen,
        l.estado_login,
        l.detalles
      FROM logs_acceso l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${where}
      ORDER BY l.fecha_hora DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(...params, limite, offset);
  }

  /**
   * Cuenta la cantidad de registros de logs según filtros.
   * @param {object} filtros
   * @returns {number}
   */
  static count(filtros = {}) {
    const condiciones = [];
    const params = [];

    if (filtros.usuario_id) {
      condiciones.push('l.usuario_id = ?');
      params.push(Number(filtros.usuario_id));
    }

    if (filtros.estado_login) {
      condiciones.push('l.estado_login = ?');
      params.push(filtros.estado_login.toUpperCase());
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const row = db.prepare(`SELECT COUNT(*) AS total FROM logs_acceso l ${where}`).get(...params);
    return row ? row.total : 0;
  }

  /**
   * Cuenta los logins exitosos efectuados el día de hoy.
   * @returns {number}
   */
  static contarHoy() {
    const row = db.prepare(`
      SELECT COUNT(*) AS total
      FROM logs_acceso
      WHERE date(fecha_hora) = date('now')
        AND estado_login = 'EXITOSO'
    `).get();
    return row ? row.total : 0;
  }
}

module.exports = LogAcceso;

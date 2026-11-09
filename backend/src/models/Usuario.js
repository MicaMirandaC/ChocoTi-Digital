/**
 * @file models/Usuario.js
 * @description Modelo de datos y DAO para la tabla 'usuarios'.
 * ChocoTi-Digital | Capa 3: Persistencia y Acceso a Datos
 */

'use strict';

const db = require('../config/database');

class Usuario {
  /**
   * Busca un usuario por email incluyendo password_hash para autenticación.
   * @param {string} email
   * @returns {object|undefined}
   */
  static findByEmail(email) {
    return db
      .prepare(
        `SELECT
          u.id,
          u.nombre_completo,
          u.email,
          u.password_hash,
          u.ci_nit,
          u.telefono,
          u.tipo_cliente,
          u.razon_social,
          u.rol_id,
          u.almacen_id,
          u.estado,
          u.fecha_creacion,
          u.ultima_conexion,
          r.nombre AS rol,
          a.nombre AS almacen_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        LEFT JOIN almacenes a ON u.almacen_id = a.id
        WHERE u.email = ? COLLATE NOCASE`
      )
      .get(email);
  }

  /**
   * Busca un usuario por ID (sin password_hash).
   * @param {number} id
   * @returns {object|undefined}
   */
  static findById(id) {
    return db
      .prepare(
        `SELECT
          u.id,
          u.nombre_completo,
          u.email,
          u.ci_nit,
          u.telefono,
          u.tipo_cliente,
          u.razon_social,
          u.rol_id,
          u.almacen_id,
          u.estado,
          u.fecha_creacion,
          u.ultima_conexion,
          r.nombre AS rol,
          a.nombre AS almacen_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        LEFT JOIN almacenes a ON u.almacen_id = a.id
        WHERE u.id = ?`
      )
      .get(id);
  }

  /**
   * Obtiene un usuario con password_hash por su ID (para cambio de clave).
   * @param {number} id
   * @returns {object|undefined}
   */
  static findWithPasswordById(id) {
    return db
      .prepare(
        `SELECT
          u.id,
          u.nombre_completo,
          u.email,
          u.password_hash,
          u.estado
        FROM usuarios u
        WHERE u.id = ?`
      )
      .get(id);
  }

  /**
   * Lista usuarios aplicando filtros opcionales.
   * @param {object} filtros
   * @param {number} [filtros.rol_id]
   * @param {number} [filtros.almacen_id]
   * @param {string} [filtros.estado]
   * @param {string} [filtros.tipo_cliente]
   * @returns {Array<object>}
   */
  static findAll(filtros = {}) {
    const condiciones = [];
    const params = [];

    if (filtros.rol_id !== undefined && filtros.rol_id !== null && filtros.rol_id !== '') {
      condiciones.push('u.rol_id = ?');
      params.push(Number(filtros.rol_id));
    }

    if (filtros.almacen_id !== undefined && filtros.almacen_id !== null && filtros.almacen_id !== '') {
      condiciones.push('u.almacen_id = ?');
      params.push(Number(filtros.almacen_id));
    }

    if (filtros.estado) {
      condiciones.push('u.estado = ?');
      params.push(filtros.estado.toUpperCase());
    }

    if (filtros.tipo_cliente) {
      condiciones.push('u.tipo_cliente = ?');
      params.push(filtros.tipo_cliente.toUpperCase());
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    return db
      .prepare(
        `SELECT
          u.id,
          u.nombre_completo,
          u.email,
          u.ci_nit,
          u.telefono,
          u.tipo_cliente,
          u.razon_social,
          u.rol_id,
          u.almacen_id,
          u.estado,
          u.fecha_creacion,
          u.ultima_conexion,
          r.nombre AS rol,
          a.nombre AS almacen_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        LEFT JOIN almacenes a ON u.almacen_id = a.id
        ${where}
        ORDER BY u.id ASC`
      )
      .all(...params);
  }

  /**
   * Inserta un nuevo usuario en la base de datos.
   * @param {object} datos
   * @returns {object} Usuario recién creado
   */
  static create(datos) {
    const stmt = db.prepare(`
      INSERT INTO usuarios
        (nombre_completo, email, password_hash, ci_nit, telefono,
         tipo_cliente, razon_social, rol_id, almacen_id, estado)
      VALUES
        (@nombre_completo, @email, @password_hash, @ci_nit, @telefono,
         @tipo_cliente, @razon_social, @rol_id, @almacen_id, @estado)
    `);

    const info = stmt.run({
      nombre_completo: datos.nombre_completo,
      email: datos.email,
      password_hash: datos.password_hash,
      ci_nit: datos.ci_nit ?? null,
      telefono: datos.telefono ?? null,
      tipo_cliente: datos.tipo_cliente || 'MINORISTA',
      razon_social: datos.razon_social ?? null,
      rol_id: datos.rol_id,
      almacen_id: datos.almacen_id ?? null,
      estado: datos.estado || 'ACTIVO',
    });

    return Usuario.findById(info.lastInsertRowid);
  }

  /**
   * Actualiza los datos de un usuario.
   * @param {number} id
   * @param {object} datos
   * @returns {object|undefined}
   */
  static update(id, datos) {
    const camposPermitidos = [
      'nombre_completo',
      'email',
      'ci_nit',
      'telefono',
      'tipo_cliente',
      'razon_social',
      'rol_id',
      'almacen_id',
      'estado',
    ];

    const sets = [];
    const params = [];

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(datos, campo) && datos[campo] !== undefined) {
        sets.push(`${campo} = ?`);
        params.push(datos[campo] === '' ? null : datos[campo]);
      }
    }

    if (sets.length === 0) {
      return Usuario.findById(id);
    }

    params.push(id);
    db.prepare(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`).run(...params);

    return Usuario.findById(id);
  }

  /**
   * Inactiva lógicamente un usuario (baja lógica).
   * @param {number} id
   * @returns {boolean}
   */
  static inactivar(id) {
    const info = db.prepare(`UPDATE usuarios SET estado = 'INACTIVO' WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  /**
   * Cambia la contraseña (password_hash) del usuario.
   * @param {number} id
   * @param {string} passwordHash
   */
  static cambiarPassword(id, passwordHash) {
    db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`).run(passwordHash, id);
  }

  /**
   * Actualiza el campo de última conexión a la fecha actual.
   * @param {number} id
   */
  static actualizarUltimaConexion(id) {
    db.prepare(`UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  }

  /**
   * Retorna estadísticas agregadas de usuarios para el dashboard.
   * @returns {object}
   */
  static obtenerEstadisticas() {
    const row = db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) AS activos,
          SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) AS inactivos,
          SUM(CASE WHEN estado = 'BLOQUEADO' THEN 1 ELSE 0 END) AS bloqueados
        FROM usuarios`
      )
      .get();

    return {
      total: row.total || 0,
      activos: row.activos || 0,
      inactivos: row.inactivos || 0,
      bloqueados: row.bloqueados || 0,
    };
  }
}

module.exports = Usuario;

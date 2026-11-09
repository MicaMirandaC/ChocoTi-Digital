/**
 * @file models/Rol.js
 * @description Modelo de datos para la tabla 'roles'.
 * ChocoTi-Digital | Capa 3: Persistencia y Acceso a Datos
 */

'use strict';

const db = require('../config/database');

class Rol {
  /**
   * Retorna todos los roles del sistema.
   * @returns {Array<object>}
   */
  static findAll() {
    return db.prepare('SELECT id, nombre, descripcion FROM roles ORDER BY id ASC').all();
  }

  /**
   * Busca un rol por su ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  static findById(id) {
    return db.prepare('SELECT id, nombre, descripcion FROM roles WHERE id = ?').get(id);
  }

  /**
   * Busca un rol por su nombre.
   * @param {string} nombre
   * @returns {object|undefined}
   */
  static findByNombre(nombre) {
    return db.prepare('SELECT id, nombre, descripcion FROM roles WHERE UPPER(nombre) = UPPER(?)').get(nombre);
  }
}

module.exports = Rol;

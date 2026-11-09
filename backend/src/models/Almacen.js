/**
 * @file models/Almacen.js
 * @description Modelo de datos para la tabla 'almacenes'.
 * ChocoTi-Digital | Capa 3: Persistencia y Acceso a Datos
 */

'use strict';

const db = require('../config/database');

class Almacen {
  /**
   * Retorna todos los almacenes activos.
   * @returns {Array<object>}
   */
  static findAll() {
    return db
      .prepare(
        `SELECT
          id,
          nombre,
          ciudad,
          direccion,
          tipo,
          activo
        FROM almacenes
        WHERE activo = 1
        ORDER BY id ASC`
      )
      .all();
  }

  /**
   * Busca un almacén por su identificador.
   * @param {number} id
   * @returns {object|undefined}
   */
  static findById(id) {
    return db
      .prepare(
        `SELECT
          id,
          nombre,
          ciudad,
          direccion,
          tipo,
          activo
        FROM almacenes
        WHERE id = ?`
      )
      .get(id);
  }
}

module.exports = Almacen;

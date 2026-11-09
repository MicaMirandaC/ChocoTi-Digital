/**
 * @file services/almacenesService.js
 * @description Servicio de consulta y gestión de almacenes físicos.
 * ChocoTi-Digital | Capa 2: Lógica de Negocio
 */

'use strict';

const Almacen = require('../models/Almacen');

class AlmacenesService {
  /**
   * Retorna el catálogo de almacenes activos.
   * @returns {Array<object>}
   */
  static listarAlmacenes() {
    return Almacen.findAll();
  }

  /**
   * Obtiene un almacén por su identificador.
   * @param {number} id
   * @returns {object}
   */
  static obtenerPorId(id) {
    const almacen = Almacen.findById(id);
    if (!almacen) {
      const error = new Error('Almacén no encontrado.');
      error.status = 404;
      throw error;
    }
    return almacen;
  }
}

module.exports = AlmacenesService;

/**
 * @file controllers/almacenesController.js
 * @description Controlador HTTP para gestión de almacenes físicos de ChocoTi.
 * ChocoTi-Digital | Capa 1: Controladores y Transporte HTTP
 */

'use strict';

const AlmacenesService = require('../services/almacenesService');

/**
 * GET /api/almacenes
 * Retorna la lista completa de almacenes autorizados.
 */
function listar(req, res, next) {
  try {
    const almacenes = AlmacenesService.listarAlmacenes();
    return res.status(200).json({
      ok: true,
      total: almacenes.length,
      almacenes,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * GET /api/almacenes/:id
 * Retorna los detalles de un almacén por su ID.
 */
function obtener(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'Identificador de almacén no válido.' });
    }

    const almacen = AlmacenesService.obtenerPorId(id);
    return res.status(200).json({
      ok: true,
      almacen,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

module.exports = {
  listar,
  obtener,
};

/**
 * @file controllers/usuariosController.js
 * @description Controlador HTTP para gestión CRUD de usuarios, auditoría y estadísticas.
 * ChocoTi-Digital | Capa 1: Controladores y Transporte HTTP
 */

'use strict';

const { validationResult } = require('express-validator');
const UsuariosService = require('../services/usuariosService');

/**
 * GET /api/usuarios
 * Lista usuarios con filtros opcionales (rol_id, almacen_id, estado, tipo_cliente).
 */
function listar(req, res, next) {
  try {
    const { rol_id, almacen_id, estado, tipo_cliente } = req.query;

    const filtros = {
      rol_id: rol_id !== undefined ? rol_id : undefined,
      almacen_id: almacen_id !== undefined ? almacen_id : undefined,
      estado: estado || undefined,
      tipo_cliente: tipo_cliente || undefined,
    };

    const usuarios = UsuariosService.listarUsuarios(filtros);

    return res.status(200).json({
      ok: true,
      total: usuarios.length,
      usuarios,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * POST /api/usuarios
 * Crea un nuevo usuario (exclusivo Administrador).
 */
async function crear(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(422).json({
      ok: false,
      mensaje: 'Datos del formulario de creación inválidos.',
      errores: errores.array(),
    });
  }

  try {
    const nuevoUsuario = await UsuariosService.crearUsuario(req.body);

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado exitosamente.',
      usuario: nuevoUsuario,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * GET /api/usuarios/:id
 * Obtiene los detalles de un usuario por su ID.
 */
function obtener(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'Identificador de usuario no válido.' });
    }

    const usuario = UsuariosService.obtenerPorId(id);

    return res.status(200).json({
      ok: true,
      usuario,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * PUT /api/usuarios/:id
 * Actualiza la información de un usuario existente.
 */
async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'Identificador de usuario no válido.' });
    }

    const usuarioActualizado = await UsuariosService.actualizarUsuario(id, req.body);

    return res.status(200).json({
      ok: true,
      mensaje: 'Usuario actualizado exitosamente.',
      usuario: usuarioActualizado,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * DELETE /api/usuarios/:id
 * Inactiva lógicamente a un usuario del sistema (baja lógica).
 */
function inactivar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'Identificador de usuario no válido.' });
    }

    const resultado = UsuariosService.inactivarUsuario(id, req.usuario.id);

    return res.status(200).json({
      ok: true,
      mensaje: resultado.mensaje,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * GET /api/usuarios/stats
 * Retorna métricas globales de usuarios y accesos para el dashboard.
 */
function getStats(req, res, next) {
  try {
    const stats = UsuariosService.obtenerEstadisticas();
    return res.status(200).json({
      ok: true,
      stats,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    return next(err);
  }
}

/**
 * GET /api/usuarios/logs
 * Retorna la bitácora de accesos con filtros por usuario, estado y paginación.
 */
function getLogs(req, res, next) {
  try {
    const { usuario_id, estado_login, limite, offset } = req.query;

    const resultado = UsuariosService.obtenerLogs({
      usuario_id: usuario_id ? Number(usuario_id) : undefined,
      estado_login: estado_login || undefined,
      limite: limite ? Number(limite) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return res.status(200).json({
      ok: true,
      total: resultado.total,
      limite: resultado.limite,
      logs: resultado.logs,
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
  crear,
  obtener,
  actualizar,
  inactivar,
  getStats,
  getLogs,
};

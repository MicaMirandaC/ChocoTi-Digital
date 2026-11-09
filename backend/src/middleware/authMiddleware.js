/**
 * @file middleware/authMiddleware.js
 * @description Middlewares de autenticación JWT y control de acceso basado en roles (RBAC).
 * ChocoTi-Digital | Capa 1: Controladores y Seguridad HTTP
 */

'use strict';

require('dotenv').config();

const jwt = require('jsonwebtoken');
const LogAcceso = require('../models/LogAcceso');

const JWT_SECRET = process.env.JWT_SECRET || 'chocoti_secret_sucre_bolivia_2026';

/**
 * Extrae el Bearer token de las cabeceras HTTP.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extraerToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') return null;

  const partes = authHeader.trim().split(' ');
  if (partes.length === 2 && partes[0].toLowerCase() === 'bearer') {
    return partes[1];
  }
  return null;
}

/**
 * Middleware para validar el JWT y cargar la sesión en req.usuario.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function verificarToken(req, res, next) {
  const token = extraerToken(req);

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso no autorizado. Token de autenticación requerido.',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = {
      id: payload.id,
      nombre_completo: payload.nombre_completo,
      email: payload.email,
      rol: payload.rol,
      rol_id: payload.rol_id,
      almacen_id: payload.almacen_id,
      tipo_cliente: payload.tipo_cliente,
    };
    next();
  } catch (err) {
    const mensaje =
      err.name === 'TokenExpiredError'
        ? 'La sesión ha expirado. Por favor, inicie sesión nuevamente.'
        : 'Token de autenticación inválido o alterado.';

    return res.status(401).json({
      ok: false,
      mensaje,
    });
  }
}

/**
 * Middleware para restringir acceso exclusivamente al rol ADMINISTRADOR.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso denegado. Se requieren privilegios de ADMINISTRADOR.',
    });
  }
  next();
}

/**
 * Middleware para permitir el acceso a un recurso de usuario si es ADMINISTRADOR
 * o si es el propio usuario autenticado solicitando su propio ID.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function adminOPropioUsuario(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado.' });
  }

  const esAdmin = req.usuario.rol === 'ADMINISTRADOR';
  const esPropio = String(req.usuario.id) === String(req.params.id);

  if (esAdmin || esPropio) {
    return next();
  }

  return res.status(403).json({
    ok: false,
    mensaje: 'Acceso denegado. No tiene permisos para acceder a información de otros usuarios.',
  });
}

/**
 * Helper para registrar accesos en logs_acceso.
 *
 * @param {number|null} usuario_id
 * @param {string} ip_origen
 * @param {'EXITOSO'|'FALLIDO'} estado_login
 * @param {string} detalles
 */
function registrarLog(usuario_id, ip_origen, estado_login, detalles = '') {
  try {
    LogAcceso.registrar({ usuario_id, ip_origen, estado_login, detalles });
  } catch (err) {
    console.error('[authMiddleware.registrarLog] Error al registrar log:', err.message);
  }
}

module.exports = {
  verificarToken,
  soloAdmin,
  adminOPropioUsuario,
  registrarLog,
};

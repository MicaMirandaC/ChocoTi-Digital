/**
 * @file controllers/authController.js
 * @description Controlador HTTP para endpoints de autenticación y perfil de usuario.
 * ChocoTi-Digital | Capa 1: Controladores y Transporte HTTP
 */

'use strict';

const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');

/**
 * Obtiene la dirección IP real del cliente considerando cabeceras de proxy.
 * @param {import('express').Request} req
 * @returns {string}
 */
function obtenerIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

/**
 * POST /api/auth/login
 * Autentica usuario con email y contraseña, registrando auditoría en logs_acceso.
 */
async function login(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(422).json({
      ok: false,
      mensaje: 'Datos de inicio de sesión inválidos.',
      errores: errores.array(),
    });
  }

  try {
    const { email, password } = req.body;
    const ip = obtenerIp(req);

    const resultado = await AuthService.login({ email, password, ip });

    return res.status(200).json({
      ok: true,
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        ok: false,
        mensaje: err.message,
      });
    }
    return next(err);
  }
}

/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado actual.
 */
function getMe(req, res, next) {
  try {
    const usuario = AuthService.getPerfil(req.usuario.id);
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
 * PUT /api/auth/perfil
 * Actualiza los datos de perfil propio del usuario autenticado.
 */
function updatePerfil(req, res, next) {
  try {
    const usuarioActualizado = AuthService.updatePerfil(req.usuario.id, req.body);
    return res.status(200).json({
      ok: true,
      mensaje: 'Perfil actualizado exitosamente.',
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
 * PUT /api/auth/password
 * Cambia la contraseña del usuario autenticado verificando la contraseña previa.
 */
async function cambiarPassword(req, res, next) {
  try {
    const resultado = await AuthService.cambiarPassword(req.usuario.id, req.body);
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

module.exports = {
  login,
  getMe,
  updatePerfil,
  cambiarPassword,
};

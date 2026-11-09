/**
 * @file services/authService.js
 * @description Servicio de autenticación, generación de tokens y auditoría de accesos.
 * ChocoTi-Digital | Capa 2: Lógica de Negocio
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const LogAcceso = require('../models/LogAcceso');

const JWT_SECRET = process.env.JWT_SECRET || 'chocoti_secret_sucre_bolivia_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

class AuthService {
  /**
   * Procesa el inicio de sesión del usuario.
   * Valida credenciales, comprueba estado, registra log obligatorio y genera JWT.
   *
   * @param {object} param
   * @param {string} param.email
   * @param {string} param.password
   * @param {string} param.ip
   * @returns {Promise<{token: string, usuario: object}>}
   */
  static async login({ email, password, ip = '127.0.0.1' }) {
    const emailNormalizado = (email || '').trim().toLowerCase();

    // 1. Buscar usuario por email (incluyendo password_hash)
    const usuario = Usuario.findByEmail(emailNormalizado);

    if (!usuario) {
      // Registro obligatorio de intento fallido en logs_acceso (usuario inexistente)
      LogAcceso.registrar({
        usuario_id: null,
        ip_origen: ip,
        estado_login: 'FALLIDO',
        detalles: `Email no registrado: ${emailNormalizado}`,
      });

      const error = new Error('Credenciales incorrectas.');
      error.status = 401;
      throw error;
    }

    // 2. Verificar estado de la cuenta
    if (usuario.estado !== 'ACTIVO') {
      LogAcceso.registrar({
        usuario_id: usuario.id,
        ip_origen: ip,
        estado_login: 'FALLIDO',
        detalles: `Cuenta no habilitada. Estado actual: ${usuario.estado}`,
      });

      const error = new Error(`Su cuenta se encuentra ${usuario.estado.toLowerCase()}. Contacte al administrador.`);
      error.status = 403;
      throw error;
    }

    // 3. Validar contraseña con bcrypt
    const coincidePassword = await bcrypt.compare(password, usuario.password_hash);

    if (!coincidePassword) {
      // Registro obligatorio de intento fallido en logs_acceso (contraseña incorrecta)
      LogAcceso.registrar({
        usuario_id: usuario.id,
        ip_origen: ip,
        estado_login: 'FALLIDO',
        detalles: `Contraseña incorrecta para el usuario ID: ${usuario.id}`,
      });

      const error = new Error('Credenciales incorrectas.');
      error.status = 401;
      throw error;
    }

    // 4. Registro obligatorio de login EXITOSO en logs_acceso
    // (El trigger de SQLite se encarga de actualizar 'ultima_conexion', o se actualiza explícitamente)
    LogAcceso.registrar({
      usuario_id: usuario.id,
      ip_origen: ip,
      estado_login: 'EXITOSO',
      detalles: `Autenticación exitosa. Rol: ${usuario.rol}`,
    });
    Usuario.actualizarUltimaConexion(usuario.id);

    // 5. Generación de Token JWT
    const payload = {
      id: usuario.id,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      rol: usuario.rol,
      rol_id: usuario.rol_id,
      almacen_id: usuario.almacen_id,
      tipo_cliente: usuario.tipo_cliente,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 6. Preparar objeto de usuario seguro (sin password_hash)
    const usuarioSeguro = {
      id: usuario.id,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      rol: usuario.rol,
      rol_id: usuario.rol_id,
      almacen_id: usuario.almacen_id,
      almacen_nombre: usuario.almacen_nombre,
      tipo_cliente: usuario.tipo_cliente,
      razon_social: usuario.razon_social,
      ci_nit: usuario.ci_nit,
      telefono: usuario.telefono,
    };

    return {
      token,
      usuario: usuarioSeguro,
    };
  }

  /**
   * Obtiene el perfil del usuario autenticado.
   * @param {number} usuarioId
   * @returns {object}
   */
  static getPerfil(usuarioId) {
    const usuario = Usuario.findById(usuarioId);
    if (!usuario) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }
    return usuario;
  }

  /**
   * Actualiza los datos permitidos del perfil propio.
   * @param {number} usuarioId
   * @param {object} datos
   * @returns {object}
   */
  static updatePerfil(usuarioId, datos) {
    const permitidos = {};
    if (datos.nombre_completo !== undefined) permitidos.nombre_completo = datos.nombre_completo.trim();
    if (datos.telefono !== undefined) permitidos.telefono = datos.telefono ? datos.telefono.trim() : null;
    if (datos.ci_nit !== undefined) permitidos.ci_nit = datos.ci_nit ? datos.ci_nit.trim() : null;
    if (datos.razon_social !== undefined) permitidos.razon_social = datos.razon_social ? datos.razon_social.trim() : null;

    if (Object.keys(permitidos).length === 0) {
      const error = new Error('No se proporcionaron campos válidos para actualizar.');
      error.status = 400;
      throw error;
    }

    const actualizado = Usuario.update(usuarioId, permitidos);
    if (!actualizado) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }
    return actualizado;
  }

  /**
   * Modifica la contraseña del usuario tras validar la anterior y la complejidad.
   *
   * @param {number} usuarioId
   * @param {object} param
   * @param {string} param.password_actual
   * @param {string} param.password_nueva
   * @param {string} param.password_confirmar
   */
  static async cambiarPassword(usuarioId, { password_actual, password_nueva, password_confirmar }) {
    if (!password_actual || !password_nueva || !password_confirmar) {
      const error = new Error('Debe proporcionar la contraseña actual, la nueva contraseña y su confirmación.');
      error.status = 400;
      throw error;
    }

    if (password_nueva !== password_confirmar) {
      const error = new Error('La nueva contraseña y su confirmación no coinciden.');
      error.status = 422;
      throw error;
    }

    // Validación de reglas de complejidad: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número
    const regexComplejidad = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regexComplejidad.test(password_nueva)) {
      const error = new Error('La nueva contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.');
      error.status = 422;
      throw error;
    }

    const usuario = Usuario.findWithPasswordById(usuarioId);
    if (!usuario) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }

    const coincideActual = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!coincideActual) {
      const error = new Error('La contraseña actual es incorrecta.');
      error.status = 401;
      throw error;
    }

    const nuevoHash = await bcrypt.hash(password_nueva, 10);
    Usuario.cambiarPassword(usuarioId, nuevoHash);

    return { mensaje: 'Contraseña actualizada correctamente.' };
  }
}

module.exports = AuthService;

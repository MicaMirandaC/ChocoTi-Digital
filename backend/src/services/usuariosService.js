/**
 * @file services/usuariosService.js
 * @description Servicio para gestión de usuarios, auditoría y estadísticas administrativas.
 * ChocoTi-Digital | Capa 2: Lógica de Negocio
 */

'use strict';

const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const Almacen = require('../models/Almacen');
const LogAcceso = require('../models/LogAcceso');

class UsuariosService {
  /**
   * Obtiene la lista de usuarios con filtros opcionales.
   * @param {object} filtros
   * @returns {Array<object>}
   */
  static listarUsuarios(filtros = {}) {
    return Usuario.findAll(filtros);
  }

  /**
   * Obtiene un usuario por su identificador.
   * @param {number} id
   * @returns {object}
   */
  static obtenerPorId(id) {
    const usuario = Usuario.findById(id);
    if (!usuario) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }
    return usuario;
  }

  /**
   * Crea un nuevo usuario en el sistema.
   * Hashea la contraseña y valida rol y almacén.
   *
   * @param {object} datos
   * @returns {Promise<object>}
   */
  static async crearUsuario(datos) {
    const emailNormalizado = datos.email.trim().toLowerCase();

    // 1. Validar unicidad del email
    const existente = Usuario.findByEmail(emailNormalizado);
    if (existente) {
      const error = new Error(`El email "${emailNormalizado}" ya se encuentra registrado.`);
      error.status = 409;
      throw error;
    }

    // 2. Validar existencia del Rol
    const rol = Rol.findById(Number(datos.rol_id));
    if (!rol) {
      const error = new Error(`El rol especificado (ID: ${datos.rol_id}) no es válido.`);
      error.status = 400;
      throw error;
    }

    // 3. Validar existencia de Almacén si fue provisto
    if (datos.almacen_id) {
      const almacen = Almacen.findById(Number(datos.almacen_id));
      if (!almacen) {
        const error = new Error(`El almacén especificado (ID: ${datos.almacen_id}) no existe.`);
        error.status = 400;
        throw error;
      }
    }

    // 4. Hashear contraseña con bcrypt
    const passwordHash = await bcrypt.hash(datos.password, 10);

    // 5. Determinar tipo de cliente por defecto según el rol
    let tipoCliente = datos.tipo_cliente;
    if (!tipoCliente) {
      if (rol.nombre === 'ADMINISTRADOR' || rol.nombre === 'OPERADOR_ALMACEN') {
        tipoCliente = 'INTERNO';
      } else if (rol.nombre === 'CLIENTE_CORPORATIVO') {
        tipoCliente = 'CORPORATIVO';
      } else {
        tipoCliente = 'MINORISTA';
      }
    }

    const nuevoUsuario = Usuario.create({
      nombre_completo: datos.nombre_completo.trim(),
      email: emailNormalizado,
      password_hash: passwordHash,
      ci_nit: datos.ci_nit ? datos.ci_nit.trim() : null,
      telefono: datos.telefono ? datos.telefono.trim() : null,
      tipo_cliente: tipoCliente,
      razon_social: datos.razon_social ? datos.razon_social.trim() : null,
      rol_id: Number(datos.rol_id),
      almacen_id: datos.almacen_id ? Number(datos.almacen_id) : null,
      estado: datos.estado || 'ACTIVO',
    });

    return nuevoUsuario;
  }

  /**
   * Actualiza parcialmente la información de un usuario.
   * @param {number} id
   * @param {object} datos
   * @returns {Promise<object>}
   */
  static async actualizarUsuario(id, datos) {
    const usuarioExistente = Usuario.findById(id);
    if (!usuarioExistente) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }

    // Validar duplicidad de email si se intenta cambiar
    if (datos.email && datos.email.trim().toLowerCase() !== usuarioExistente.email.toLowerCase()) {
      const emailDuplicado = Usuario.findByEmail(datos.email.trim().toLowerCase());
      if (emailDuplicado && emailDuplicado.id !== id) {
        const error = new Error(`El email "${datos.email}" ya está en uso por otro usuario.`);
        error.status = 409;
        throw error;
      }
      datos.email = datos.email.trim().toLowerCase();
    }

    // Si se envía nueva contraseña en la actualización de admin
    if (datos.password) {
      const nuevoHash = await bcrypt.hash(datos.password, 10);
      Usuario.cambiarPassword(id, nuevoHash);
      delete datos.password;
    }

    const usuarioActualizado = Usuario.update(id, datos);
    return usuarioActualizado;
  }

  /**
   * Realiza la baja lógica de un usuario (estado INACTIVO).
   * @param {number} id
   * @param {number} idSolicitante
   * @returns {object}
   */
  static inactivarUsuario(id, idSolicitante) {
    if (Number(id) === Number(idSolicitante)) {
      const error = new Error('No es posible inactivar su propia cuenta de administrador.');
      error.status = 400;
      throw error;
    }

    const usuario = Usuario.findById(id);
    if (!usuario) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }

    if (usuario.estado === 'INACTIVO') {
      const error = new Error(`El usuario "${usuario.nombre_completo}" ya se encuentra inactivo.`);
      error.status = 409;
      throw error;
    }

    Usuario.inactivar(id);

    return {
      mensaje: `Usuario "${usuario.nombre_completo}" inactivado exitosamente.`,
    };
  }

  /**
   * Obtiene estadísticas consolidadas del sistema para el panel de administración.
   * @returns {object}
   */
  static obtenerEstadisticas() {
    const statsUsuarios = Usuario.obtenerEstadisticas();
    const loginsHoy = LogAcceso.contarHoy();

    return {
      total: statsUsuarios.total,
      activos: statsUsuarios.activos,
      inactivos: statsUsuarios.inactivos,
      bloqueados: statsUsuarios.bloqueados,
      logins_hoy: loginsHoy,
    };
  }

  /**
   * Consulta registros de auditoría de accesos.
   * @param {object} filtros
   * @returns {object}
   */
  static obtenerLogs(filtros = {}) {
    const logs = LogAcceso.findAll(filtros);
    const total = LogAcceso.count(filtros);

    return {
      total,
      limite: Number(filtros.limite) || 100,
      logs,
    };
  }
}

module.exports = UsuariosService;

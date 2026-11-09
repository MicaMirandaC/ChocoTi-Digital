/**
 * api.js — Capa de Comunicación con la API REST
 * ChocoTi-Digital | Capa 1: Presentación → Capa 2: Control
 *
 * Encapsula todas las llamadas HTTP al backend Express.
 * Maneja tokens JWT, errores HTTP y sesión local.
 */

'use strict';

/* ── Configuración base ── */
const API_BASE = 'http://localhost:3001/api';
const STORAGE_KEY_TOKEN   = 'chocoti_token';
const STORAGE_KEY_USUARIO = 'chocoti_usuario';

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE SESIÓN
   ═══════════════════════════════════════════════════════════════ */

/**
 * Guarda el token y los datos del usuario en localStorage.
 * @param {string} token
 * @param {Object} usuario
 */
function guardarSesion(token, usuario) {
  localStorage.setItem(STORAGE_KEY_TOKEN,   token);
  localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuario));
}

/**
 * Recupera la sesión actual.
 * @returns {{ token: string, usuario: Object } | null}
 */
function obtenerSesion() {
  const token   = localStorage.getItem(STORAGE_KEY_TOKEN);
  const rawUser = localStorage.getItem(STORAGE_KEY_USUARIO);

  if (!token || !rawUser) return null;

  try {
    return { token, usuario: JSON.parse(rawUser) };
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión limpiando localStorage y redirige al login.
 */
function cerrarSesion() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USUARIO);
  window.location.href = resolveLoginPath();
}

/** @returns {boolean} */
function estaAutenticado() {
  return obtenerSesion() !== null;
}

/** @returns {string|null} Nombre del rol activo */
function obtenerRol() {
  const sesion = obtenerSesion();
  return sesion?.usuario?.rol || null;
}

/**
 * Calcula la base relativa hacia /frontend/ según la ubicación actual.
 */
function resolveBaseFrontendPath() {
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/frontend/dashboard/')) {
    return '../../';
  } else if (path.includes('/frontend/auth/')) {
    return '../';
  } else if (path.includes('/frontend/')) {
    return './';
  } else {
    return 'frontend/';
  }
}

/**
 * Calcula la ruta al login relativa a la ubicación actual del archivo HTML.
 * Funciona tanto en la raíz como en /frontend/auth/ o /frontend/dashboard/xxx/
 */
function resolveLoginPath() {
  const base = resolveBaseFrontendPath();
  return `${base}auth/login.html`;
}

/**
 * Calcula el path al dashboard correcto según el rol y la ubicación actual.
 * @param {string} rol
 * @returns {string}
 */
function resolverRutaDashboard(rol) {
  const base = resolveBaseFrontendPath();
  const mapRoles = {
    'ADMINISTRADOR':       `${base}dashboard/admin/index.html`,
    'OPERADOR_ALMACEN':    `${base}dashboard/almacen/index.html`,
    'CLIENTE_MINORISTA':   `${base}dashboard/cliente-minorista/index.html`,
    'CLIENTE_CORPORATIVO': `${base}dashboard/cliente-corporativo/index.html`,
  };
  return mapRoles[rol] || resolveLoginPath();
}

/* ═══════════════════════════════════════════════════════════════
   HELPER DE FETCH
   ═══════════════════════════════════════════════════════════════ */

/**
 * Realiza una petición HTTP autenticada al backend.
 * @param {string} endpoint - Ruta relativa a API_BASE (ej: '/auth/me')
 * @param {RequestInit} [options] - Opciones de fetch
 * @param {boolean} [conAuth=true] - Si debe incluir Bearer token
 * @returns {Promise<Object>} Respuesta JSON parseada
 */
async function request(endpoint, options = {}, conAuth = true) {
  const sesion  = obtenerSesion();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (conAuth && sesion?.token) {
    headers['Authorization'] = `Bearer ${sesion.token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Sesión expirada o token inválido
  if (res.status === 401 && conAuth) {
    cerrarSesion();
    return;
  }

  // Intentar parsear la respuesta como JSON
  let data;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, mensaje: `Error HTTP ${res.status}` };
  }

  // Propagar el status HTTP en el objeto retornado
  data._status = res.status;

  if (!res.ok) {
    const err = new Error(data.mensaje || `Error ${res.status}`);
    err.data  = data;
    err.status = res.status;
    throw err;
  }

  return data;
}

/* ═══════════════════════════════════════════════════════════════
   MÓDULO: AUTH
   ═══════════════════════════════════════════════════════════════ */

const Auth = {
  /**
   * Inicia sesión con email y contraseña.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, usuario: Object}>}
   */
  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  },

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getMe() {
    return request('/auth/me');
  },

  /**
   * Actualiza el perfil personal del usuario.
   * @param {Object} datos - { nombre_completo, telefono, ci_nit, razon_social }
   */
  async updatePerfil(datos) {
    return request('/auth/perfil', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  /**
   * Cambia la contraseña del usuario autenticado.
   * @param {Object} datos - { password_actual, password_nueva, password_confirmar }
   */
  async cambiarPassword(datos) {
    return request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },
};

/* ═══════════════════════════════════════════════════════════════
   MÓDULO: USUARIOS (Admin)
   ═══════════════════════════════════════════════════════════════ */

const Usuarios = {
  /**
   * Lista usuarios con filtros opcionales.
   * @param {Object} [filtros] - { rol_id, almacen_id, estado, tipo_cliente }
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return request(`/usuarios${params ? '?' + params : ''}`);
  },

  /**
   * Crea un nuevo usuario.
   * @param {Object} datos
   */
  async crear(datos) {
    return request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  /**
   * Obtiene un usuario por ID.
   * @param {number} id
   */
  async obtener(id) {
    return request(`/usuarios/${id}`);
  },

  /**
   * Actualiza los datos de un usuario.
   * @param {number} id
   * @param {Object} datos
   */
  async actualizar(id, datos) {
    return request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  /**
   * Inactiva (elimina lógicamente) un usuario.
   * @param {number} id
   */
  async inactivar(id) {
    return request(`/usuarios/${id}`, { method: 'DELETE' });
  },

  /**
   * Obtiene estadísticas globales de usuarios.
   */
  async getStats() {
    return request('/usuarios/stats');
  },

  /**
   * Obtiene la bitácora de accesos.
   * @param {Object} [filtros] - { usuario_id, estado_login, limite }
   */
  async getLogs(filtros = {}) {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return request(`/usuarios/logs${params ? '?' + params : ''}`);
  },
};

/* ═══════════════════════════════════════════════════════════════
   MÓDULO: ALMACENES
   ═══════════════════════════════════════════════════════════════ */

const Almacenes = {
  /** Lista todos los almacenes activos. */
  async listar() {
    return request('/almacenes');
  },

  /**
   * Obtiene un almacén por ID.
   * @param {number} id
   */
  async obtener(id) {
    return request(`/almacenes/${id}`);
  },
};

/* ═══════════════════════════════════════════════════════════════
   EXPORTACIÓN GLOBAL (compatible con scripts de módulos y no-módulos)
   ═══════════════════════════════════════════════════════════════ */

const API = {
  // Auth
  login:          Auth.login.bind(Auth),
  getMe:          Auth.getMe.bind(Auth),
  updatePerfil:   Auth.updatePerfil.bind(Auth),
  cambiarPassword: Auth.cambiarPassword.bind(Auth),

  // Usuarios
  listarUsuarios:    Usuarios.listar.bind(Usuarios),
  crearUsuario:      Usuarios.crear.bind(Usuarios),
  obtenerUsuario:    Usuarios.obtener.bind(Usuarios),
  actualizarUsuario: Usuarios.actualizar.bind(Usuarios),
  inactivarUsuario:  Usuarios.inactivar.bind(Usuarios),
  getStatsUsuarios:  Usuarios.getStats.bind(Usuarios),
  getLogs:           Usuarios.getLogs.bind(Usuarios),

  // Almacenes
  listarAlmacenes: Almacenes.listar.bind(Almacenes),
  obtenerAlmacen:  Almacenes.obtener.bind(Almacenes),

  // Sesión
  guardarSesion,
  obtenerSesion,
  cerrarSesion,
  estaAutenticado,
  obtenerRol,
  resolverRutaDashboard,
  resolveLoginPath,
};

// Exponer globalmente para uso desde <script> tags en HTML
if (typeof window !== 'undefined') window.API = API;

/**
 * auth-guard.js — Protección de rutas por rol
 * ChocoTi-Digital | Capa 1: Presentación
 *
 * Incluir este script en CADA dashboard ANTES de cualquier lógica de página.
 * Uso: <script src="../../shared/js/auth-guard.js"></script>
 *
 * Parámetros configurables por página:
 *   window.ROL_REQUERIDO = 'ADMINISTRADOR' | 'OPERADOR_ALMACEN' | etc.
 */

'use strict';

(function () {
  const sesion = API.obtenerSesion();

  // 1. Si no hay sesión → redirigir al login
  if (!sesion) {
    window.location.replace(API.resolveLoginPath());
    return;
  }

  const rolActual    = sesion.usuario?.rol;
  const rolRequerido = window.ROL_REQUERIDO;

  // 2. Si la página declara un rol requerido y el usuario tiene otro → redirigir al dashboard correcto
  if (rolRequerido && rolActual !== rolRequerido) {
    const rutaCorrecta = API.resolverRutaDashboard(rolActual).replace('../', '../../');
    window.location.replace(rutaCorrecta);
    return;
  }

  // 3. Sesión válida: poblar elementos comunes de UI
  document.addEventListener('DOMContentLoaded', () => {
    const usuario = sesion.usuario;

    // Avatar con iniciales
    const initials = usuario.nombre_completo
      ?.split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?';

    document.querySelectorAll('[data-auth="avatar"]').forEach(el => {
      el.textContent = initials;
    });

    document.querySelectorAll('[data-auth="nombre"]').forEach(el => {
      el.textContent = usuario.nombre_completo || 'Usuario';
    });

    document.querySelectorAll('[data-auth="email"]').forEach(el => {
      el.textContent = usuario.email || '';
    });

    document.querySelectorAll('[data-auth="rol"]').forEach(el => {
      el.textContent = usuario.rol || '';
    });

    document.querySelectorAll('[data-auth="almacen"]').forEach(el => {
      el.textContent = usuario.almacen_nombre || '—';
    });

    // Clases de color según rol
    const rolClases = {
      'ADMINISTRADOR':       ['role-admin', 'badge--admin'],
      'OPERADOR_ALMACEN':    ['role-oper',  'badge--operador'],
      'CLIENTE_MINORISTA':   ['role-min',   'badge--minorista'],
      'CLIENTE_CORPORATIVO': ['role-corp',  'badge--corporativo'],
    };
    const clases = rolClases[rolActual] || [];

    document.querySelectorAll('[data-auth="role-badge"]').forEach(el => {
      el.classList.add('badge', ...clases);
    });

    document.querySelectorAll('[data-auth="sidebar-role-badge"]').forEach(el => {
      el.classList.add('sidebar__role-badge', clases[0] || '');
    });

    // Botones de cerrar sesión
    document.querySelectorAll('[data-action="logout"]').forEach(el => {
      el.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          API.cerrarSesion();
        }
      });
    });

    // Hamburguesa (sidebar mobile)
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar   = document.querySelector('.sidebar');
    if (hamburger && sidebar) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      // Cerrar sidebar al hacer click fuera (overlay)
      document.addEventListener('click', e => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== hamburger) {
          sidebar.classList.remove('open');
        }
      });
    }

    // Navegación de secciones del dashboard
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.dataset.nav;

        // Activar nav item
        document.querySelectorAll('[data-nav]').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Mostrar sección correspondiente
        document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');

        // En mobile, cerrar el sidebar
        sidebar?.classList.remove('open');
      });
    });
  });
})();

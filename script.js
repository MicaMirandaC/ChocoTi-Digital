/**
 * script.js — ChocoTi-Digital Landing Page
 * Chocolates Para Ti | Sucre, Bolivia
 *
 * Módulos:
 *  1. Lucide Icons Init
 *  2. Header Sticky + Active Nav Links
 *  3. Menú Hamburguesa Responsivo
 *  4. Animaciones de Entrada (IntersectionObserver)
 *  5. Selector de Moneda (BOB / USD)
 *  6. Contador Animado de Estadísticas
 *  7. Filtrado de Productos por Categoría
 *  8. Carrito de Compras
 *  9. Sistema de Toast Notifications
 * 10. Simulador de Rastreo de Pedidos
 * 11. Validación de Formulario Corporativo B2B
 * 12. Validación de Formulario de Contacto
 * 13. Init General
 */

'use strict';

/* ============================================================
   CONSTANTES Y ESTADO GLOBAL
   ============================================================ */

/** Tasa de cambio aproximada BOB → USD */
const BOB_TO_USD = 0.144;

/** Estado global de la aplicación */
const appState = {
  currency: 'BOB',        // moneda activa
  cart: [],               // artículos en el carrito
  statsAnimated: false,   // bandera para animar estadísticas una sola vez
};

/* ============================================================
   1. INICIALIZACIÓN DE LUCIDE ICONS
   ============================================================ */

/**
 * Reemplaza todos los elementos <i data-lucide="..."> con SVGs inline.
 * Se llama al cargar el DOM y cada vez que se inyecte nuevo HTML dinámico.
 */
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/* ============================================================
   2. HEADER STICKY + ACTIVE NAV LINKS
   ============================================================ */

function initHeader() {
  const header   = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav__link');

  // Agrega clase 'scrolled' cuando la página hace scroll
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);

    // Resalta el enlace de nav activo según la sección visible
    highlightActiveNavLink(navLinks);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // ejecuta una vez al inicio para el estado correcto
}

/**
 * Marca el enlace de navegación que corresponde a la sección
 * actualmente visible en el viewport.
 * @param {NodeList} navLinks
 */
function highlightActiveNavLink(navLinks) {
  const sections = document.querySelectorAll('section[id], main[id]');
  let currentId  = '';

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom >= 100) {
      currentId = section.id;
    }
  });

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === `#${currentId}`);
  });
}

/* ============================================================
   3. MENÚ HAMBURGUESA RESPONSIVO
   ============================================================ */

function initHamburger() {
  const hamburger  = document.getElementById('hamburger');
  const nav        = document.getElementById('nav');
  const navOverlay = document.getElementById('navOverlay');

  if (!hamburger || !nav || !navOverlay) return;

  /** Abre / cierra el menú móvil */
  function toggleMenu(forceClose = false) {
    const isOpen = !forceClose && !nav.classList.contains('open');

    nav.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    navOverlay.classList.toggle('visible', isOpen);

    hamburger.setAttribute('aria-expanded', String(isOpen));
    nav.setAttribute('aria-hidden', String(!isOpen));

    // Bloquear scroll del body cuando el menú está abierto
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click',  () => toggleMenu());
  navOverlay.addEventListener('click', () => toggleMenu(true));

  // Cierra el menú al hacer clic en cualquier enlace de nav
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  // Cierra el menú con la tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      toggleMenu(true);
    }
  });
}

/* ============================================================
   4. ANIMACIONES DE ENTRADA (IntersectionObserver)
   ============================================================ */

function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => {
          entry.target.classList.add('animated');
        }, delay);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   5. SELECTOR DE MONEDA (BOB / USD)
   ============================================================ */

function initCurrencySelector() {
  const currencyBtns = document.querySelectorAll('.currency-btn');

  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currency = btn.dataset.currency;
      if (currency === appState.currency) return;

      appState.currency = currency;

      // Actualiza estado visual de los botones
      currencyBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.currency === currency);
        b.setAttribute('aria-pressed', String(b.dataset.currency === currency));
      });

      // Actualiza todos los precios visibles en el catálogo
      updateAllPrices();
    });
  });
}

/**
 * Actualiza los precios de todos los productos en la vista
 * según la moneda activa.
 */
function updateAllPrices() {
  const priceEls = document.querySelectorAll('.product-card__price');

  priceEls.forEach(el => {
    const priceBOB = parseFloat(el.dataset.priceBob);
    const priceUSD = parseFloat(el.dataset.priceUsd);

    if (appState.currency === 'USD') {
      el.textContent = `$${priceUSD.toFixed(2)} USD`;
    } else {
      el.textContent = `Bs. ${priceBOB}`;
    }
  });
}

/* ============================================================
   6. CONTADOR ANIMADO DE ESTADÍSTICAS
   ============================================================ */

function initStatsCounter() {
  const statsSection = document.querySelector('.benefits__stats');
  if (!statsSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !appState.statsAnimated) {
          appState.statsAnimated = true;
          animateCounters();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(statsSection);
}

/**
 * Anima todos los contadores [data-count] desde 0 hasta su valor destino.
 */
function animateCounters() {
  const counters = document.querySelectorAll('[data-count]');

  counters.forEach(counter => {
    const target   = parseInt(counter.dataset.count, 10);
    const duration = 1800; // ms
    const steps    = 60;
    const stepTime = duration / steps;
    let current    = 0;

    const increment = Math.ceil(target / steps);

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      counter.textContent = current.toLocaleString('es-BO');

      if (current >= target) {
        clearInterval(timer);
        counter.textContent = target.toLocaleString('es-BO');
      }
    }, stepTime);
  });
}

/* ============================================================
   7. FILTRADO DE PRODUCTOS POR CATEGORÍA
   ============================================================ */

function initProductFilter() {
  const tabBtns     = document.querySelectorAll('.tab-btn');
  const productCards = document.querySelectorAll('.product-card');

  if (!tabBtns.length || !productCards.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Actualizar estado activo de los tabs
      tabBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      // Filtrar tarjetas con animación suave
      productCards.forEach(card => {
        const category = card.dataset.category;
        const matches  = filter === 'all' || category === filter;

        if (matches) {
          card.classList.remove('hidden');
          card.style.animation = 'none';
          // Force reflow para reiniciar la animación
          void card.offsetWidth;
          card.style.animation = '';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ============================================================
   8. CARRITO DE COMPRAS
   ============================================================ */

function initCart() {
  const cartBtn        = document.getElementById('cartBtn');
  const cartModal      = document.getElementById('cartModal');
  const cartModalClose = document.getElementById('cartModalClose');
  const cartCount      = document.getElementById('cartCount');
  const cartItems      = document.getElementById('cartItems');
  const cartEmpty      = document.getElementById('cartEmpty');
  const cartFooter     = document.getElementById('cartFooter');
  const cartTotal      = document.getElementById('cartTotal');
  const checkoutBtn    = document.getElementById('checkoutBtn');

  if (!cartBtn) return;

  // Botones "Añadir al Carrito"
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const name  = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      addToCart(name, price);
    });
  });

  // Abrir el modal del carrito
  cartBtn.addEventListener('click', () => {
    renderCartModal();
    cartModal.hidden = false;
    document.body.style.overflow = 'hidden';
    trapFocus(cartModal);
  });

  // Cerrar el modal
  function closeCart() {
    cartModal.hidden = true;
    document.body.style.overflow = '';
    cartBtn.focus();
  }

  cartModalClose.addEventListener('click', closeCart);

  cartModal.addEventListener('click', e => {
    if (e.target === cartModal) closeCart();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !cartModal.hidden) closeCart();
  });

  // Checkout simulado
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (appState.cart.length === 0) return;
      showToast('🎉 Generando código QR de pago... ¡Redirigiendo a QR Simple!', 'success');
      closeCart();
    });
  }

  /**
   * Agrega un artículo al carrito o incrementa su cantidad si ya existe.
   * @param {string} name  - Nombre del producto
   * @param {number} price - Precio en BOB
   */
  function addToCart(name, price) {
    const existing = appState.cart.find(item => item.name === name);

    if (existing) {
      existing.qty += 1;
    } else {
      appState.cart.push({ name, price, qty: 1 });
    }

    updateCartCount();
    showToast(`🍫 "${name}" añadido al carrito`, 'success');

    // Animación del contador del carrito
    cartCount.classList.remove('bump');
    void cartCount.offsetWidth;
    cartCount.classList.add('bump');
  }

  /** Actualiza el contador del carrito en el header */
  function updateCartCount() {
    const total = appState.cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = total;
  }

  /** Renderiza el contenido del modal del carrito */
  function renderCartModal() {
    // Limpiar items previos (excepto el mensaje de vacío)
    const existingItems = cartItems.querySelectorAll('.cart-item');
    existingItems.forEach(el => el.remove());

    if (appState.cart.length === 0) {
      cartEmpty.hidden = false;
      cartFooter.hidden = true;
      return;
    }

    cartEmpty.hidden = true;
    cartFooter.hidden = false;

    let total = 0;

    appState.cart.forEach((item, idx) => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      // Emoji basado en el nombre (heurística simple)
      const emoji = getProductEmoji(item.name);

      const cartItemEl = document.createElement('article');
      cartItemEl.className = 'cart-item';
      cartItemEl.setAttribute('aria-label', `${item.name}, cantidad ${item.qty}`);
      cartItemEl.innerHTML = `
        <div class="cart-item__emoji" aria-hidden="true">${emoji}</div>
        <div class="cart-item__info">
          <div class="cart-item__name">${escapeHtml(item.name)}</div>
          <div class="cart-item__price">Bs. ${(item.price * item.qty).toFixed(0)}</div>
        </div>
        <div class="cart-item__qty">
          <button class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Reducir cantidad de ${item.name}">−</button>
          <span class="qty-value" aria-label="Cantidad">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar cantidad de ${item.name}">+</button>
        </div>
        <button class="cart-item__remove" data-idx="${idx}" aria-label="Eliminar ${item.name} del carrito">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      cartItems.appendChild(cartItemEl);
    });

    // Actualizar total
    cartTotal.textContent = `Bs. ${total.toFixed(0)}`;

    // Re-inicializar iconos en el nuevo HTML
    initIcons();

    // Botones de cantidad y eliminar
    cartItems.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx    = parseInt(btn.dataset.idx, 10);
        const action = btn.dataset.action;
        if (action === 'inc') {
          appState.cart[idx].qty += 1;
        } else {
          appState.cart[idx].qty -= 1;
          if (appState.cart[idx].qty <= 0) {
            appState.cart.splice(idx, 1);
          }
        }
        updateCartCount();
        renderCartModal();
      });
    });

    cartItems.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const removedName = appState.cart[idx].name;
        appState.cart.splice(idx, 1);
        updateCartCount();
        renderCartModal();
        showToast(`🗑️ "${removedName}" eliminado del carrito`);
      });
    });
  }

  /**
   * Retorna un emoji representativo según el nombre del producto.
   * @param {string} name
   * @returns {string}
   */
  function getProductEmoji(name) {
    const lower = name.toLowerCase();
    if (lower.includes('maracuyá') || lower.includes('almendra') || lower.includes('bombón'))  return '🍬';
    if (lower.includes('tableta'))   return '🍫';
    if (lower.includes('canasta'))   return '🎀';
    if (lower.includes('kit') || lower.includes('corporativ')) return '🎁';
    if (lower.includes('valentín') || lower.includes('aniversario')) return '✨';
    return '🍫';
  }

  /**
   * Escapa caracteres HTML para prevenir XSS en contenido dinámico.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Atrapa el foco dentro de un elemento modal para accesibilidad.
   * @param {HTMLElement} modal
   */
  function trapFocus(modal) {
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableEls       = Array.from(modal.querySelectorAll(focusableSelectors));
    if (!focusableEls.length) return;

    const firstEl = focusableEls[0];
    const lastEl  = focusableEls[focusableEls.length - 1];

    firstEl.focus();

    modal.addEventListener('keydown', function handler(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }

      // Limpiar si el modal se cierra
      if (modal.hidden) modal.removeEventListener('keydown', handler);
    });
  }
}

/* ============================================================
   9. SISTEMA DE TOAST NOTIFICATIONS
   ============================================================ */

/**
 * Muestra una notificación toast temporal.
 * @param {string} message      - Texto del mensaje
 * @param {'default'|'success'|'error'} type - Tipo visual
 * @param {number} duration     - Tiempo en ms antes de desaparecer
 */
function showToast(message, type = 'default', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    default: '🍫',
    success: '✅',
    error:   '❌',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] || icons.default}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remover tras la duración indicada
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ============================================================
   10. SIMULADOR DE RASTREO DE PEDIDOS
   ============================================================ */

function initTrackingWidget() {
  const trackingForm   = document.getElementById('trackingForm');
  const trackingInput  = document.getElementById('trackingNumber');
  const trackingResult = document.getElementById('trackingResult');
  const trackResultId  = document.getElementById('trackResultId');
  const trackResultStatus = document.getElementById('trackResultStatus');
  const trackTimeline  = document.getElementById('trackTimeline');

  if (!trackingForm) return;

  /**
   * Genera datos simulados de tracking según el número de guía.
   * En producción, esto sería una llamada a la API real de la empresa de courier.
   * @param {string} guide
   * @returns {Object} datos del pedido simulado
   */
  function generateTrackingData(guide) {
    // Simular diferentes estados según el sufijo del número de guía
    const lastChar  = guide.slice(-1).toUpperCase();
    const scenarios = {
      'A': 'process',
      'B': 'process',
      '1': 'transit',
      '2': 'transit',
      '3': 'transit',
      'Z': 'delivered',
      'X': 'delivered',
    };

    const status = scenarios[lastChar] || 'transit';

    const stepsBase = [
      { label: 'Pedido confirmado',       desc: 'Sucre, Bolivia — Planta Central',              done: true,   icon: '✅' },
      { label: 'En preparación',          desc: 'Empacando y verificando calidad',               done: true,   icon: '✅' },
      { label: 'Despachado de fábrica',   desc: 'Entregado a empresa de courier',                done: status !== 'process', icon: status !== 'process' ? '✅' : '⏳' },
      { label: 'En tránsito',             desc: 'En camino a la ciudad de destino',              done: status === 'delivered', active: status === 'transit', icon: status === 'delivered' ? '✅' : status === 'transit' ? '🚚' : '⏳' },
      { label: 'Entregado al destinatario', desc: 'Pedido entregado con éxito',                 done: status === 'delivered', icon: status === 'delivered' ? '✅' : '📦' },
    ];

    const statusLabels = {
      process:   { text: '⚙️ En preparación', css: 'status--process' },
      transit:   { text: '🚚 En tránsito',     css: 'status--transit' },
      delivered: { text: '✅ Entregado',        css: 'status--delivered' },
    };

    return { steps: stepsBase, status: statusLabels[status] };
  }

  trackingForm.addEventListener('submit', e => {
    e.preventDefault();
    const guide = trackingInput.value.trim();

    if (!guide) {
      showToast('⚠️ Por favor ingresa un número de guía válido', 'error');
      trackingInput.focus();
      return;
    }

    // Simular un breve "cargando"
    const submitBtn = trackingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Buscando...';
    initIcons();

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="search"></i> Rastrear';
      initIcons();

      const data = generateTrackingData(guide);

      // Renderizar resultado
      trackResultId.textContent = guide.toUpperCase();
      trackResultStatus.textContent = data.status.text;
      trackResultStatus.className    = `tracking__result-status ${data.status.css}`;

      // Limpiar y renderizar pasos del timeline
      trackTimeline.innerHTML = '';

      data.steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'timeline-step';
        stepEl.setAttribute('role', 'listitem');

        const dotClass = step.done
          ? 'timeline-step__dot--done'
          : step.active
          ? 'timeline-step__dot--active'
          : 'timeline-step__dot--pending';

        stepEl.innerHTML = `
          <div class="timeline-step__dot ${dotClass}" aria-hidden="true">${step.icon}</div>
          <div class="timeline-step__content">
            <h4>${step.label}</h4>
            <p>${step.desc}</p>
          </div>
        `;
        trackTimeline.appendChild(stepEl);
      });

      trackingResult.hidden = false;
      trackingResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1200);
  });
}

/* ============================================================
   11. VALIDACIÓN DEL FORMULARIO CORPORATIVO B2B
   ============================================================ */

function initB2BForm() {
  const form = document.getElementById('b2bForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const isValid = validateB2BForm(form);
    if (!isValid) return;

    // Simular envío exitoso
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Enviando solicitud...';
    initIcons();

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send"></i> Enviar Solicitud de Cotización';
      initIcons();

      showToast('🎉 ¡Solicitud enviada! Te contactaremos en menos de 24 horas hábiles.', 'success', 5000);
      form.reset();

      // Limpiar errores visuales
      form.querySelectorAll('.form__input.error').forEach(el => el.classList.remove('error'));
      form.querySelectorAll('.form__error.visible').forEach(el => el.classList.remove('visible'));
    }, 1800);
  });

  // Validación en tiempo real al salir de cada campo
  form.querySelectorAll('.form__input').forEach(input => {
    input.addEventListener('blur', () => validateSingleInput(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateSingleInput(input);
    });
  });
}

/**
 * Valida todos los campos del formulario B2B.
 * @param {HTMLFormElement} form
 * @returns {boolean} true si todo es válido
 */
function validateB2BForm(form) {
  let valid = true;

  // Nombre de empresa
  const companyName = form.querySelector('#companyName');
  if (!companyName.value.trim() || companyName.value.trim().length < 3) {
    showFieldError(companyName, 'companyNameError', 'El nombre de la empresa es requerido (mínimo 3 caracteres).');
    valid = false;
  } else {
    clearFieldError(companyName, 'companyNameError');
  }

  // NIT
  const nit = form.querySelector('#nit');
  if (!nit.value.trim() || !/^\d{7,15}$/.test(nit.value.trim())) {
    showFieldError(nit, 'nitError', 'Ingresa un NIT válido (solo números, 7-15 dígitos).');
    valid = false;
  } else {
    clearFieldError(nit, 'nitError');
  }

  // Cantidad
  const quantity = form.querySelector('#quantity');
  if (!quantity.value || parseInt(quantity.value, 10) < 50) {
    showFieldError(quantity, 'quantityError', 'La cantidad mínima para pedidos corporativos es 50 unidades.');
    valid = false;
  } else {
    clearFieldError(quantity, 'quantityError');
  }

  // Fecha de entrega
  const deliveryDate = form.querySelector('#deliveryDate');
  const today        = new Date();
  const selectedDate = deliveryDate.value ? new Date(deliveryDate.value) : null;

  if (!deliveryDate.value || (selectedDate && selectedDate <= today)) {
    showFieldError(deliveryDate, 'deliveryDateError', 'Selecciona una fecha de entrega futura.');
    valid = false;
  } else {
    clearFieldError(deliveryDate, 'deliveryDateError');
  }

  if (!valid) {
    showToast('⚠️ Por favor corrige los errores antes de enviar.', 'error');
  }

  return valid;
}

/**
 * Valida un único campo del formulario y actualiza su estado visual.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input
 */
function validateSingleInput(input) {
  const errorId = `${input.id}Error`;
  const errorEl = document.getElementById(errorId);
  if (!errorEl) return;

  if (input.required && !input.value.trim()) {
    showFieldError(input, errorId, 'Este campo es requerido.');
  } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
    showFieldError(input, errorId, 'Ingresa un correo electrónico válido.');
  } else {
    clearFieldError(input, errorId);
  }
}

/**
 * Muestra un mensaje de error en un campo.
 * @param {HTMLElement} input
 * @param {string} errorId
 * @param {string} message
 */
function showFieldError(input, errorId, message) {
  input.classList.add('error');
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

/**
 * Limpia el error de un campo.
 * @param {HTMLElement} input
 * @param {string} errorId
 */
function clearFieldError(input, errorId) {
  input.classList.remove('error');
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

/* ============================================================
   12. VALIDACIÓN DEL FORMULARIO DE CONTACTO GENERAL
   ============================================================ */

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const isValid = validateContactForm(form);
    if (!isValid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader"></i> Enviando mensaje...';
    initIcons();

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send"></i> Enviar Mensaje';
      initIcons();

      showToast('✉️ ¡Mensaje enviado! Te responderemos en menos de 2 horas hábiles.', 'success', 5000);
      form.reset();

      form.querySelectorAll('.form__input.error').forEach(el => el.classList.remove('error'));
      form.querySelectorAll('.form__error.visible').forEach(el => el.classList.remove('visible'));
    }, 1500);
  });

  // Validación en tiempo real
  form.querySelectorAll('.form__input').forEach(input => {
    input.addEventListener('blur', () => validateSingleInput(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateSingleInput(input);
    });
  });
}

/**
 * Valida todos los campos del formulario de contacto.
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function validateContactForm(form) {
  let valid = true;

  // Nombre
  const name = form.querySelector('#contactName');
  if (!name.value.trim() || name.value.trim().length < 2) {
    showFieldError(name, 'contactNameError', 'Por favor ingresa tu nombre completo.');
    valid = false;
  } else {
    clearFieldError(name, 'contactNameError');
  }

  // Email
  const email = form.querySelector('#contactEmail');
  if (!email.value.trim() || !isValidEmail(email.value)) {
    showFieldError(email, 'contactEmailError', 'Ingresa un correo electrónico válido.');
    valid = false;
  } else {
    clearFieldError(email, 'contactEmailError');
  }

  // Mensaje
  const message = form.querySelector('#contactMessage');
  if (!message.value.trim() || message.value.trim().length < 10) {
    showFieldError(message, 'contactMessageError', 'El mensaje debe tener al menos 10 caracteres.');
    valid = false;
  } else {
    clearFieldError(message, 'contactMessageError');
  }

  if (!valid) {
    showToast('⚠️ Por favor revisa los campos marcados en rojo.', 'error');
  }

  return valid;
}

/**
 * Valida el formato de un correo electrónico.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ============================================================
   13. INICIALIZACIÓN GENERAL
   ============================================================ */

/**
 * Punto de entrada principal.
 * Se ejecuta cuando el DOM está completamente cargado.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar todos los módulos en orden
  initIcons();             // 1. Iconos SVG
  initHeader();            // 2. Navegación sticky y enlaces activos
  initHamburger();         // 3. Menú hamburguesa móvil
  initScrollAnimations();  // 4. Animaciones de entrada al hacer scroll
  initCurrencySelector();  // 5. Selector BOB / USD
  initStatsCounter();      // 6. Contadores animados de estadísticas
  initProductFilter();     // 7. Filtrado de productos por categoría
  initCart();              // 8. Carrito de compras interactivo
  initTrackingWidget();    // 10. Simulador de rastreo de pedidos
  initB2BForm();           // 11. Formulario corporativo B2B
  initContactForm();       // 12. Formulario de contacto general

  // Toast de bienvenida
  setTimeout(() => {
    showToast('🍫 ¡Bienvenido a ChocoTi-Digital! El sabor de Sucre en tu pantalla.', 'success', 4000);
  }, 1000);

  // Inicializar iconos nuevamente tras cualquier inyección dinámica tardía
  window.addEventListener('load', initIcons);

  console.info('🍫 ChocoTi-Digital iniciado correctamente — Chocolates Para Ti, Sucre Bolivia.');
});

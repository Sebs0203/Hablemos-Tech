(function () {
  'use strict';

  var modalRoot = null;
  var panel = null;
  var nextUrl = null;
  var lastFocus = null;
  var previousTitle = document.title;

  var TEMPLATE =
    '<div class="auth-modal" id="auth-modal" hidden aria-hidden="true">' +
      '<div class="auth-modal__backdrop" data-auth-close tabindex="-1"></div>' +
      '<div class="auth-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">' +
        '<button class="auth-modal__cerrar" type="button" data-auth-close aria-label="Cerrar">' +
          '<span class="menu-icon" aria-hidden="true">' +
            '<span class="menu-icon__linea"></span>' +
            '<span class="menu-icon__linea"></span>' +
          '</span>' +
        '</button>' +
        '<div class="auth-modal__layout">' +
          '<aside class="auth-modal__aside" aria-hidden="true">' +
            '<img class="auth-modal__logo" src="/components/hero-marca/logo.svg" alt="" width="626" height="208">' +
            '<p class="auth-modal__eyebrow">Revista digital</p>' +
            '<p class="auth-modal__aside-lead">Contenido editorial para quienes deciden infraestructura, nube y seguridad en México.</p>' +
            '<ul class="auth-modal__lista">' +
              '<li><span class="auth-modal__marca" aria-hidden="true">✱</span>Acceso gratuito con registro</li>' +
              '<li><span class="auth-modal__marca" aria-hidden="true">✱</span>Email corporativo · acceso inmediato</li>' +
              '<li><span class="auth-modal__marca" aria-hidden="true">✱</span>Artículos en web y PDF</li>' +
            '</ul>' +
          '</aside>' +
          '<div class="auth-modal__panel">' +
            '<div class="auth-modal__panel-head">' +
              '<p class="auth-modal__eyebrow auth-modal__eyebrow--movil">Revista digital</p>' +
              '<div class="auth-modal__tabs" role="tablist" aria-label="Acceso a la cuenta">' +
                '<button class="auth-modal__tab" type="button" role="tab" id="auth-tab-registro" data-auth-tab="registro" data-auth-switch="registro" aria-selected="true" aria-controls="auth-vista-registro">Registro</button>' +
                '<button class="auth-modal__tab" type="button" role="tab" id="auth-tab-signin" data-auth-tab="sign-in" data-auth-switch="sign-in" aria-selected="false" aria-controls="auth-vista-signin">Sign in</button>' +
              '</div>' +
            '</div>' +
            '<div class="auth-modal__vistas">' +
            '<div class="auth-modal__vista" id="auth-vista-registro" data-auth-vista="registro" role="tabpanel" aria-labelledby="auth-tab-registro">' +
              '<div class="auth-modal__cabecera">' +
                '<h2 class="auth-modal__titulo" id="auth-modal-title">Crea tu cuenta</h2>' +
                '<p class="auth-lead">Regístrate gratis y accede a la revista completa.</p>' +
              '</div>' +
              '<div class="auth-alert" id="auth-alert-registro" hidden data-tipo="info"></div>' +
              '<form class="auth-form" id="registro-form">' +
                '<div class="auth-form__campos">' +
                  '<div class="auth-campo"><label class="auth-etiqueta" for="registro-name">Nombre completo</label><input class="auth-input" id="registro-name" name="name" type="text" autocomplete="name" placeholder="Tu nombre" required></div>' +
                  '<div class="auth-campo"><label class="auth-etiqueta" for="registro-email">Correo electrónico</label><input class="auth-input" id="registro-email" name="email" type="email" autocomplete="email" placeholder="nombre@empresa.com" required></div>' +
                  '<div class="auth-campo"><label class="auth-etiqueta" for="registro-password">Contraseña</label><input class="auth-input" id="registro-password" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="Mínimo 8 caracteres" required></div>' +
                '</div>' +
                '<div class="auth-form__grupo">' +
                  '<p class="auth-form__subtitulo">Información profesional</p>' +
                  '<div class="auth-form__grid auth-form__grid--modal">' +
                    '<div class="auth-campo"><label class="auth-etiqueta" for="registro-company">Empresa</label><input class="auth-input" id="registro-company" name="company" type="text" autocomplete="organization" placeholder="Nombre de tu empresa" required></div>' +
                    '<div class="auth-campo"><label class="auth-etiqueta" for="registro-role">Área</label><select class="auth-select" id="registro-role" name="role_area" required><option value="" disabled selected>Selecciona tu área</option><option value="TI / Infraestructura">TI / Infraestructura</option><option value="Ciberseguridad">Ciberseguridad</option><option value="Nube / DevOps">Nube / DevOps</option><option value="Directivo de TI">Directivo de TI</option><option value="Otro">Otro</option></select></div>' +
                  '</div>' +
                '</div>' +
                '<div class="auth-form__accion">' +
                  '<button class="boton boton--principal boton--ancho" type="submit">Crear cuenta</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '<div class="auth-modal__vista" id="auth-vista-signin" data-auth-vista="sign-in" role="tabpanel" aria-labelledby="auth-tab-signin" hidden>' +
              '<div class="auth-modal__cabecera">' +
                '<h2 class="auth-modal__titulo">Bienvenido de vuelta</h2>' +
                '<p class="auth-lead">Inicia sesión para leer la revista y gestionar tu cuenta.</p>' +
              '</div>' +
              '<div class="auth-alert" id="auth-alert-signin" hidden data-tipo="info"></div>' +
              '<form class="auth-form" id="signin-form">' +
                '<div class="auth-form__campos">' +
                  '<div class="auth-campo"><label class="auth-etiqueta" for="signin-email">Correo electrónico</label><input class="auth-input" id="signin-email" name="email" type="email" autocomplete="email" placeholder="nombre@empresa.com" required></div>' +
                  '<div class="auth-campo"><label class="auth-etiqueta" for="signin-password">Contraseña</label><input class="auth-input" id="signin-password" name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña" required></div>' +
                '</div>' +
                '<div class="auth-form__accion">' +
                  '<button class="boton boton--principal boton--ancho" type="submit">Entrar</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '<div class="auth-modal__vista" id="auth-vista-completar" data-auth-vista="completar" role="tabpanel" hidden>' +
              '<div class="auth-modal__cabecera">' +
                '<h2 class="auth-modal__titulo">Completa tu perfil</h2>' +
                '<p class="auth-lead">Empresa y área son necesarias para activar tu acceso a la revista.</p>' +
              '</div>' +
              '<div class="auth-alert" id="auth-alert-completar" hidden data-tipo="info"></div>' +
              '<form class="auth-form" id="completar-form">' +
                '<div class="auth-form__grupo">' +
                  '<p class="auth-form__subtitulo">Información profesional</p>' +
                  '<div class="auth-form__grid auth-form__grid--modal">' +
                    '<div class="auth-campo"><label class="auth-etiqueta" for="completar-company">Empresa</label><input class="auth-input" id="completar-company" name="company" type="text" autocomplete="organization" placeholder="Nombre de tu empresa" required></div>' +
                    '<div class="auth-campo"><label class="auth-etiqueta" for="completar-role">Área</label><select class="auth-select" id="completar-role" name="role_area" required><option value="" disabled selected>Selecciona tu área</option><option value="TI / Infraestructura">TI / Infraestructura</option><option value="Ciberseguridad">Ciberseguridad</option><option value="Nube / DevOps">Nube / DevOps</option><option value="Directivo de TI">Directivo de TI</option><option value="Otro">Otro</option></select></div>' +
                  '</div>' +
                '</div>' +
                '<div class="auth-form__accion">' +
                  '<button class="boton boton--principal boton--ancho" type="submit">Guardar y continuar</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function mount() {
    var existing = document.getElementById('auth-modal');
    if (existing && existing.querySelector('#completar-form')) {
      modalRoot = existing;
      panel = modalRoot.querySelector('.auth-modal__dialog');
      return;
    }

    if (existing) existing.remove();

    var wrap = document.createElement('div');
    wrap.innerHTML = TEMPLATE;
    modalRoot = wrap.firstChild;
    document.documentElement.appendChild(modalRoot);
    panel = modalRoot.querySelector('.auth-modal__dialog');
  }

  function alertBoxId(view) {
    if (view === 'sign-in') return 'auth-alert-signin';
    if (view === 'completar') return 'auth-alert-completar';
    return 'auth-alert-registro';
  }

  function showAlert(view, message, type) {
    var box = document.getElementById(alertBoxId(view));
    if (!box) return;
    var layout = modalRoot ? modalRoot.querySelector('.auth-modal__layout') : null;
    var fromHeight = layout ? layout.offsetHeight : 0;
    box.hidden = false;
    box.textContent = message;
    box.dataset.tipo = type || 'info';
    if (!modalRoot.hidden) {
      requestAnimationFrame(function () {
        syncLayoutHeight(true, fromHeight);
      });
    }
  }

  function clearAlerts() {
    ['auth-alert-registro', 'auth-alert-signin', 'auth-alert-completar'].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.hidden = true;
      box.textContent = '';
    });
  }

  function readProfessionalFields(prefix) {
    var companyEl = document.getElementById(prefix + '-company');
    var roleEl = document.getElementById(prefix + '-role');
    return {
      company: String(companyEl && companyEl.value ? companyEl.value : '').trim(),
      role_area: String(roleEl && roleEl.value ? roleEl.value : '').trim()
    };
  }

  function viewportHeight() {
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  }

  function getMaxLayoutHeight() {
    var styles = getComputedStyle(modalRoot);
    var padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    return Math.max(240, Math.floor(viewportHeight() - padY - 12));
  }

  function syncLayoutHeight(animate, fromHeight) {
    if (!modalRoot) return;
    var layout = modalRoot.querySelector('.auth-modal__layout');
    var panel = modalRoot.querySelector('.auth-modal__panel');
    var vistas = modalRoot.querySelector('.auth-modal__vistas');
    if (!layout) return;

    var maxHeight = getMaxLayoutHeight();
    var startHeight = typeof fromHeight === 'number' && fromHeight > 0 ? fromHeight : layout.offsetHeight;

    layout.style.transition = 'none';
    layout.style.height = 'auto';

    var naturalHeight = layout.scrollHeight;
    var targetHeight = Math.min(naturalHeight, maxHeight);
    var needsScroll = naturalHeight > maxHeight;

    if (panel) {
      panel.classList.toggle('auth-modal__panel--scroll', needsScroll);
    }

    if (vistas && needsScroll) {
      vistas.scrollTop = 0;
    }

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var shouldAnimate = animate && !reducedMotion && startHeight > 0 && Math.abs(startHeight - targetHeight) > 1;

    if (!shouldAnimate) {
      layout.style.height = targetHeight + 'px';
      layout.style.transition = '';
      return;
    }

    layout.style.height = startHeight + 'px';
    void layout.offsetHeight;
    layout.style.transition = 'height 460ms var(--menu-ease-out)';
    layout.style.height = targetHeight + 'px';

    function onTransitionEnd(event) {
      if (event.propertyName !== 'height' || event.target !== layout) return;
      layout.removeEventListener('transitionend', onTransitionEnd);
    }

    layout.addEventListener('transitionend', onTransitionEnd);
  }

  function setView(view, options) {
    options = options || {};
    var animate = options.animate === true && modalRoot && !modalRoot.hidden;
    var layout = modalRoot ? modalRoot.querySelector('.auth-modal__layout') : null;
    var fromHeight = animate && layout ? layout.offsetHeight : 0;

    modalRoot.dataset.vista = view;

    modalRoot.querySelectorAll('[data-auth-vista]').forEach(function (node) {
      var active = node.dataset.authVista === view;
      node.hidden = !active;
      node.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    modalRoot.querySelectorAll('[data-auth-tab]').forEach(function (tab) {
      var active = tab.dataset.authTab === view;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    var heading = modalRoot.querySelector('[data-auth-vista="' + view + '"] .auth-modal__titulo');
    if (heading) heading.id = 'auth-modal-title';

    if (view === 'completar') {
      var pending = HTAuth.getPendingProfile();
      if (pending) {
        var companyEl = document.getElementById('completar-company');
        var roleEl = document.getElementById('completar-role');
        if (companyEl && !companyEl.value) companyEl.value = pending.company;
        if (roleEl && pending.role_area) roleEl.value = pending.role_area;
      }
    }

    var vistas = modalRoot.querySelector('.auth-modal__vistas');
    if (vistas) vistas.scrollTop = 0;

    if (!modalRoot.hidden) {
      requestAnimationFrame(function () {
        syncLayoutHeight(animate, fromHeight);
      });
    }
  }

  function lockScroll() {
    document.documentElement.classList.add('auth-modal-abierto');
  }

  function unlockScroll() {
    document.documentElement.classList.remove('auth-modal-abierto');
  }

  function open(view, next) {
    mount();

    var menu = document.getElementById('menu-completo');
    if (menu && menu.classList.contains('esta-abierto')) {
      var cerrar = document.querySelector('.menu__cerrar');
      if (cerrar) cerrar.click();
    }

    clearAlerts();
    nextUrl = next || HTAuth.getNextParam() || null;
    previousTitle = document.title;
    setView(view || 'registro', { animate: false });
    lastFocus = document.activeElement;
    modalRoot.hidden = false;
    modalRoot.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      modalRoot.classList.add('auth-modal--activo');
      requestAnimationFrame(function () {
        syncLayoutHeight(false);
      });
    });
    lockScroll();

    var firstInput = modalRoot.querySelector('[data-auth-vista="' + (view || 'registro') + '"] input');
    if (firstInput) firstInput.focus();
  }

  function close() {
    if (!modalRoot) return;
    modalRoot.classList.remove('auth-modal--activo');
    var layout = modalRoot.querySelector('.auth-modal__layout');
    if (layout) {
      layout.style.height = '';
      layout.style.transition = '';
    }
    modalRoot.hidden = true;
    modalRoot.setAttribute('aria-hidden', 'true');
    unlockScroll();
    document.title = previousTitle;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function refreshNav() {
    document.dispatchEvent(new CustomEvent('ht:auth-change'));
  }

  function finishAuth() {
    close();
    refreshNav();
    var destino = nextUrl;
    var actual = window.location.pathname + window.location.search;
    if (destino && destino !== actual) {
      window.location.href = destino;
    } else {
      window.location.reload();
    }
  }

  function bindEvents() {
    mount();

    document.addEventListener('click', function (event) {
      var opener = event.target.closest('[data-auth-open]');
      if (!opener) return;
      event.preventDefault();
      var view = opener.getAttribute('data-auth-open');
      var next = opener.getAttribute('data-auth-next') || null;
      open(view, next);
    });

    modalRoot.addEventListener('click', function (event) {
      if (event.target.closest('[data-auth-close]')) close();
      var switchBtn = event.target.closest('[data-auth-switch]');
      if (switchBtn) {
        clearAlerts();
        setView(switchBtn.getAttribute('data-auth-switch'), { animate: true });
      }
    });

    document.addEventListener('keydown', function (event) {
      if (modalRoot.hidden) return;
      if (event.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (!modalRoot || modalRoot.hidden) return;
      syncLayoutHeight(false);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        if (!modalRoot || modalRoot.hidden) return;
        syncLayoutHeight(false);
      });
    }

    document.getElementById('registro-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var data = new FormData(event.target);
      var name = String(data.get('name') || '').trim();
      var email = String(data.get('email') || '').trim();
      var password = String(data.get('password') || '');
      var company = String(data.get('company') || '').trim();
      var roleArea = String(data.get('role_area') || '').trim();

      if (!name || !email || password.length < 8) {
        showAlert('registro', 'Completa nombre, email y una contraseña de al menos 8 caracteres.', 'error');
        return;
      }

      if (!company || !roleArea) {
        showAlert('registro', 'Completa empresa y área para crear tu cuenta.', 'error');
        return;
      }

      try {
        var client = HTAuth.getClient();
        var dest = nextUrl || '/revista/';
        var result = await client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { name: name, company: company, role_area: roleArea },
            emailRedirectTo: HTAuth.redirectUrl('/auth/callback.html?next=' + encodeURIComponent(dest))
          }
        });

        if (result.error) throw result.error;

        if (result.data.session) {
          await HTAuth.updateProfileFields({ name: name, company: company, role_area: roleArea });
          if (window.HTBeacon) {
            HTBeacon.sendLead({
              kind: 'revista-registro',
              name: name,
              email: email,
              company: company,
              puesto: roleArea,
              note: 'Registro revista · sesión inmediata'
            });
          }
          finishAuth();
          return;
        }

        if (window.HTBeacon) {
          HTBeacon.sendLead({
            kind: 'revista-registro',
            name: name,
            email: email,
            company: company,
            puesto: roleArea,
            note: 'Registro revista · confirmación email'
          });
        }

        if (HTAuth.isPersonalEmail(email)) {
          showAlert('registro', 'Cuenta creada. Tu acceso a la revista está en revisión; mientras tanto puedes ver el sumario.', 'info');
        } else {
          showAlert('registro', 'Cuenta creada. Ya puedes iniciar sesión y leer la revista.', 'success');
        }
      } catch (error) {
        var message = error.message || 'No se pudo crear la cuenta.';
        if (/rate limit|over_email_send/i.test(message)) {
          message = 'Hay muchas altas en este momento. Espera un minuto e inténtalo de nuevo.';
        }
        showAlert('registro', message, 'error');
      }
    });

    document.getElementById('signin-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var data = new FormData(event.target);
      var email = String(data.get('email') || '').trim();
      var password = String(data.get('password') || '');

      try {
        var client = HTAuth.getClient();
        var result = await client.auth.signInWithPassword({ email: email, password: password });
        if (result.error) throw result.error;
        finishAuth();
      } catch (error) {
        showAlert('sign-in', error.message || 'Email o contraseña incorrectos.', 'error');
      }
    });

    document.getElementById('completar-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var fields = readProfessionalFields('completar');
      if (!fields.company || !fields.role_area) {
        showAlert('completar', 'Completa empresa y área para continuar.', 'error');
        return;
      }

      try {
        await HTAuth.updateProfileFields(fields);
        HTAuth.clearPendingProfile();
        finishAuth();
      } catch (error) {
        showAlert('completar', error.message || 'No se pudo guardar tu información.', 'error');
      }
    });

    var params = new URLSearchParams(window.location.search);
    var authView = params.get('auth');
    if (authView === 'registro' || authView === 'sign-in' || authView === 'completar') {
      open(authView, params.get('next'));
      params.delete('auth');
      params.delete('next');
      var clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      history.replaceState(null, '', clean);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.HTAuth) return;
    bindEvents();
  });

  window.HTAuthModal = {
    open: open,
    close: close
  };
})();

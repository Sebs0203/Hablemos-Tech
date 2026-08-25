(function () {
  'use strict';

  function isHomePage() {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    return path === '/' || path.endsWith('/index.html');
  }

  function isHomeHref(href) {
    if (!href || href.charAt(0) === '#') return false;

    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      var path = url.pathname.replace(/\/+$/, '') || '/';
      return (path === '/' || path.endsWith('/index.html')) && !url.search && !url.hash;
    } catch (error) {
      return false;
    }
  }

  function isHomeHashHref(href) {
    if (!href) return false;

    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      var path = url.pathname.replace(/\/+$/, '') || '/';
      return (path === '/' || path.endsWith('/index.html')) && url.hash.length > 1;
    } catch (error) {
      return href.charAt(0) === '#';
    }
  }

  function hashFromHref(href) {
    if (!href) return '';

    try {
      var url = new URL(href, window.location.href);
      return url.hash || (href.charAt(0) === '#' ? href : '');
    } catch (error) {
      return href.charAt(0) === '#' ? href : '';
    }
  }

  var pendienteTrasMenu = null;
  var desplazamiento = 0;

  function cerrarMenu() {
    var menu = document.getElementById('menu-completo');
    if (!menu || !menu.classList.contains('esta-abierto')) return;
    var cerrar = menu.querySelector('.menu__cerrar');
    if (cerrar) cerrar.click();
  }

  function paginaFijadaPorMenu() {
    return document.documentElement.classList.contains('menu-abierto') &&
      document.body.style.position === 'fixed';
  }

  function irCuandoLaPaginaResponda(accion) {
    if (paginaFijadaPorMenu()) {
      pendienteTrasMenu = accion;
      cerrarMenu();
      return;
    }
    accion();
  }

  function cuandoIntroLista(callback) {
    if (!document.querySelector('hero-marca')) {
      callback();
      return;
    }

    if (document.documentElement.classList.contains('sitio-revelado')) {
      requestAnimationFrame(callback);
      return;
    }

    document.addEventListener('hero-marca:abierto', function () {
      requestAnimationFrame(callback);
    }, { once: true });
  }

  /* Misma curva que --menu-ease-out: cubic-bezier(0.22, 1, 0.36, 1). */
  function easeMenu(t) {
    var x1 = 0.22;
    var y1 = 1;
    var x2 = 0.36;
    var y2 = 1;
    var x = t;
    var i;
    var cx;
    var bx;
    var ax;
    var xt;
    var dxt;

    for (i = 0; i < 6; i += 1) {
      cx = 3 * x1;
      bx = 3 * (x2 - x1) - cx;
      ax = 1 - cx - bx;
      xt = ((ax * x + bx) * x + cx) * x;
      dxt = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(dxt) < 1e-6) break;
      x -= (xt - t) / dxt;
    }

    var cy = 3 * y1;
    var by = 3 * (y2 - y1) - cy;
    var ay = 1 - cy - by;
    return ((ay * x + by) * x + cy) * x;
  }

  function cancelarDesplazamiento() {
    if (desplazamiento) {
      window.cancelAnimationFrame(desplazamiento);
      desplazamiento = 0;
    }
  }

  function yDeNodo(nodo) {
    var rect = nodo.getBoundingClientRect();
    var margen = parseFloat(getComputedStyle(nodo).scrollMarginTop) || 0;
    return Math.max(0, Math.round(rect.top + (window.scrollY || 0) - margen));
  }

  function desplazarSuave(destino) {
    cancelarDesplazamiento();

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var inicio = window.scrollY || window.pageYOffset || 0;
    var distancia = destino - inicio;

    if (reduced || Math.abs(distancia) < 2) {
      window.scrollTo(0, destino);
      return;
    }

    var duracion = Math.round(Math.min(880, Math.max(560, 400 + Math.abs(distancia) * 0.22)));
    var t0 = performance.now();

    function frame(ahora) {
      var t = Math.min(1, (ahora - t0) / duracion);
      window.scrollTo(0, inicio + distancia * easeMenu(t));
      if (t < 1) {
        desplazamiento = window.requestAnimationFrame(frame);
        return;
      }
      desplazamiento = 0;
    }

    desplazamiento = window.requestAnimationFrame(frame);
  }

  function irArriba() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        desplazarSuave(0);
      });
    });
    history.replaceState(null, '', window.location.pathname);
    cerrarMenu();
  }

  function enfocarBoletin(reduced) {
    var email = document.getElementById('boletin-email');
    if (!email) return;

    window.setTimeout(function () {
      email.focus({ preventScroll: true });
    }, reduced ? 0 : 520);
  }

  function irSeccion(hash, actualizarHistorial) {
    if (!hash || hash === '#') return false;

    var id = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    var seccion = document.getElementById(id);
    if (!seccion) return false;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        desplazarSuave(yDeNodo(seccion));
      });
    });

    if (id === 'boletin') {
      enfocarBoletin(reduced);
    }

    if (actualizarHistorial !== false) {
      history.replaceState(null, '', '#' + id);
    }

    cerrarMenu();
    return true;
  }

  document.addEventListener('click', function (event) {
    if (!isHomePage()) return;

    var link = event.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');

    if (isHomeHref(href)) {
      event.preventDefault();
      irCuandoLaPaginaResponda(function () {
        irArriba();
      });
      return;
    }

    if (isHomeHashHref(href)) {
      event.preventDefault();
      var destino = hashFromHref(href);
      irCuandoLaPaginaResponda(function () {
        cuandoIntroLista(function () {
          irSeccion(destino);
        });
      });
    }
  });

  document.addEventListener('menu:desbloqueado', function () {
    if (typeof pendienteTrasMenu !== 'function') return;
    var accion = pendienteTrasMenu;
    pendienteTrasMenu = null;
    accion();
  });

  window.addEventListener('wheel', cancelarDesplazamiento, { passive: true });
  window.addEventListener('touchstart', cancelarDesplazamiento, { passive: true });

  function alCargarHash() {
    if (!isHomePage() || !window.location.hash) return;

    cuandoIntroLista(function () {
      irSeccion(window.location.hash, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', alCargarHash, { once: true });
  } else {
    alCargarHash();
  }
})();

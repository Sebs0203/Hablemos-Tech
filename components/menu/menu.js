(function () {
  'use strict';

  var FOCUSABLES = 'a[href], button:not([disabled])';

  var DURACION_SALIDA_RESPALDO = 320;

  function tiempoCss(nombre, respaldo) {
    var valor = getComputedStyle(document.documentElement)
      .getPropertyValue(nombre)
      .trim();
    var ms = parseFloat(valor);
    if (!Number.isFinite(ms) || ms <= 0) return respaldo;
    if (valor.indexOf('ms') === -1 && valor.indexOf('s') !== -1) ms *= 1000;
    return ms;
  }

  function duracionSalida() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    return Math.ceil(tiempoCss('--menu-panel-dur-out', DURACION_SALIDA_RESPALDO)) + 16;
  }

  function iniciar() {
    var panel = document.getElementById('menu-completo');
    var abrir = document.querySelector('.nav__abrir');
    var cerrar = panel && panel.querySelector('.menu__cerrar');

    if (!panel || !abrir || !cerrar) return;

    var raiz = document.documentElement;
    var abierto = false;
    var temporizadorSalida = null;
    var paginaBloqueada = false;
    var scrollY = 0;
    var menuPantallaCompleta = window.matchMedia('(max-width: 56rem)');

    panel.inert = true;

    function bloquearPagina() {
      if (paginaBloqueada || !menuPantallaCompleta.matches) return;
      paginaBloqueada = true;
      scrollY = window.scrollY || window.pageYOffset || 0;
      raiz.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    function desbloquearPagina() {
      if (!paginaBloqueada) return;
      paginaBloqueada = false;
      raiz.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      document.dispatchEvent(new CustomEvent('menu:desbloqueado'));
    }

    function alTocarMover(evento) {
      if (!paginaBloqueada) return;
      if (evento.target.closest && evento.target.closest('.menu__lamina')) return;
      evento.preventDefault();
    }

    function bloquearScroll() {
      raiz.classList.remove('menu-cerrando');
      raiz.classList.add('menu-abierto', 'menu-icono-lineas');
      bloquearPagina();
    }

    function restaurarHero() {
      var hero = document.querySelector('.hero');
      if (hero) {
        hero.removeAttribute('data-intro');
        hero.classList.add('hero-listo');
      }
      document.querySelectorAll('.hero > :not(.hero__capas)').forEach(function (nodo) {
        nodo.style.opacity = '1';
        nodo.style.transform = 'none';
        nodo.style.visibility = 'visible';
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.querySelectorAll('.hero > :not(.hero__capas)').forEach(function (nodo) {
            nodo.style.removeProperty('opacity');
            nodo.style.removeProperty('transform');
            nodo.style.removeProperty('visibility');
          });
        });
      });
    }

    function desbloquearScroll() {
      raiz.classList.remove('menu-abierto', 'menu-icono-lineas', 'menu-cerrando');
      desbloquearPagina();
      if (raiz.classList.contains('sitio-revelado')) {
        raiz.classList.add('sitio-estable');
      }
      restaurarHero();
    }

    function enfocar(nodo) {
      if (!nodo || typeof nodo.focus !== 'function') return;
      try {
        nodo.focus({ preventScroll: true });
      } catch (error) {
        nodo.focus();
      }
    }

    function mostrar() {
      if (abierto || panel.classList.contains('esta-saliendo')) return;
      abierto = true;

      if (temporizadorSalida !== null) {
        window.clearTimeout(temporizadorSalida);
        temporizadorSalida = null;
      }

      panel.classList.remove('esta-saliendo');
      panel.inert = false;
      abrir.setAttribute('aria-expanded', 'true');

      /* El modal aparece en el mismo frame en que se apaga el nav, para que no
         quede un frame suelto con la página sin cabecera. */
      bloquearScroll();
      panel.classList.add('esta-abierto');
      document.dispatchEvent(new CustomEvent('menu:abierto'));

      /* El icono sí necesita un frame extra: entra como líneas y de ahí morphea
         a X, y sin esperar el navegador se saltaría la transición. */
      requestAnimationFrame(function () {
        raiz.classList.remove('menu-icono-lineas');
        enfocar(cerrar);
      });
    }

    function ocultar(devolverFoco) {
      if (!abierto || panel.classList.contains('esta-saliendo')) return;
      abierto = false;

      panel.inert = true;
      abrir.setAttribute('aria-expanded', 'false');
      raiz.classList.add('menu-icono-lineas');

      /* Todo el cierre arranca en el mismo frame: los elementos y el fondo del
         modal por .esta-saliendo, y el nav y el hero por .menu-cerrando. Los
         retrasos viven en el CSS para que no se desfasen entre sí. */
      panel.classList.remove('esta-abierto');
      panel.classList.add('esta-saliendo');
      raiz.classList.add('menu-cerrando');
      /* El glide a la sección arranca ya: si esperamos al final del overlay,
         en móvil no se ve el recorrido. */
      desbloquearPagina();
      document.dispatchEvent(new CustomEvent('menu:cerrado'));

      temporizadorSalida = window.setTimeout(function () {
        panel.classList.remove('esta-saliendo');
        desbloquearScroll();
        temporizadorSalida = null;

        if (devolverFoco !== false) {
          requestAnimationFrame(function () {
            enfocar(abrir);
          });
        }
      }, duracionSalida());
    }

    function atraparFoco(evento) {
      if (evento.key !== 'Tab') return;

      var elementos = Array.prototype.filter.call(
        panel.querySelectorAll(FOCUSABLES),
        function (nodo) { return nodo.offsetParent !== null; }
      );
      if (!elementos.length) return;

      var primero = elementos[0];
      var ultimo = elementos[elementos.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    /* En escritorio el nav sigue visible junto a la lámina, así que su botón
       tiene que poder cerrar además de abrir. */
    abrir.addEventListener('click', function () {
      if (abierto) ocultar();
      else mostrar();
    });

    cerrar.addEventListener('click', function () { ocultar(); });

    document.addEventListener('keydown', function (evento) {
      if (!abierto && !panel.classList.contains('esta-saliendo')) return;
      if (evento.key === 'Escape') {
        ocultar();
        return;
      }
      if (!abierto) return;
      atraparFoco(evento);
    });

    panel.addEventListener('click', function (evento) {
      var enlace = evento.target.closest('a[href]');
      if (enlace) ocultar(false);
    });

    document.addEventListener('click', function (evento) {
      if (!abierto) return;
      if (abrir.contains(evento.target)) return;
      if (evento.target.closest('.menu__lamina')) return;
      ocultar(false);
    }, true);

    var SECCIONES = ['inicio', 'revista', 'podcast', 'eventos', 'boletin'];
    var marcaPendiente = null;

    function nodoSeccion(id) {
      if (id === 'inicio') {
        return document.getElementById('inicio') || document.querySelector('.hero');
      }
      return document.getElementById(id);
    }

    function seccionVisible() {
      var linea = Math.max(88, Math.round(window.innerHeight * 0.24));
      var actual = 'inicio';
      var i;
      var nodo;

      for (i = 0; i < SECCIONES.length; i += 1) {
        nodo = nodoSeccion(SECCIONES[i]);
        if (!nodo) continue;
        if (nodo.getBoundingClientRect().top <= linea) actual = SECCIONES[i];
      }

      return actual;
    }

    function marcarSeccion() {
      var actual = seccionVisible();
      var enlaces = panel.querySelectorAll('.menu__enlace[data-seccion]');
      var marcado = false;

      enlaces.forEach(function (enlace) {
        if (enlace.getAttribute('data-seccion') === actual && !marcado) {
          enlace.setAttribute('aria-current', 'true');
          marcado = true;
        } else {
          enlace.removeAttribute('aria-current');
        }
      });
    }

    function programarMarca() {
      if (marcaPendiente !== null) return;
      marcaPendiente = window.requestAnimationFrame(function () {
        marcaPendiente = null;
        marcarSeccion();
      });
    }

    function alCambiarAncho() {
      if (!abierto) return;
      if (menuPantallaCompleta.matches) bloquearPagina();
      else desbloquearPagina();
    }

    if (typeof menuPantallaCompleta.addEventListener === 'function') {
      menuPantallaCompleta.addEventListener('change', alCambiarAncho);
    } else if (typeof menuPantallaCompleta.addListener === 'function') {
      menuPantallaCompleta.addListener(alCambiarAncho);
    }

    document.addEventListener('touchmove', alTocarMover, { passive: false });

    window.addEventListener('scroll', programarMarca, { passive: true });
    window.addEventListener('resize', programarMarca);
    window.addEventListener('hashchange', marcarSeccion);
    document.addEventListener('menu:abierto', marcarSeccion);
    marcarSeccion();

    (function enlazarHoverMouse() {
      var grid = panel.querySelector('.menu__grid');
      if (!grid) return;

      function pintar(activo) {
        var enlaces = grid.querySelectorAll('.menu__enlace');
        var i;
        var nodo;

        if (!activo) {
          grid.removeAttribute('data-pointer');
          for (i = 0; i < enlaces.length; i += 1) enlaces[i].removeAttribute('data-hover');
          return;
        }

        grid.setAttribute('data-pointer', 'hover');
        for (i = 0; i < enlaces.length; i += 1) {
          nodo = enlaces[i];
          if (nodo === activo) nodo.setAttribute('data-hover', '');
          else nodo.removeAttribute('data-hover');
        }
      }

      Array.prototype.forEach.call(grid.querySelectorAll('.menu__enlace'), function (enlace) {
        enlace.addEventListener('pointerenter', function (evento) {
          if (evento.pointerType !== 'mouse') return;
          pintar(enlace);
        });
        enlace.addEventListener('pointerleave', function (evento) {
          if (evento.pointerType !== 'mouse') return;
          var siguiente = evento.relatedTarget && evento.relatedTarget.closest
            ? evento.relatedTarget.closest('.menu__enlace')
            : null;
          if (siguiente && grid.contains(siguiente)) return;
          pintar(null);
        });
      });

      document.addEventListener('menu:cerrado', function () {
        pintar(null);
      });
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();

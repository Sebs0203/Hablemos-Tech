(function () {
  'use strict';

  var INTERVALO = 10000;
  var DURACION_MS = 900;

  function iniciar() {
    var raiz = document.querySelector('[data-podcast-carrete]');
    if (!raiz) return;

    var viewport = raiz.querySelector('[data-podcast-viewport]');
    var pista = raiz.querySelector('[data-podcast-pista]');
    var laminas = Array.prototype.slice.call(raiz.querySelectorAll('[data-podcast-lamina]'));
    var anterior = raiz.querySelector('[data-podcast-anterior]');
    var siguiente = raiz.querySelector('[data-podcast-siguiente]');

    if (!viewport || !pista || laminas.length < 2) return;

    var quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
    var actual = 0;
    var reloj = null;
    var visible = false;
    var observador = null;

    pista.style.setProperty('--podcast-duracion', DURACION_MS + 'ms');

    function medidas() {
      var lamina = laminas[0];
      if (!lamina) return { offset: 0 };

      var estilos = window.getComputedStyle(pista);
      var gap = parseFloat(estilos.columnGap || estilos.gap) || 0;
      var ancho = lamina.getBoundingClientRect().width;
      var offset = -actual * (ancho + gap);

      return { offset: offset };
    }

    function ir(indice, animar) {
      actual = (indice + laminas.length) % laminas.length;

      var medida = medidas();
      pista.style.transition = animar === false || quieto.matches
        ? 'none'
        : 'transform var(--podcast-duracion) cubic-bezier(0.22, 1, 0.36, 1)';
      pista.style.transform = 'translate3d(' + medida.offset + 'px, 0, 0)';

      laminas.forEach(function (lamina, i) {
        var activa = i === actual;
        lamina.classList.toggle('esta-activa', activa);
        lamina.inert = !activa;
        lamina.setAttribute('aria-hidden', activa ? 'false' : 'true');
      });

      if (anterior) anterior.disabled = false;
      if (siguiente) siguiente.disabled = false;
    }

    function avanzar() {
      ir(actual + 1, true);
    }

    function retroceder() {
      ir(actual - 1, true);
    }

    function pararReloj() {
      if (reloj === null) return;
      window.clearInterval(reloj);
      reloj = null;
    }

    function arrancarReloj() {
      pararReloj();
      if (!visible || quieto.matches || laminas.length < 2) return;
      reloj = window.setInterval(avanzar, INTERVALO);
    }

    function reiniciarReloj() {
      if (!visible) return;
      arrancarReloj();
    }

    function observarVisibilidad() {
      if (!('IntersectionObserver' in window)) {
        visible = true;
        arrancarReloj();
        return;
      }

      observador = new IntersectionObserver(function (entradas) {
        visible = entradas.some(function (entrada) { return entrada.isIntersecting; });
        if (visible) arrancarReloj();
        else pararReloj();
      }, { threshold: 0.35 });

      observador.observe(raiz);
    }

    if (anterior) {
      anterior.addEventListener('click', function () {
        retroceder();
        reiniciarReloj();
      });
    }

    if (siguiente) {
      siguiente.addEventListener('click', function () {
        avanzar();
        reiniciarReloj();
      });
    }

    raiz.addEventListener('mouseenter', pararReloj);
    raiz.addEventListener('mouseleave', arrancarReloj);
    raiz.addEventListener('focusin', pararReloj);
    raiz.addEventListener('focusout', function (evento) {
      if (!raiz.contains(evento.relatedTarget)) arrancarReloj();
    });

    window.addEventListener('resize', function () {
      ir(actual, false);
    });

    if (typeof quieto.addEventListener === 'function') {
      quieto.addEventListener('change', function () {
        ir(actual, false);
        arrancarReloj();
      });
    }

    ir(0, false);
    observarVisibilidad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();

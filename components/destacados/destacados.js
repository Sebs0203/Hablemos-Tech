(function () {
  'use strict';

  var INTERVALO = 5600;

  function iniciar() {
    var raiz = document.querySelector('[data-destacado]');
    if (!raiz) return;

    var laminas = Array.prototype.slice.call(raiz.querySelectorAll('[data-lamina]'));
    var contenedorPuntos = raiz.querySelector('[data-puntos]');
    var anterior = raiz.querySelector('[data-anterior]');
    var siguiente = raiz.querySelector('[data-siguiente]');

    if (laminas.length < 2 || !contenedorPuntos) return;

    var quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
    var actual = 0;
    var reloj = null;
    var visible = false;
    var puntos = [];

    laminas.forEach(function (lamina, indice) {
      var item = document.createElement('li');
      var boton = document.createElement('button');

      boton.type = 'button';
      boton.className = 'destacado__punto';
      boton.setAttribute('aria-label', 'Ver destacado ' + (indice + 1) + ' de ' + laminas.length);
      boton.addEventListener('click', function () {
        ir(indice);
        reiniciarReloj();
      });

      item.appendChild(boton);
      contenedorPuntos.appendChild(item);
      puntos.push(boton);
    });

    function ir(indice) {
      actual = (indice + laminas.length) % laminas.length;

      laminas.forEach(function (lamina, i) {
        var activa = i === actual;
        lamina.classList.toggle('esta-activa', activa);
        // Lo oculto no debe ser tabulable ni llegar al lector de pantalla.
        lamina.inert = !activa;
        lamina.setAttribute('aria-hidden', activa ? 'false' : 'true');
      });

      puntos.forEach(function (punto, i) {
        punto.setAttribute('aria-current', i === actual ? 'true' : 'false');
      });
    }

    function avanzar() {
      ir(actual + 1);
    }

    function pararReloj() {
      if (reloj === null) return;
      window.clearInterval(reloj);
      reloj = null;
    }

    function arrancarReloj() {
      pararReloj();
      if (!visible || quieto.matches) return;
      reloj = window.setInterval(avanzar, INTERVALO);
    }

    function reiniciarReloj() {
      if (reloj === null) return;
      arrancarReloj();
    }

    if (anterior) {
      anterior.addEventListener('click', function () {
        ir(actual - 1);
        reiniciarReloj();
      });
    }

    if (siguiente) {
      siguiente.addEventListener('click', function () {
        avanzar();
        reiniciarReloj();
      });
    }

    // Nadie pierde de vista una tarjeta que está leyendo o recorriendo con Tab.
    raiz.addEventListener('mouseenter', pararReloj);
    raiz.addEventListener('mouseleave', arrancarReloj);
    raiz.addEventListener('focusin', pararReloj);
    raiz.addEventListener('focusout', function (evento) {
      if (!raiz.contains(evento.relatedTarget)) arrancarReloj();
    });

    // El carrusel vive dentro del menú: sin menú abierto no hay nada que animar.
    document.addEventListener('menu:abierto', function () {
      visible = true;
      arrancarReloj();
    });

    document.addEventListener('menu:cerrado', function () {
      visible = false;
      pararReloj();
    });

    if (typeof quieto.addEventListener === 'function') {
      quieto.addEventListener('change', arrancarReloj);
    }

    ir(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();

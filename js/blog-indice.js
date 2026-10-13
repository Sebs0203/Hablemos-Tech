(function () {
  'use strict';

  var filtros = document.querySelector('[data-blog-filtros]');
  var rejilla = document.querySelector('[data-blog-rejilla]');
  if (!filtros || !rejilla) return;

  var destacada = document.querySelector('[data-blog-destacada]');
  var conteo = document.querySelector('[data-blog-conteo]');
  var tarjetas = Array.prototype.slice.call(rejilla.children);
  var botones = Array.prototype.slice.call(filtros.querySelectorAll('[data-tema]'));

  function incluye(nodo, tema) {
    return !tema || (' ' + nodo.dataset.temas + ' ').indexOf(' ' + tema + ' ') !== -1;
  }

  function filtrar(tema) {
    var visibles = 0;
    tarjetas.forEach(function (tarjeta) {
      var ver = incluye(tarjeta, tema);
      tarjeta.hidden = !ver;
      if (ver) visibles++;
    });
    if (destacada) {
      var verDestacada = incluye(destacada, tema);
      destacada.hidden = !verDestacada;
      if (verDestacada) visibles++;
    }
    botones.forEach(function (boton) {
      boton.setAttribute('aria-pressed', boton.dataset.tema === tema ? 'true' : 'false');
    });
    conteo.textContent = visibles === 1 ? '1 entrada' : visibles + ' entradas';
  }

  filtros.addEventListener('click', function (e) {
    var boton = e.target.closest('[data-tema]');
    if (boton) filtrar(boton.dataset.tema);
  });

  filtros.hidden = false;
})();

(function () {
  'use strict';

  var raiz = document.querySelector('[data-blog-carrusel]');
  if (!raiz) return;

  var pista = raiz.querySelector('[data-blog-pista]');
  var tarjetas = Array.prototype.slice.call(pista.children);
  var anteriores = raiz.querySelectorAll('[data-blog-anterior]');
  var siguientes = raiz.querySelectorAll('[data-blog-siguiente]');
  var numeros = raiz.querySelector('[data-blog-numeros]');
  var folio = raiz.querySelector('[data-blog-folio]');
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  var porVista = 1;
  var paginas = 1;
  var actual = -1;
  var paso = 0;

  function medir() {
    var gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
    paso = tarjetas[0].getBoundingClientRect().width + gap;
    porVista = Math.max(1, Math.round((pista.clientWidth + gap) / paso));
    var total = Math.ceil(tarjetas.length / porVista);
    if (total !== paginas || !numeros.children.length) {
      paginas = total;
      pintarNumeros();
    }
  }

  function pintarNumeros() {
    numeros.textContent = '';
    for (var i = 0; i < paginas; i++) {
      var li = document.createElement('li');
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'blog-paginas__numero';
      boton.textContent = String(i + 1);
      boton.setAttribute('aria-label', 'Página ' + (i + 1) + ' de ' + paginas);
      boton.dataset.pagina = String(i);
      li.appendChild(boton);
      numeros.appendChild(li);
    }
    actual = -1;
  }

  function paginaVisible() {
    var maximo = pista.scrollWidth - pista.clientWidth;
    if (pista.scrollLeft >= maximo - 2) return paginas - 1;
    return Math.min(paginas - 1, Math.round(pista.scrollLeft / (paso * porVista)));
  }

  function marcar() {
    var pagina = paginaVisible();
    if (pagina === actual) return;
    actual = pagina;
    Array.prototype.forEach.call(numeros.querySelectorAll('button'), function (boton, i) {
      if (i === pagina) boton.setAttribute('aria-current', 'page');
      else boton.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(anteriores, function (b) { b.disabled = pagina === 0; });
    Array.prototype.forEach.call(siguientes, function (b) { b.disabled = pagina === paginas - 1; });
    folio.textContent = (pagina + 1) + ' / ' + paginas;
  }

  function irA(pagina) {
    pagina = Math.max(0, Math.min(paginas - 1, pagina));
    var destino = tarjetas[pagina * porVista].offsetLeft - tarjetas[0].offsetLeft;
    pista.scrollTo({
      left: Math.min(destino, pista.scrollWidth - pista.clientWidth),
      behavior: sinMovimiento.matches ? 'auto' : 'smooth'
    });
  }

  Array.prototype.forEach.call(anteriores, function (b) {
    b.addEventListener('click', function () { irA(paginaVisible() - 1); });
  });
  Array.prototype.forEach.call(siguientes, function (b) {
    b.addEventListener('click', function () { irA(paginaVisible() + 1); });
  });
  numeros.addEventListener('click', function (e) {
    var boton = e.target.closest('[data-pagina]');
    if (boton) irA(Number(boton.dataset.pagina));
  });

  var cuadro = 0;
  pista.addEventListener('scroll', function () {
    cancelAnimationFrame(cuadro);
    cuadro = requestAnimationFrame(marcar);
  }, { passive: true });

  window.addEventListener('resize', function () {
    medir();
    marcar();
  });

  raiz.querySelectorAll('[data-blog-controles]').forEach(function (nodo) {
    nodo.hidden = false;
  });
  medir();
  marcar();
})();

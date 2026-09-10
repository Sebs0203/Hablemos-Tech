(function () {
  'use strict';

  var HOLD_MS = 3600;
  var capas = document.querySelector('.hero__capas');
  if (!capas) return;

  var slides = capas.querySelectorAll('.hero__capas-fondo');
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var index = 0;
  var timer = null;

  function show(next) {
    slides[index].classList.remove('is-activa');
    index = next;
    slides[index].classList.add('is-activa');
  }

  function tick() {
    show((index + 1) % slides.length);
  }

  function play() {
    if (timer || document.hidden) return;
    timer = window.setInterval(tick, HOLD_MS);
  }

  function pause() {
    window.clearInterval(timer);
    timer = null;
  }

  function start() {
    window.setTimeout(play, HOLD_MS);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause();
    else play();
  });

  if (document.documentElement.classList.contains('sitio-revelado')) {
    start();
  } else {
    document.addEventListener('hero-marca:listo', start, { once: true });
  }
})();

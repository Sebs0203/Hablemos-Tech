(function () {
  'use strict';

  var iframe = document.querySelector('.agenda__plancha-video');
  var controles = document.querySelector('.agenda__plancha-controles');
  if (!iframe || !controles) return;

  var play = controles.querySelector('[data-video-play]');
  var volumen = controles.querySelector('[data-video-volumen]');
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sonando = !reducido;

  function enviar(metodo, valor) {
    if (!iframe.contentWindow) return;
    var mensaje = { method: metodo };
    if (valor !== undefined) mensaje.value = valor;
    iframe.contentWindow.postMessage(JSON.stringify(mensaje), '*');
  }

  function pintarPlay() {
    controles.dataset.estado = sonando ? 'play' : 'pausa';
    play.setAttribute('aria-pressed', sonando ? 'true' : 'false');
    play.setAttribute('aria-label', sonando ? 'Pausar video' : 'Reproducir video');
  }

  function pintarVolumen() {
    var nivel = Number(volumen.value);
    volumen.style.setProperty('--volumen', nivel + '%');
    volumen.setAttribute('aria-valuetext', nivel === 0 ? 'Silencio' : nivel + ' por ciento');
    controles.dataset.volumen = nivel === 0 ? 'mute' : 'on';
  }

  window.addEventListener('message', function (evento) {
    if (String(evento.origin).indexOf('vimeo.com') === -1) return;

    var data = evento.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (err) { return; }
    }
    if (!data || !data.event) return;

    if (data.event === 'ready') {
      ['play', 'playing', 'pause', 'finish', 'volumechange'].forEach(function (nombre) {
        enviar('addEventListener', nombre);
      });
      if (reducido) enviar('pause');
      return;
    }

    if (data.event === 'play' || data.event === 'playing') {
      sonando = true;
      pintarPlay();
      return;
    }

    if (data.event === 'pause' || data.event === 'finish') {
      sonando = false;
      pintarPlay();
      return;
    }

    if (data.event === 'volumechange') {
      var info = data.data || {};
      if (typeof info.volume !== 'number' || document.activeElement === volumen) return;
      volumen.value = String(Math.round(info.volume * 100));
      pintarVolumen();
    }
  });

  play.addEventListener('click', function () {
    enviar(sonando ? 'pause' : 'play');
  });

  volumen.addEventListener('input', function () {
    enviar('setVolume', Number(volumen.value) / 100);
    pintarVolumen();
  });

  pintarPlay();
  pintarVolumen();
})();

(function () {
  'use strict';

  var CHANNEL_ID = 'UC3uzFPfZTUldUQduP2oqkjg';
  var FEED_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' +
    encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID);
  var MIN_SET = 4;
  var COPIAS = 2;
  var DRAG_UMBRAL = 6;
  var TOUCH_UMBRAL = 6;

  /* Miniaturas del carrete: ir agregando objetos aquí. El loop infinito
     duplica el set para que el corte no se note. */
  var CARRETE = [
    {
      placeholder: true,
      fondo: 'assets/img/podcast-ep-personas.jpg?v=202608241456',
      width: 819,
      height: 1024,
      titulo: 'Personas,<br>Procesos y Tecnología'
    },
    {
      placeholder: true,
      fondo: 'assets/img/podcast-ep-meza.jpg?v=202608241502',
      width: 819,
      height: 1024,
      titulo: 'De las Big Four a<br>Silicon Valley',
      invitado: 'Víctor Meza',
      cargo: 'Director de Ciberseguridad y Cumplimiento en PayStand',
      cargoLargo: true
    },
    {
      placeholder: true,
      fondo: 'assets/img/podcast-ep-03.jpg?v=202608241609',
      width: 819,
      height: 1024,
      titulo: 'IA Aplicada a<br>Negocios y Liderazgo',
      invitado: 'Hugo Cen',
      cargo: 'Co-fundador de Ai Lab School'
    },
    {
      placeholder: true,
      fondo: 'assets/img/podcast-ep-carlos.jpg?v=202608241633',
      width: 819,
      height: 1024,
      titulo: 'De Programar a<br>Crear con IA',
      invitado: 'Carlos San Miguel',
      cargo: 'CEO de Vanguardia Tecnologías'
    },
    {
      placeholder: true,
      fondo: 'assets/img/podcast-ep-hosts.jpg?v=202608241654',
      width: 819,
      height: 1024,
      titulo: 'IA y el Futuro de los<br>Roles Tech',
      invitado: 'Francisco Olazo y Andrés Wong',
      cargo: 'LATAM Lead Engineer y CIAO en Enteracloud Mx',
      cargoLargo: true
    }
  ];

  var FALLBACK_VIDEO = '3GCIKLI7hLc';

  function videoIdFromLink(link) {
    if (!link) return '';
    var watch = link.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (watch) return watch[1];
    var short = link.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
    if (short) return short[1];
    var embed = link.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (embed) return embed[1];
    var guid = link.match(/yt:video:([A-Za-z0-9_-]{11})/);
    return guid ? guid[1] : '';
  }

  function isShort(link) {
    return Boolean(link && link.indexOf('/shorts/') !== -1);
  }

  function latestFromFeed(items) {
    var seen = {};
    var i;
    var item;
    var id;
    var link;

    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      id = item.id || videoIdFromLink(item.link || item.guid || '');
      link = item.link || '';
      if (!id || seen[id] || isShort(link)) continue;
      seen[id] = true;
      return id;
    }

    return '';
  }

  async function loadLatestId() {
    try {
      var response = await fetch(FEED_URL);
      if (!response.ok) throw new Error('feed');
      var data = await response.json();
      return latestFromFeed(data.items || []) || FALLBACK_VIDEO;
    } catch (error) {
      console.warn('No se pudo actualizar el feed de YouTube.', error);
      return FALLBACK_VIDEO;
    }
  }

  function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function cartelHtml(img) {
    var tituloClase = 'podcast-carrete__titulo' + (img.tituloLargo ? ' podcast-carrete__titulo--largo' : '');
    var cargoClase = 'podcast-carrete__cargo' + (img.cargoLargo ? ' podcast-carrete__cargo--largo' : '');
    var titulo = img.titulo || 'Personas,<br>Procesos y Tecnología';
    var invitado = img.invitado || 'Victor Mendivil';
    var cargo = img.cargo || 'IT &amp; Data Cluster Director para Norteamérica en OnTex';

    return (
      '<span class="podcast-carrete__cartel">' +
        '<span class="podcast-carrete__meta">' +
          '<img class="podcast-carrete__asterisco" src="assets/img/asterisco.png?v=1" alt="" width="64" height="64" decoding="async" draggable="false">' +
          'Hablemos Tech Podcast' +
        '</span>' +
        '<span class="' + tituloClase + '">' + titulo + '</span>' +
        '<span class="podcast-carrete__firma">' +
          '<span class="podcast-carrete__invitado">' + invitado + '</span>' +
          '<span class="' + cargoClase + '">' + cargo + '</span>' +
        '</span>' +
      '</span>'
    );
  }

  function veloHtml() {
    return '<span class="podcast-carrete__velo" aria-hidden="true"></span>';
  }

  function thumbHtml(img) {
    if (img.placeholder) {
      var fondo = img.fondo
        ? '<img class="podcast-carrete__fondo" src="' + escapeAttr(img.fondo) +
          '" alt="" width="' + img.width + '" height="' + img.height +
          '" decoding="async" draggable="false">'
        : '';

      return (
        '<figure class="podcast-carrete__ep">' +
          '<span class="podcast-carrete__media podcast-carrete__media--vacio">' +
            fondo +
            veloHtml() +
            cartelHtml(img) +
          '</span>' +
        '</figure>'
      );
    }

    return (
      '<figure class="podcast-carrete__ep">' +
        '<span class="podcast-carrete__media podcast-carrete__media--vacio">' +
          (img.fondo
            ? '<img class="podcast-carrete__fondo" src="' + escapeAttr(img.fondo) +
              '" alt="" width="' + img.width + '" height="' + img.height +
              '" decoding="async" draggable="false">'
            : '') +
          veloHtml() +
        '</span>' +
      '</figure>'
    );
  }

  function setParaLoop(imagenes) {
    var set = imagenes.slice();
    if (!set.length) return set;
    while (set.length < MIN_SET) set = set.concat(imagenes);
    return set;
  }

  function renderLoop(pista, imagenes) {
    var set = setParaLoop(imagenes);
    var html = '';
    var i;

    for (i = 0; i < COPIAS; i += 1) {
      set.forEach(function (img) {
        html += thumbHtml(img);
      });
    }

    pista.innerHTML = html;
    pista.style.removeProperty('transform');
    pista.style.animation = 'none';
  }

  function bindCarousel(raiz, pista, imagenes) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var movil = window.matchMedia('(max-width: 56rem)');
    var ciclo = 0;
    var crucero = 0;
    var offset = 0;
    var vel = 0;
    var frame = null;
    var lastTs = 0;

    var pointerId = null;
    var startX = 0;
    var startOffset = 0;
    var lastX = 0;
    var lastMoveTs = 0;
    var dragged = false;

    var touchId = null;
    var touchBaseX = 0;
    var touchBaseY = 0;
    var touchBaseOffset = 0;
    var touchEngaged = false;
    var touchLastX = 0;
    var touchLastTs = 0;
    var targetOffset = 0;

    function gestoActivo() {
      return pointerId !== null || touchEngaged;
    }

    function ahora() {
      return window.performance && window.performance.now ? window.performance.now() : Date.now();
    }

    function dedo(lista) {
      var i;
      for (i = 0; i < lista.length; i += 1) {
        if (lista[i].identifier === touchId) return lista[i];
      }
      return null;
    }

    function medir() {
      var items = pista.children;
      var porSet = setParaLoop(imagenes).length;
      if (items.length >= porSet * 2) {
        ciclo = items[porSet].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
      } else {
        ciclo = pista.scrollWidth / COPIAS;
      }
      var segundos = movil.matches ? 11 : 12;
      var duracion = Math.max(140, porSet * COPIAS * segundos) * 1000;
      crucero = ciclo > 0 && duracion > 0 ? -(ciclo / duracion) : 0;
      if (!gestoActivo()) vel = crucero;
    }

    function envolver() {
      if (ciclo <= 0) return;
      while (offset <= -ciclo) {
        offset += ciclo;
        targetOffset += ciclo;
        startOffset += ciclo;
        touchBaseOffset += ciclo;
      }
      while (offset > 0) {
        offset -= ciclo;
        targetOffset -= ciclo;
        startOffset -= ciclo;
        touchBaseOffset -= ciclo;
      }
    }

    function pintarPista() {
      pista.style.transform = 'translate3d(' + offset + 'px,0,0)';
    }

    function tick(ts) {
      frame = window.requestAnimationFrame(tick);

      if (!lastTs) {
        lastTs = ts;
        return;
      }

      var dt = Math.min(48, ts - lastTs);
      lastTs = ts;

      if (document.hidden || reduceMotion.matches) {
        vel = 0;
        return;
      }

      if (gestoActivo()) {
        if (movil.matches) {
          var seguimiento = 1 - Math.exp(-dt / 18);
          offset += (targetOffset - offset) * seguimiento;
          envolver();
          pintarPista();
        }
        return;
      }

      if (movil.matches) {
        vel = crucero + (vel - crucero) * Math.exp(-dt / 480);
      } else {
        vel += (crucero - vel) * Math.min(1, dt * 0.012);
      }

      offset += vel * dt;
      envolver();
      pintarPista();
    }

    function arrancar() {
      if (frame !== null) return;
      lastTs = 0;
      frame = window.requestAnimationFrame(tick);
    }

    function paint() {
      renderLoop(pista, imagenes);
      offset = 0;
      vel = 0;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          medir();
          pintarPista();
          arrancar();
        });
      });

      var fotos = pista.querySelectorAll('img');
      var i;
      for (i = 0; i < fotos.length; i += 1) {
        if (fotos[i].complete) continue;
        fotos[i].addEventListener('load', medir, { once: true });
      }
    }

    raiz.addEventListener('pointerdown', function (evento) {
      if (evento.pointerType !== 'mouse' && evento.pointerType !== 'pen') return;
      if (evento.button !== 0) return;

      if (evento.cancelable) evento.preventDefault();
      if (window.getSelection) window.getSelection().removeAllRanges();

      pointerId = evento.pointerId;
      startX = evento.clientX;
      lastX = evento.clientX;
      lastMoveTs = evento.timeStamp || ahora();
      startOffset = offset;
      dragged = false;
      vel = 0;
      raiz.classList.add('esta-arrastrando');

      try {
        raiz.setPointerCapture(evento.pointerId);
      } catch (error) {}
    });

    raiz.addEventListener('pointermove', function (evento) {
      if (evento.pointerId !== pointerId) return;
      if (evento.cancelable) evento.preventDefault();

      var x = evento.clientX;
      var dx = x - startX;
      if (!dragged && Math.abs(dx) >= DRAG_UMBRAL) dragged = true;

      var ts = evento.timeStamp || ahora();
      var dt = ts - lastMoveTs;
      if (dt > 0) {
        vel = (x - lastX) / dt;
        lastMoveTs = ts;
        lastX = x;
      }

      offset = startOffset + dx;
      targetOffset = offset;
      envolver();
      pintarPista();
    });

    function soltarPointer(evento) {
      if (pointerId === null) return;
      if (evento && evento.pointerId !== pointerId) return;
      if ((evento.timeStamp || ahora()) - lastMoveTs > 80) vel = crucero;
      pointerId = null;
      dragged = false;
      raiz.classList.remove('esta-arrastrando');
    }

    raiz.addEventListener('dragstart', function (evento) {
      evento.preventDefault();
    });

    raiz.addEventListener('selectstart', function (evento) {
      evento.preventDefault();
    });

    raiz.addEventListener('pointerup', soltarPointer);
    raiz.addEventListener('pointercancel', soltarPointer);
    raiz.addEventListener('lostpointercapture', soltarPointer);

    raiz.addEventListener('touchstart', function (evento) {
      if (touchId !== null) return;
      var touch = evento.changedTouches[0];
      if (!touch) return;

      touchId = touch.identifier;
      touchBaseX = touch.clientX;
      touchBaseY = touch.clientY;
      touchLastX = touch.clientX;
      touchLastTs = evento.timeStamp || ahora();
      touchBaseOffset = offset;
      targetOffset = offset;
      touchEngaged = false;
      vel = 0;
    }, { passive: true });

    raiz.addEventListener('touchmove', function (evento) {
      if (touchId === null) return;

      var touch = dedo(evento.touches);
      if (!touch) return;

      var dx = touch.clientX - touchBaseX;
      var dy = touch.clientY - touchBaseY;

      if (!touchEngaged) {
        if (Math.abs(dx) < TOUCH_UMBRAL && Math.abs(dy) < TOUCH_UMBRAL) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          touchId = null;
          return;
        }
        touchEngaged = true;
        touchBaseX = touch.clientX;
        touchBaseY = touch.clientY;
        touchLastX = touch.clientX;
        touchBaseOffset = offset;
        targetOffset = offset;
        raiz.classList.add('esta-arrastrando');
        dx = 0;
      }

      if (evento.cancelable) evento.preventDefault();

      var ts = evento.timeStamp || ahora();
      var dtMove = ts - touchLastTs;
      if (dtMove > 0) {
        var instante = (touch.clientX - touchLastX) / dtMove;
        vel = vel * 0.62 + instante * 0.38;
        touchLastTs = ts;
        touchLastX = touch.clientX;
      }

      targetOffset = touchBaseOffset + dx;
    }, { passive: false });

    function finTouch(evento) {
      if (touchId === null) return;
      if (dedo(evento.touches)) return;

      var idle = (evento.timeStamp || ahora()) - touchLastTs;
      if (!touchEngaged || idle > 140) vel = 0;
      if (vel > 3.4) vel = 3.4;
      if (vel < -3.4) vel = -3.4;

      offset = targetOffset;
      envolver();
      pintarPista();

      touchId = null;
      touchEngaged = false;
      raiz.classList.remove('esta-arrastrando');
    }

    raiz.addEventListener('touchend', finTouch, { passive: true });
    raiz.addEventListener('touchcancel', finTouch, { passive: true });

    raiz.addEventListener('wheel', function (evento) {
      if (Math.abs(evento.deltaX) < 0.5) return;
      offset -= evento.deltaX;
      vel = crucero;
      envolver();
      pintarPista();
    }, { passive: true });

    window.addEventListener('resize', function () {
      var antes = ciclo;
      var progreso = antes > 0 ? offset / -antes : 0;
      medir();
      offset = -progreso * ciclo;
      envolver();
      pintarPista();
    });

    document.addEventListener('visibilitychange', function () {
      lastTs = 0;
    });

    reduceMotion.addEventListener('change', paint);
    paint();
  }

  function setLatest(id) {
    var ultimo = document.querySelector('[data-podcast-ultimo]');
    if (!ultimo || !id) return;
    ultimo.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
  }

  function init() {
    var raiz = document.querySelector('[data-podcast-carrete]');
    var pista = document.querySelector('[data-podcast-carrete-pista]');
    if (raiz && pista) bindCarousel(raiz, pista, CARRETE);

    setLatest(FALLBACK_VIDEO);
    loadLatestId().then(setLatest);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

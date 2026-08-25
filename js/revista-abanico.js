(function () {
  'use strict';

  var SLOTS = ['izq', 'centro', 'der'];
  var INTERVALO = 4800;
  var MOBILE = '(max-width: 40rem)';
  var DRAG_THRESHOLD = 8;
  var FAN_SWIPE = 48;
  var IDLE_MS = 240;
  var TOUCH_UMBRAL = 6;

  function init() {
    var escena = document.querySelector('.revista-escena');
    if (!escena) return;

    var pista = escena.querySelector('.revista-abanico');
    var items = Array.prototype.slice.call(escena.querySelectorAll('.revista-abanico__item'));
    if (!pista || items.length < 3) return;

    var plantillas = items.filter(function (item) {
      return !item.hasAttribute('data-clone');
    });
    var prevBtn = escena.querySelector('.revista-flecha--izq');
    var nextBtn = escena.querySelector('.revista-flecha--der');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mobileQuery = window.matchMedia(MOBILE);

    var timer = null;
    var paused = false;
    var interacting = false;
    var carrete = false;
    var ajusteHasta = 0;
    var centerIndex = plantillas.findIndex(function (item) {
      return item.classList.contains('revista-abanico__item--centro');
    });

    var pointerId = null;
    var startX = 0;
    var startScroll = 0;
    var dragged = false;
    var lastX = 0;
    var lastTs = 0;
    var velocity = 0;
    var pendingScroll = 0;
    var frame = null;
    var glide = null;
    var idleTimer = null;

    var touchId = null;
    var touchBaseX = 0;
    var touchBaseScroll = 0;
    var touchEngaged = false;
    var touchLastX = 0;
    var touchLastTs = 0;
    var touchVel = 0;

    if (centerIndex < 0) centerIndex = 1;

    function gestoActivo() {
      return pointerId !== null || touchId !== null;
    }

    function dedo(lista) {
      var i;
      for (i = 0; i < lista.length; i += 1) {
        if (lista[i].identifier === touchId) return lista[i];
      }
      return null;
    }

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function stopGlide() {
      if (glide !== null) {
        window.cancelAnimationFrame(glide);
        glide = null;
      }
    }

    function stopFrame() {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    }

    function ahora() {
      return window.performance && window.performance.now ? window.performance.now() : Date.now();
    }

    /* Los reajustes de posición disparan eventos de scroll propios; hay que
       ignorarlos o se tomarían por gestos del usuario. */
    function marcarAjuste() {
      ajusteHasta = ahora() + 80;
    }

    function slides() {
      return Array.prototype.slice.call(pista.children);
    }

    function slideIndex(node) {
      var value = node && parseInt(node.getAttribute('data-slide'), 10);
      return Number.isFinite(value) ? value : 0;
    }

    function slideStep() {
      var list = slides();
      if (list.length > 1) return list[1].offsetLeft - list[0].offsetLeft;
      return list.length ? list[0].offsetWidth : 0;
    }

    function makeSlide(index) {
      var node = plantillas[index].cloneNode(true);
      node.setAttribute('data-slide', String(index));
      SLOTS.forEach(function (name) {
        node.classList.remove('revista-abanico__item--' + name);
      });
      return node;
    }

    function trackPad() {
      return parseFloat(window.getComputedStyle(pista).paddingLeft) || 0;
    }

    function slideLeft(node) {
      if (!node) return 0;
      return Math.max(0, node.offsetLeft - trackPad());
    }

    function nearestSlide(fromLeft) {
      var target = fromLeft == null ? escena.scrollLeft : fromLeft;
      var pad = trackPad();
      var list = slides();
      var best = list[0];
      var bestDist = Infinity;

      list.forEach(function (node) {
        var dist = Math.abs(node.offsetLeft - pad - target);
        if (dist < bestDist) {
          bestDist = dist;
          best = node;
        }
      });

      return best;
    }

    /* El colchón se rellena en reposo y con margen de sobra: con snap obligatorio
       cualquier cambio del DOM durante la inercia la frena en seco. */
    function restante() {
      return escena.scrollWidth - escena.clientWidth - escena.scrollLeft;
    }

    function ensureAhead(triggerSteps) {
      if (!carrete) return;
      var step = slideStep();
      if (step <= 0) return;
      if (restante() >= step * (triggerSteps || 6)) return;

      var safety = 0;
      while (restante() < step * 6 && safety < 24) {
        var list = slides();
        var last = list[list.length - 1];
        pista.appendChild(makeSlide((slideIndex(last) + 1) % plantillas.length));
        safety += 1;
      }
    }

    /* Insertar o quitar por detrás sí mueve el contenido, así que solo se hace
       en reposo, cuando ese ajuste no se puede notar. */
    function ensureBehind() {
      if (!carrete) return;
      var step = slideStep();
      if (step <= 0) return;

      var guard = step * 2;
      var safety = 0;

      while (escena.scrollLeft < guard && safety < 12) {
        var list = slides();
        var first = list[0];
        var before = pista.scrollWidth;
        var left = escena.scrollLeft;

        pista.insertBefore(makeSlide((slideIndex(first) - 1 + plantillas.length) % plantillas.length), first);
        escena.scrollLeft = left + (pista.scrollWidth - before);
        marcarAjuste();
        safety += 1;
      }
    }

    function trimStrip() {
      if (!carrete) return;
      var step = slideStep();
      if (step <= 0) return;

      var keep = step * 2;
      var safety = 0;

      while (slides().length > plantillas.length * 6 && escena.scrollLeft > keep + step && safety < 24) {
        var first = slides()[0];
        var before = pista.scrollWidth;
        var left = escena.scrollLeft;

        first.remove();
        escena.scrollLeft = left - (before - pista.scrollWidth);
        marcarAjuste();
        safety += 1;
      }
    }

    function applySlots() {
      var count = plantillas.length;
      var leftIndex = (centerIndex + count - 1) % count;
      var rightIndex = (centerIndex + 1) % count;

      plantillas.forEach(function (item, index) {
        var slot = 'centro';
        if (index === leftIndex) slot = 'izq';
        if (index === rightIndex) slot = 'der';

        SLOTS.forEach(function (name) {
          item.classList.toggle('revista-abanico__item--' + name, name === slot);
        });
      });
    }

    function startFanAuto() {
      stopAuto();
      if (paused || reduceMotion.matches || document.hidden || mobileQuery.matches) return;
      timer = window.setInterval(function () {
        rotate(1, true);
      }, INTERVALO);
    }

    function rotate(step, fromAuto) {
      if (mobileQuery.matches) return;
      centerIndex = (centerIndex + step + plantillas.length) % plantillas.length;
      applySlots();
      if (!fromAuto) startFanAuto();
    }

    function startCarouselAuto() {
      stopAuto();
      if (
        !carrete ||
        paused ||
        interacting ||
        reduceMotion.matches ||
        document.hidden ||
        gestoActivo() ||
        glide !== null
      ) return;

      timer = window.setInterval(goNext, INTERVALO);
    }

    function paint() {
      frame = null;
      escena.scrollLeft = pendingScroll;
    }

    function queueScroll(value) {
      pendingScroll = Math.max(0, value);
      if (frame === null) frame = window.requestAnimationFrame(paint);
    }

    function settle() {
      escena.classList.remove('esta-arrastrando');
      interacting = false;
      if (carrete) startCarouselAuto();
      else startFanAuto();
    }

    function glideTo(destination) {
      stopGlide();
      var from = escena.scrollLeft;
      var distance = destination - from;

      if (reduceMotion.matches || Math.abs(distance) < 1) {
        escena.scrollLeft = destination;
        settle();
        return;
      }

      var movil = mobileQuery.matches;
      var duration = movil
        ? Math.min(980, Math.max(480, Math.abs(distance) * 1.45 + 220))
        : Math.min(640, Math.max(280, Math.abs(distance) * 1.15));
      var expo = movil ? 5 : 3;
      var start = 0;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, expo);
        escena.scrollLeft = from + distance * eased;

        if (progress < 1) {
          glide = window.requestAnimationFrame(step);
          return;
        }

        glide = null;
        settle();
      }

      glide = window.requestAnimationFrame(step);
    }

    function goNext() {
      if (!carrete || interacting || gestoActivo() || glide !== null) return;

      ensureAhead();
      var current = nearestSlide();
      var next = current && current.nextElementSibling;
      if (!next) return;

      interacting = true;
      escena.classList.add('esta-arrastrando');
      centerIndex = slideIndex(next);
      glideTo(slideLeft(next));
    }

    function onIdle() {
      idleTimer = null;
      if (!carrete || gestoActivo() || glide !== null) return;

      interacting = false;
      centerIndex = slideIndex(nearestSlide());
      ensureBehind();
      ensureAhead();
      trimStrip();
      startCarouselAuto();
    }

    function setupMobile() {
      stopAuto();
      stopGlide();
      stopFrame();
      soltarTilt();
      interacting = false;
      touchId = null;
      touchEngaged = false;
      escena.classList.add('revista-escena--arrastre');
      escena.classList.remove('esta-arrastrando');
      pista.style.removeProperty('transform');
      pista.style.animation = 'none';
      pista.textContent = '';

      if (reduceMotion.matches) {
        carrete = false;
        plantillas.forEach(function (_, index) {
          pista.appendChild(makeSlide(index));
        });
        escena.scrollLeft = 0;
        return;
      }

      carrete = true;
      var cycle;
      for (cycle = 0; cycle < 3; cycle += 1) {
        plantillas.forEach(function (_, index) {
          pista.appendChild(makeSlide(index));
        });
      }

      window.requestAnimationFrame(function () {
        escena.scrollLeft = slideLeft(slides()[centerIndex]);
        marcarAjuste();
        ensureBehind();
        ensureAhead();
        startCarouselAuto();
      });
    }

    function setupFan() {
      stopAuto();
      stopGlide();
      stopFrame();
      soltarTilt();
      carrete = false;
      interacting = false;
      touchId = null;
      touchEngaged = false;
      escena.classList.remove('revista-escena--arrastre', 'esta-arrastrando');
      pista.textContent = '';
      plantillas.forEach(function (item) {
        pista.appendChild(item);
      });
      pista.style.removeProperty('transform');
      pista.style.removeProperty('animation');
      escena.scrollLeft = 0;
      applySlots();
      startFanAuto();
    }

    function syncMode() {
      if (mobileQuery.matches) setupMobile();
      else setupFan();
    }

    function release(event) {
      if (pointerId === null) return;
      if (event && event.pointerId !== pointerId) return;

      pointerId = null;
      stopFrame();

      if (!carrete) {
        if (dragged) {
          var dx = (event && event.clientX != null ? event.clientX : startX) - startX;
          if (dx <= -FAN_SWIPE) rotate(1);
          else if (dx >= FAN_SWIPE) rotate(-1);
        }
        settle();
        return;
      }

      if (!dragged) {
        settle();
        return;
      }

      ensureAhead();
      var next = nearestSlide(escena.scrollLeft + velocity * 150);
      centerIndex = slideIndex(next);
      glideTo(slideLeft(next));
    }

    escena.addEventListener('scroll', function () {
      if (!carrete) return;

      if (ahora() < ajusteHasta) return;
      if (glide === null) stopAuto();
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(onIdle, IDLE_MS);
    }, { passive: true });

    escena.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      if (event.button !== 0) return;
      if (event.target.closest('.revista-flecha')) return;

      stopAuto();
      stopGlide();
      stopFrame();
      interacting = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      lastX = event.clientX;
      lastTs = event.timeStamp || 0;
      velocity = 0;
      startScroll = escena.scrollLeft;
      pendingScroll = startScroll;
      dragged = false;
      escena.classList.add('esta-arrastrando');

      try {
        escena.setPointerCapture(event.pointerId);
      } catch (error) {}
    });

    escena.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId) return;

      var dx = event.clientX - startX;
      if (!dragged && Math.abs(dx) >= DRAG_THRESHOLD) dragged = true;

      var ts = event.timeStamp || 0;
      var dt = ts - lastTs;
      if (dt > 0) {
        var sample = (lastX - event.clientX) / dt;
        velocity = velocity * 0.7 + sample * 0.3;
        lastTs = ts;
        lastX = event.clientX;
      }

      if (!carrete) return;
      queueScroll(startScroll - dx);
    });

    escena.addEventListener('pointerup', release);
    escena.addEventListener('pointercancel', release);
    escena.addEventListener('lostpointercapture', release);

    pista.addEventListener('click', function (event) {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);

    function scheduleIdle() {
      if (!carrete) return;
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(onIdle, IDLE_MS);
    }

    escena.addEventListener('touchstart', function (event) {
      if (!mobileQuery.matches) return;
      if (touchId !== null) return;

      var touch = event.changedTouches[0];
      if (!touch) return;

      stopAuto();
      stopGlide();
      stopFrame();

      touchId = touch.identifier;
      touchBaseX = touch.clientX;
      touchBaseScroll = escena.scrollLeft;
      touchEngaged = false;
      touchLastX = touch.clientX;
      touchLastTs = event.timeStamp || ahora();
      touchVel = 0;
      dragged = false;

      if (carrete) interacting = true;
    }, { passive: true });

    /* El desplazamiento lateral se calcula aquí en lugar de dejárselo al scroll
       nativo porque el navegador fija cada gesto a un solo eje: en cuanto lo
       resuelve como vertical, ignora el movimiento horizontal hasta que se
       levanta el dedo. Con touch-action: pan-y el navegador se queda solo la
       vertical y esta función mueve scrollLeft, así que ambos ejes avanzan a la
       vez y el swipe diagonal funciona. Nunca se llama preventDefault: eso es
       justo lo que dejaría muerto el scroll vertical de la página. */
    escena.addEventListener('touchmove', function (event) {
      if (touchId === null) return;

      var touch = dedo(event.touches);
      if (!touch) return;

      var dx = touch.clientX - touchBaseX;

      if (!touchEngaged) {
        if (Math.abs(dx) < TOUCH_UMBRAL) return;
        touchEngaged = true;
        dragged = true;
        touchBaseX = touch.clientX;
        touchBaseScroll = escena.scrollLeft;
        escena.classList.add('esta-arrastrando');
        dx = 0;
      }

      var ts = event.timeStamp || ahora();
      var dt = ts - touchLastTs;
      if (dt > 0) {
        touchVel = touchVel * 0.7 + ((touchLastX - touch.clientX) / dt) * 0.3;
        touchLastTs = ts;
        touchLastX = touch.clientX;
      }

      escena.scrollLeft = Math.max(0, touchBaseScroll - dx);
    }, { passive: true });

    function finTouch(event) {
      if (touchId === null) return;
      if (dedo(event.touches)) return;

      var arrastro = touchEngaged;
      touchId = null;
      touchEngaged = false;
      stopFrame();

      if (!arrastro) {
        scheduleIdle();
        return;
      }

      if (!carrete) {
        escena.classList.remove('esta-arrastrando');
        return;
      }

      ensureAhead();
      var destino = nearestSlide(escena.scrollLeft + touchVel * 280);
      centerIndex = slideIndex(destino);
      glideTo(slideLeft(destino));
    }

    escena.addEventListener('touchend', finTouch, { passive: true });
    escena.addEventListener('touchcancel', finTouch, { passive: true });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        rotate(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        rotate(1);
      });
    }

    escena.addEventListener('keydown', function (event) {
      if (mobileQuery.matches) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        rotate(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        rotate(1);
      }
    });

    var tiltCard = null;
    var tiltRaf = null;
    var tgtPX = 0.5;
    var tgtPY = 0.5;
    var curPX = 0.5;
    var curPY = 0.5;
    var tilting = false;
    var TILT_MAX = 7;
    var TILT_FOLLOW = 0.22;
    var TILT_RELEASE = 0.1;

    function aplicarTilt(portada, px, py) {
      var rotX = (0.5 - py) * TILT_MAX * 2;
      var rotY = (px - 0.5) * TILT_MAX * 2;
      portada.style.transform =
        'perspective(64rem) rotateX(' + rotX.toFixed(3) + 'deg) rotateY(' + rotY.toFixed(3) + 'deg)';
      portada.style.setProperty('--glare-x', (px * 100).toFixed(3) + '%');
      portada.style.setProperty('--glare-y', (py * 100).toFixed(3) + '%');
    }

    function resetTilt(portada) {
      if (!portada) return;
      portada.classList.remove('is-tilt');
      portada.style.transform = '';
      portada.style.removeProperty('--glare-x');
      portada.style.removeProperty('--glare-y');
    }

    function tickTilt() {
      var ease = tilting ? TILT_FOLLOW : TILT_RELEASE;
      curPX += (tgtPX - curPX) * ease;
      curPY += (tgtPY - curPY) * ease;

      if (tiltCard) aplicarTilt(tiltCard, curPX, curPY);

      var settled =
        Math.abs(tgtPX - curPX) < 0.0008 &&
        Math.abs(tgtPY - curPY) < 0.0008;

      if (settled) {
        if (!tilting) {
          resetTilt(tiltCard);
          tiltCard = null;
        }
        tiltRaf = null;
        return;
      }

      tiltRaf = window.requestAnimationFrame(tickTilt);
    }

    function pedirTilt() {
      if (tiltRaf === null) tiltRaf = window.requestAnimationFrame(tickTilt);
    }

    function apuntarTilt(portada, clientX, clientY) {
      if (
        mobileQuery.matches ||
        reduceMotion.matches ||
        escena.classList.contains('esta-arrastrando')
      ) {
        soltarTilt();
        return;
      }

      /* El rect de la portada cambia al rotar en 3D y el cursor pelea
         consigo mismo. La carta no gira: el hit y el ángulo se quedan estables. */
      var carta = portada.closest('.revista-carta') || portada;
      var rect = carta.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      var nextPX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      var nextPY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      if (tiltCard && tiltCard !== portada) {
        resetTilt(tiltCard);
        curPX = nextPX;
        curPY = nextPY;
      }

      tiltCard = portada;
      tilting = true;
      portada.classList.add('is-tilt');
      tgtPX = nextPX;
      tgtPY = nextPY;
      pedirTilt();
    }

    function soltarTilt() {
      tilting = false;
      tgtPX = 0.5;
      tgtPY = 0.5;
      if (tiltCard) pedirTilt();
    }

    escena.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      if (event.target.closest('.revista-flecha')) {
        soltarTilt();
        return;
      }

      var carta = event.target.closest('.revista-carta');
      if (!carta || !pista.contains(carta)) {
        soltarTilt();
        return;
      }

      var portada = carta.querySelector('.revista-portada');
      if (!portada) {
        soltarTilt();
        return;
      }

      apuntarTilt(portada, event.clientX, event.clientY);
    });

    pista.addEventListener('pointerleave', soltarTilt);

    escena.addEventListener('mouseenter', function () {
      if (mobileQuery.matches) return;
      paused = true;
      stopAuto();
    });

    escena.addEventListener('mouseleave', function () {
      soltarTilt();
      if (mobileQuery.matches) return;
      paused = false;
      startFanAuto();
    });

    escena.addEventListener('focusin', function () {
      paused = true;
      stopAuto();
    });

    escena.addEventListener('focusout', function (event) {
      if (escena.contains(event.relatedTarget)) return;
      paused = false;
      if (carrete) startCarouselAuto();
      else startFanAuto();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAuto();
        return;
      }
      if (carrete) startCarouselAuto();
      else startFanAuto();
    });

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', syncMode);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(syncMode);
    }

    reduceMotion.addEventListener('change', syncMode);

    syncMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

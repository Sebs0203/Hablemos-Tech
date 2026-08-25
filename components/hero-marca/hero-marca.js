(function () {
  'use strict';

  var VISTA = '0 0 626.18 208.23';

  var TECH = [
    'M42.68,90.32v84.22H0V22.94h42.68v33.69h69.33v33.69H42.68ZM42.68,208.23v-33.69h70.51v33.69H42.68Z',
    'M277.2,56.63v92.65h-115.77v25.26h-32.87V56.63h148.64ZM244.33,90.32h-82.9v25.27h82.9v-25.27ZM161.43,208.23v-33.69h82.9v33.69h-82.9Z',
    'M328.73,92.49v79.89h114.57v35.86h-149.56V56.63h149.56v35.86h-114.57Z',
    'M583.38,56.63v33.69h-80.73v117.91h-42.8V0h42.8v56.63h80.73ZM583.38,208.23v-117.91h42.8v117.91h-42.8Z'
  ];

  var HABLEMOS = [
    'M90.04,25.17h-20.15v14.77h-10.67V0h10.67v14.89h20.15V0h10.67v39.93h-10.67v-14.77Z',
    'M138.98,25.17h-20.15v14.77h-10.67V0h41.49v39.93h-10.67v-14.77ZM118.83,14.89h20.15v-4.62h-20.15v4.62Z',
    'M198.59,0v39.93h-41.49V0h41.49ZM167.78,14.89h20.15v-4.62h-20.15v4.62ZM187.92,25.17h-20.15v4.49h20.15v-4.49Z',
    'M247.53,39.93h-41.49V0h10.67v29.66h30.82v10.27Z',
    'M296.48,25.17h-30.82v4.49h30.82v10.27h-41.49V0h41.49v10.27h-30.82v4.62h30.82v10.27Z',
    'M329.67,10.27v29.66h-10.67V10.27h-4.4v29.66h-10.67V0h41.49v39.93h-10.67V10.27h-5.07Z',
    'M394.36,0v39.93h-41.49V0h41.49ZM383.68,10.27h-20.15v19.39h20.15V10.27Z',
    'M443.3,10.27h-30.82v4.62h30.82v25.04h-41.49v-10.27h30.82v-4.49h-30.82V0h41.49v10.27Z'
  ];

  function trazos(lista) {
    return lista.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
  }

  // El logo se dibuja una vez por mitad de la cortina. Cada copia necesita
  // su propio id de recorte para que las dos barras avancen a la par.
  function logo(id) {
    return '' +
      '<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="' + VISTA + '" aria-hidden="true">' +
        '<defs>' +
          '<clipPath id="' + id + '">' +
            '<rect class="barra" x="0" y="0" width="626.18" height="208.23"/>' +
          '</clipPath>' +
        '</defs>' +
        '<g class="pista">' + trazos(TECH) + '</g>' +
        '<g class="relleno" clip-path="url(#' + id + ')">' + trazos(TECH) + '</g>' +
        '<g class="hablemos">' + trazos(HABLEMOS) + '</g>' +
      '</svg>';
  }

  var ESTILOS = `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: block;
    }

    :host([hidden]) { display: none; }

    .mitad {
      position: absolute;
      left: 0;
      right: 0;
      height: 50%;
      overflow: hidden;
      background-color: #000;
      transition: transform 950ms cubic-bezier(0.65, 0, 0.35, 1);
      will-change: transform;
    }

    .mitad--arriba { top: 0; }
    .mitad--abajo { bottom: 0; }

    :host([data-estado="abierto"]) .mitad--arriba { transform: translateY(-100%); }
    :host([data-estado="abierto"]) .mitad--abajo { transform: translateY(100%); }

    /* Cada mitad contiene el logo completo, alineado a las coordenadas del
       viewport, para que las dos copias formen una sola imagen continua. */
    .lienzo {
      position: absolute;
      left: 0;
      width: 100%;
      height: 200%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mitad--arriba .lienzo { top: 0; }
    .mitad--abajo .lienzo { bottom: 0; }

    .logo {
      display: block;
      width: min(58vw, 440px);
      height: auto;
    }

    .pista { fill: #1a9960; }
    .relleno { fill: #31dc8d; }
    .hablemos { fill: #fff; }

    .barra {
      transform-box: view-box;
      transform-origin: 0 0;
      transform: scaleX(0);
    }

    .estado {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .barra { transform: scaleX(1); }
      .mitad { transition-duration: 1ms; }
    }
  `;

  class HeroMarca extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;

      var sombra = this.attachShadow({ mode: 'open' });
      sombra.innerHTML =
        '<style>' + ESTILOS + '</style>' +
        '<div class="mitad mitad--arriba"><div class="lienzo">' + logo('recorte-arriba') + '</div></div>' +
        '<div class="mitad mitad--abajo"><div class="lienzo">' + logo('recorte-abajo') + '</div></div>' +
        '<p class="estado" role="status">Cargando</p>';

      this._desplazamiento = document.body.style.overflow;
      this._bloquearScroll();

      this.medirCarga(sombra);
    }

    _bloquearScroll() {
      this._scrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('sitio-cargando');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + this._scrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      window.scrollTo(0, 0);
    }

    _desbloquearScroll() {
      document.documentElement.classList.remove('sitio-cargando');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = this._desplazamiento || '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, 0);
    }

    medirCarga(sombra) {
      var componente = this;
      var barras = sombra.querySelectorAll('.barra');
      var estado = sombra.querySelector('.estado');
      var mitad = sombra.querySelector('.mitad--arriba');

      // Espera mínima para que la marca no aparezca como un parpadeo,
      // tope máximo para que un recurso colgado no atrape al usuario.
      var ESPERA_MINIMA = 700;
      var TOPE = 8000;
      var SUAVIZADO = 0.1;
      var PAUSA_ANTES_DE_ABRIR = 420;

      var inicio = performance.now();
      var avance = 0;
      var cargaTerminada = false;
      var tiempoMinimoListo = false;
      var videoBannerListo = false;
      var finalizado = false;

      function marcarCargaTerminada() {
        if (cargaTerminada) return;
        if (!tiempoMinimoListo) return;
        if (!videoBannerListo) return;
        cargaTerminada = true;
      }

      function marcarVideoBannerListo() {
        if (videoBannerListo) return;
        videoBannerListo = true;
        marcarCargaTerminada();
      }

      function esperarVideoBanner() {
        var iframe = document.querySelector('.agenda__plancha-video');
        if (!iframe || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          marcarVideoBannerListo();
          return;
        }

        function onMessage(evento) {
          if (String(evento.origin).indexOf('vimeo.com') === -1) return;

          var data = evento.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (err) { return; }
          }
          if (!data || !data.event) return;

          if (data.event === 'ready' && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'playing' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'timeupdate' }), '*');
          }

          if (data.event === 'play' || data.event === 'playing' || data.event === 'timeupdate' || data.event === 'bufferend') {
            window.removeEventListener('message', onMessage);
            marcarVideoBannerListo();
          }
        }

        window.addEventListener('message', onMessage);
        iframe.addEventListener('load', function () {
          setTimeout(marcarVideoBannerListo, 1200);
        }, { once: true });
        setTimeout(marcarVideoBannerListo, TOPE);
      }

      function pintar(valor) {
        for (var i = 0; i < barras.length; i++) {
          barras[i].style.transform = 'scaleX(' + valor.toFixed(4) + ')';
        }
      }

      function retirar() {
        componente.hidden = true;
        componente.remove();
        componente.dispatchEvent(new CustomEvent('hero-marca:abierto', { bubbles: true }));
      }

      function marcarHeroListo() {
        var hero = document.querySelector('.hero');
        if (!hero || hero.classList.contains('hero-listo')) return;

        var hijos = hero.querySelectorAll(':scope > :not(.hero__capas)');
        hijos.forEach(function (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.visibility = 'visible';
        });

        hero.removeAttribute('data-intro');
        hero.classList.add('hero-listo');
        document.documentElement.classList.add('sitio-estable');

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            hijos.forEach(function (el) {
              el.style.removeProperty('opacity');
              el.style.removeProperty('transform');
              el.style.removeProperty('visibility');
            });
          });
        });
      }

      function abrir() {
        componente._desbloquearScroll();
        document.body.removeAttribute('aria-busy');
        document.documentElement.classList.add('sitio-revelado');
        componente.dataset.estado = 'abierto';
        componente.dispatchEvent(new CustomEvent('hero-marca:abriendo', { bubbles: true }));

        var hero = document.querySelector('.hero');
        if (hero) {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            marcarHeroListo();
          } else {
            hero.dataset.intro = 'activa';
            var ultimo = hero.querySelector(':scope > :not(.hero__capas):last-child');
            if (ultimo) {
              ultimo.addEventListener('animationend', marcarHeroListo, { once: true });
            }
            setTimeout(marcarHeroListo, 1500);
          }
        }

        mitad.addEventListener('transitionend', retirar, { once: true });
        setTimeout(retirar, 1600);
      }

      function terminar() {
        if (finalizado) return;
        finalizado = true;

        if (estado) estado.textContent = 'Sitio cargado';
        componente.dispatchEvent(new CustomEvent('hero-marca:listo', { bubbles: true }));
        setTimeout(abrir, PAUSA_ANTES_DE_ABRIR);
      }

      function anunciarCarga() {
        if (tiempoMinimoListo) return;
        var restante = Math.max(0, ESPERA_MINIMA - (performance.now() - inicio));
        setTimeout(function () {
          tiempoMinimoListo = true;
          marcarCargaTerminada();
        }, restante);
      }

      if (document.readyState === 'complete') anunciarCarga();
      else window.addEventListener('load', anunciarCarga, { once: true });
      setTimeout(anunciarCarga, TOPE);
      esperarVideoBanner();

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // La hoja del componente ya deja la palabra llena; solo falta abrir.
        var cerrar = function () { setTimeout(terminar, ESPERA_MINIMA); };
        if (document.readyState === 'complete') cerrar();
        else window.addEventListener('load', cerrar, { once: true });
        return;
      }

      var fuentesListas = false;
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { fuentesListas = true; });
      } else {
        fuentesListas = true;
      }

      function proporcionImagenes() {
        var imagenes = document.images;
        if (!imagenes.length) return 1;

        var listas = 0;
        for (var i = 0; i < imagenes.length; i++) {
          if (imagenes[i].complete) listas++;
        }
        return listas / imagenes.length;
      }

      function objetivo(ahora) {
        if (cargaTerminada) return 1;

        var porHitos =
          (document.readyState !== 'loading' ? 0.25 : 0) +
          (fuentesListas ? 0.25 : 0) +
          proporcionImagenes() * 0.4;

        var porTiempo = 0.9 * (1 - Math.exp(-(ahora - inicio) / 2200));

        return Math.min(0.94, Math.max(porHitos, porTiempo));
      }

      function cuadro(ahora) {
        var meta = objetivo(ahora);
        avance += (meta - avance) * SUAVIZADO;

        if (cargaTerminada && meta - avance < 0.005) avance = 1;
        pintar(avance);

        if (avance >= 0.9999) {
          terminar();
          return;
        }
        requestAnimationFrame(cuadro);
      }

      requestAnimationFrame(cuadro);
    }
  }

  customElements.define('hero-marca', HeroMarca);
})();

(function () {
  'use strict';

  var CHANNEL_ID = 'UC3uzFPfZTUldUQduP2oqkjg';
  var FEED_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' +
    encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID);
  var PREVIEW = 5;

  var FALLBACK = [
    { id: '3GCIKLI7hLc', title: 'De las Big Four a Silicon Valley: Ciberseguridad en una Fintech Global' },
    { id: 'VBF1oLRl2js', title: 'Personas, Procesos y Tecnología: el triángulo que todo IT leader necesita entender | Victor Mendivil' },
    { id: '7tgxND4UkYk', title: 'De Tijuana a Blindar la Energía de los Datacenters con Manuel Ocaña Palazuelos' },
    { id: 'GOw4eIwbLz8', title: 'Ciberseguridad en Manufactura: Menos Humo, Más Datos con Agustín Tiburcio' },
    { id: 'Y0Z7NWwXKTI', title: '¿Está la IA redefiniendo los roles en tecnología?' }
  ];

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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalize(items) {
    var seen = {};
    var episodes = [];

    items.forEach(function (item) {
      var id = item.id || videoIdFromLink(item.link || item.guid || '');
      var link = item.link || ('https://www.youtube.com/watch?v=' + id);
      if (!id || seen[id] || isShort(link)) return;
      seen[id] = true;
      episodes.push({
        id: id,
        title: item.title || '',
        link: 'https://www.youtube.com/watch?v=' + id
      });
    });

    return episodes;
  }

  function fallbackEpisodes() {
    return FALLBACK.map(function (item) {
      return {
        id: item.id,
        title: item.title,
        link: 'https://www.youtube.com/watch?v=' + item.id
      };
    });
  }

  async function loadEpisodes() {
    try {
      var response = await fetch(FEED_URL);
      if (!response.ok) throw new Error('feed');
      var data = await response.json();
      var episodes = normalize(data.items || []);
      if (episodes.length) return episodes.slice(0, PREVIEW);
    } catch (error) {
      console.warn('No se pudo actualizar el feed de YouTube.', error);
    }
    return fallbackEpisodes().slice(0, PREVIEW);
  }

  function laminaHtml(ep, index) {
    var id = encodeURIComponent(ep.id);
    var abierta = index === 0 ? ' estudio__lamina--abierta' : '';

    return (
      '<a class="estudio__lamina' + abierta + '" href="' + escapeHtml(ep.link) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="estudio__foto">' +
          '<img src="https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg" alt="" width="1280" height="720" loading="' + (index === 0 ? 'eager' : 'lazy') + '" decoding="async" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg\'">' +
        '</span>' +
        '<span class="estudio__play" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M8.5 6.5v11l9-5.5-9-5.5z"/></svg>' +
        '</span>' +
        '<span class="estudio__dato">' +
          '<span class="estudio__num">EP ' + String(index + 1).padStart(2, '0') + '</span>' +
          '<span class="estudio__titulo">' + escapeHtml(ep.title) + '</span>' +
          '<span class="estudio__ir">Ver en YouTube</span>' +
        '</span>' +
      '</a>'
    );
  }

  function pintar(pista, episodios) {
    pista.innerHTML = episodios.map(laminaHtml).join('');
  }

  function activar(pista, lamina) {
    Array.prototype.forEach.call(pista.children, function (nodo) {
      nodo.classList.toggle('estudio__lamina--abierta', nodo === lamina);
    });
  }

  function enlazar(pista) {
    pista.addEventListener('pointerenter', function (event) {
      var lamina = event.target.closest('.estudio__lamina');
      if (!lamina || !pista.contains(lamina)) return;
      if (event.pointerType === 'touch') return;
      activar(pista, lamina);
    }, true);

    pista.addEventListener('focusin', function (event) {
      var lamina = event.target.closest('.estudio__lamina');
      if (lamina) activar(pista, lamina);
    });
  }

  function init() {
    var pista = document.querySelector('[data-estudio-pista]');
    if (!pista) return;

    pintar(pista, fallbackEpisodes().slice(0, PREVIEW));
    enlazar(pista);

    loadEpisodes().then(function (episodios) {
      if (!episodios.length) return;
      pintar(pista, episodios);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

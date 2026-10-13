(function () {
  'use strict';

  function coverPath(url) {
    if (!url) return '/assets/img/hero-fondo.jpg';
    return url.charAt(0) === '/' ? url : '/' + url;
  }

  function escapar(texto) {
    var nodo = document.createElement('span');
    nodo.textContent = texto || '';
    return nodo.innerHTML;
  }

  /* Sin sesión, los enlaces a una edición abren el registro y regresan a ella. */
  function protegerEnlaces() {
    document.querySelectorAll('[data-revista-protegida]').forEach(function (enlace) {
      enlace.setAttribute('data-auth-open', 'registro');
      enlace.setAttribute('data-auth-next', enlace.getAttribute('href'));
    });
  }

  async function sumarEdicionesDeBase(grid) {
    var client = HTAuth.getClient();
    if (!client) return;

    var result = await client
      .from('magazine_issues')
      .select('slug, title, subtitle, cover_url, summary, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (result.error) throw result.error;

    var presentes = {};
    document.querySelectorAll('[data-slug]').forEach(function (nodo) {
      presentes[nodo.dataset.slug] = true;
    });

    var html = result.data.filter(function (issue) {
      return issue.slug && !presentes[issue.slug];
    }).map(function (issue) {
      return (
        '<article class="edicion" data-slug="' + escapar(issue.slug) + '">' +
          '<a class="edicion__enlace" href="/revista/' + encodeURIComponent(issue.slug) + '/">' +
            '<span class="edicion__portada">' +
              '<img src="' + escapar(coverPath(issue.cover_url)) + '" alt="" width="791" height="1024" loading="lazy" decoding="async">' +
            '</span>' +
            '<span class="edicion__tipo">' + escapar(issue.subtitle || 'Revista') + '</span>' +
            '<span class="edicion__titulo">' + escapar(issue.title) + '</span>' +
            (issue.summary ? '<span class="edicion__resumen">' + escapar(issue.summary) + '</span>' : '') +
          '</a>' +
        '</article>'
      );
    }).join('');

    if (html) grid.insertAdjacentHTML('beforeend', html);
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var grid = document.getElementById('revista-grid');
    var gate = document.getElementById('revista-gate');
    if (!grid || !window.HTAuth) return;

    try {
      var session = await HTAuth.getSession();
      var profile = session ? await HTAuth.getProfile() : null;

      if (!session) {
        protegerEnlaces();
      } else if (gate && !HTAuth.hasRevistaAccess(profile)) {
        gate.hidden = false;
        gate.querySelector('[data-gate="pending"]').hidden = false;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      await sumarEdicionesDeBase(grid);
    } catch (error) {
      console.error(error);
    }
  });
})();

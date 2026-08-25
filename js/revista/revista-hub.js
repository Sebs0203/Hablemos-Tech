(function () {
  'use strict';

  function coverPath(url) {
    if (!url) return '/assets/img/hero-fondo.jpg';
    return url.charAt(0) === '/' ? url : '/' + url;
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var grid = document.getElementById('revista-grid');
    var gate = document.getElementById('revista-gate');
    if (!grid || !window.HTAuth) return;

    var session = await HTAuth.getSession();
    var profile = session ? await HTAuth.getProfile() : null;
    var hasAccess = HTAuth.hasRevistaAccess(profile);

    if (gate) {
      if (!session) {
        gate.hidden = false;
        gate.querySelector('[data-gate="login"]').hidden = false;
      } else if (!hasAccess) {
        gate.hidden = false;
        gate.querySelector('[data-gate="pending"]').hidden = false;
      }
    }

    try {
      var client = HTAuth.getClient();
      var result = await client
        .from('magazine_issues')
        .select('slug, title, subtitle, cover_url, summary, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (result.error) throw result.error;

      grid.innerHTML = result.data.map(function (issue) {
        return (
          '<article class="revista-card">' +
            '<a class="revista-card__enlace" href="/revista/' + issue.slug + '/">' +
              '<div class="revista-card__portada">' +
                '<img src="' + coverPath(issue.cover_url) + '" alt="" width="1024" height="579" loading="lazy">' +
              '</div>' +
              '<div class="revista-card__meta">' +
                '<p class="revista-card__tipo">Revista</p>' +
                '<h2 class="revista-card__titulo">' + issue.title + '</h2>' +
                '<p class="revista-card__subtitulo">' + (issue.subtitle || '') + '</p>' +
                '<p class="revista-card__resumen">' + (issue.summary || '') + '</p>' +
              '</div>' +
            '</a>' +
          '</article>'
        );
      }).join('');
    } catch (error) {
      grid.innerHTML = '<p class="auth-alert" data-tipo="error">No se pudo cargar la revista.</p>';
      console.error(error);
    }
  });
})();

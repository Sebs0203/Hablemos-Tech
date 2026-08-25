(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    var params = new URLSearchParams(window.location.search);
    var issueSlug = params.get('issue');
    var articleSlug = params.get('slug');
    var articleRoot = document.getElementById('articulo-root');
    var gate = document.getElementById('revista-gate');
    if (!issueSlug || !articleSlug || !articleRoot || !window.HTAuth) return;

    var session = await HTAuth.getSession();
    var profile = session ? await HTAuth.getProfile() : null;
    var hasAccess = HTAuth.hasRevistaAccess(profile);
    var paginaActual = window.location.pathname + window.location.search;

    document.querySelectorAll('#revista-gate [data-auth-open]').forEach(function (node) {
      if (!node.getAttribute('data-auth-next')) {
        node.setAttribute('data-auth-next', paginaActual);
      }
    });

    try {
      var client = HTAuth.getClient();
      var articleResult = await client.rpc('get_magazine_article', {
        p_issue_slug: issueSlug,
        p_article_slug: articleSlug
      });

      if (articleResult.error) throw articleResult.error;

      if (!articleResult.data || articleResult.data.length === 0) {
        articleRoot.innerHTML = '<p class="auth-alert" data-tipo="error">Artículo no encontrado.</p>';
        return;
      }

      var article = articleResult.data[0];
      var issueTitle = article.issue_title;

      if (!article.is_teaser && !hasAccess) {
        if (gate) {
          gate.hidden = false;
          if (!session) {
            gate.querySelector('[data-gate="login"]').hidden = false;
          } else {
            gate.querySelector('[data-gate="pending"]').hidden = false;
          }
        }
        articleRoot.innerHTML =
          '<p class="revista-articulo__tipo">Revista · ' + issueTitle + '</p>' +
          '<h1 class="revista-articulo__titulo">' + article.title + '</h1>' +
          '<p class="revista-articulo__resumen">' + (article.excerpt || '') + '</p>';
        return;
      }

      if (!article.body_html) {
        articleRoot.innerHTML = '<p class="auth-alert" data-tipo="error">No tienes acceso a este artículo.</p>';
        return;
      }

      document.title = article.title + ' — Hablemos Tech';

      articleRoot.innerHTML =
        '<p class="revista-articulo__tipo"><a href="/revista/' + issueSlug + '/">← ' + issueTitle + '</a></p>' +
        '<h1 class="revista-articulo__titulo">' + article.title + '</h1>' +
        '<p class="revista-articulo__resumen">' + (article.excerpt || '') + '</p>' +
        '<div class="revista-articulo__cuerpo">' + article.body_html + '</div>';
    } catch (error) {
      articleRoot.innerHTML = '<p class="auth-alert" data-tipo="error">No se pudo cargar el artículo.</p>';
      console.error(error);
    }
  });
})();

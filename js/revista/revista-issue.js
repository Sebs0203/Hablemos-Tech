(function () {
  'use strict';

  function coverPath(url) {
    if (!url) return '/assets/img/hero-fondo.jpg';
    return url.charAt(0) === '/' ? url : '/' + url;
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var issueSlug = document.body.dataset.issue;
    var hero = document.getElementById('issue-hero');
    var list = document.getElementById('issue-articles');
    var gate = document.getElementById('revista-gate');
    var pdfBtn = document.getElementById('issue-pdf');
    if (!issueSlug || !window.HTAuth) return;

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
      var issueResult = await client
        .from('magazine_issues')
        .select('id, slug, title, subtitle, cover_url, summary, pdf_path, published_at')
        .eq('slug', issueSlug)
        .maybeSingle();

      if (issueResult.error) throw issueResult.error;
      if (!issueResult.data) {
        hero.innerHTML = '<p class="auth-alert" data-tipo="error">Edición no encontrada.</p>';
        return;
      }

      var issue = issueResult.data;
      hero.innerHTML =
        '<div class="revista-issue__portada">' +
          '<img src="' + coverPath(issue.cover_url) + '" alt="" width="1024" height="579">' +
        '</div>' +
        '<div class="revista-issue__intro">' +
          '<p class="revista-issue__tipo">Revista digital</p>' +
          '<h1 class="revista-issue__titulo">' + issue.title + '</h1>' +
          '<p class="revista-issue__subtitulo">' + (issue.subtitle || '') + '</p>' +
          '<p class="revista-issue__resumen">' + (issue.summary || '') + '</p>' +
        '</div>';

      if (pdfBtn) {
        if (hasAccess && issue.pdf_path) {
          pdfBtn.href = issue.pdf_path;
          pdfBtn.hidden = false;
        } else if (hasAccess) {
          pdfBtn.hidden = false;
          pdfBtn.classList.add('boton--deshabilitado');
          pdfBtn.setAttribute('aria-disabled', 'true');
          pdfBtn.textContent = 'PDF — próximamente';
        }
      }

      var articlesResult = await client.rpc('list_issue_articles', {
        p_issue_slug: issueSlug
      });

      if (articlesResult.error) throw articlesResult.error;

      list.innerHTML = articlesResult.data.map(function (article) {
        var locked = !article.is_teaser && !hasAccess;
        var articuloUrl = '/revista/articulo.html?issue=' + issueSlug + '&slug=' + article.slug;
        var href = locked
          ? '#'
          : articuloUrl;
        var attrs = locked
          ? ' data-auth-open="registro" data-auth-next="' + articuloUrl + '"'
          : '';

        return (
          '<article class="revista-articulo-card' + (locked ? ' revista-articulo-card--bloqueado' : '') + '">' +
            '<p class="revista-articulo-card__tipo">' + (article.is_teaser ? 'Lectura abierta' : (hasAccess ? 'Exclusivo' : 'Registro requerido')) + '</p>' +
            '<h2 class="revista-articulo-card__titulo"><a href="' + href + '"' + attrs + '>' + article.title + '</a></h2>' +
            '<p class="revista-articulo-card__resumen">' + (article.excerpt || '') + '</p>' +
          '</article>'
        );
      }).join('');
    } catch (error) {
      console.error(error);
      list.innerHTML = '<p class="auth-alert" data-tipo="error">No se pudieron cargar los artículos.</p>';
    }
  });
})();

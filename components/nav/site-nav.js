(function () {
  'use strict';

  var template =
    '<header class="nav">' +
      '<a class="nav__marca" href="/" aria-label="Hablemos Tech, inicio">' +
        '<img class="nav__logo" src="/components/hero-marca/logo.svg" alt="" width="626" height="208">' +
      '</a>' +
      '<div class="nav__acciones">' +
        '<a class="nav__enlace nav__enlace--cta" href="#" data-auth-open="registro" data-auth-guest>Registro</a>' +
        '<a class="nav__enlace nav__enlace--cta nav__enlace--signin" href="#" data-auth-open="sign-in" data-auth-guest>Sign in</a>' +
        '<a class="nav__enlace nav__enlace--cta" href="/cuenta.html" data-auth-user hidden>Mi cuenta</a>' +
      '</div>' +
    '</header>';

  function mount() {
    var target = document.getElementById('site-nav');
    if (target) {
      target.outerHTML = template;
      return;
    }

    if (document.querySelector('header.nav')) return;

    document.body.insertAdjacentHTML('afterbegin', template);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();

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
        '<div class="nav__user" data-auth-user hidden>' +
          '<button class="nav__user-btn" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-user-menu" data-auth-user-toggle>' +
            '<span class="nav__user-avatar" data-auth-iniciales aria-hidden="true">HT</span>' +
            '<span class="nav__user-info">' +
              '<span class="nav__user-name" data-auth-nombre>Mi cuenta</span>' +
              '<span class="nav__user-tier" data-auth-estado>Revista</span>' +
            '</span>' +
            '<svg class="nav__user-chev" viewBox="0 0 10 10" aria-hidden="true">' +
              '<path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</button>' +
          '<div class="nav__user-menu" id="nav-user-menu" role="menu">' +
            '<p class="nav__user-menu-head" data-auth-email></p>' +
            '<a class="nav__user-menu-cta" href="/cuenta.html" role="menuitem">Mi cuenta</a>' +
            '<button class="nav__user-menu-link nav__user-menu-link--danger" type="button" role="menuitem" data-auth-logout>Cerrar sesión</button>' +
          '</div>' +
        '</div>' +
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

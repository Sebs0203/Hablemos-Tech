(function () {
  'use strict';

  var bound = false;

  function closeUserMenu() {
    var toggle = document.querySelector('[data-auth-user-toggle]');
    var menu = document.getElementById('nav-user-menu');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (menu) menu.classList.remove('is-open');
  }

  function toggleUserMenu() {
    var toggle = document.querySelector('[data-auth-user-toggle]');
    var menu = document.getElementById('nav-user-menu');
    if (!toggle || !menu) return;
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    menu.classList.toggle('is-open', !open);
  }

  function bindUserMenu() {
    if (bound) return;
    bound = true;

    document.addEventListener('click', function (event) {
      var toggle = event.target.closest('[data-auth-user-toggle]');
      if (toggle) {
        event.preventDefault();
        toggleUserMenu();
        return;
      }

      if (event.target.closest('[data-auth-logout]')) {
        event.preventDefault();
        if (window.HTAuth) HTAuth.signOut();
        return;
      }

      if (!event.target.closest('.nav__user')) closeUserMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeUserMenu();
    });
  }

  async function refreshAuthNav() {
    if (!window.HTAuth) return;

    var guestNodes = document.querySelectorAll('[data-auth-guest]');
    var userNodes = document.querySelectorAll('[data-auth-user]');

    try {
      var session = await HTAuth.getSession();
      var profile = session ? await HTAuth.getProfile() : null;
      var loggedIn = Boolean(session);
      var displayName = loggedIn ? HTAuth.getDisplayName(profile, session) : '';
      var initials = loggedIn ? HTAuth.getInitials(profile, session) : '';
      var email = loggedIn
        ? ((profile && profile.email) || (session.user && session.user.email) || '')
        : '';
      var approved = HTAuth.hasRevistaAccess(profile);

      guestNodes.forEach(function (node) {
        node.hidden = loggedIn;
      });
      userNodes.forEach(function (node) {
        node.hidden = !loggedIn;
      });

      document.querySelectorAll('[data-auth-nombre]').forEach(function (node) {
        if (loggedIn) node.textContent = displayName;
      });
      document.querySelectorAll('[data-auth-iniciales]').forEach(function (node) {
        if (loggedIn) node.textContent = initials;
      });
      document.querySelectorAll('[data-auth-email]').forEach(function (node) {
        if (loggedIn) node.textContent = email;
      });
      document.querySelectorAll('[data-auth-estado]').forEach(function (node) {
        node.hidden = !loggedIn || !approved;
        if (loggedIn && approved) node.textContent = 'Revista';
      });

      if (loggedIn) decorateCuentaLinks();
      if (!loggedIn) closeUserMenu();
    } catch (error) {
      console.error(error);
    }
  }

  function decorateCuentaLinks() {
    var here = window.location.pathname + window.location.search + window.location.hash;
    if (here.indexOf('/cuenta.html') === 0) return;
    document.querySelectorAll('a[href="/cuenta.html"], a[href^="/cuenta.html?"]').forEach(function (link) {
      link.href = '/cuenta.html?next=' + encodeURIComponent(here);
    });
  }

  function watchAuth() {
    if (!window.htSupabase || !window.htSupabase.auth || watchAuth.bound) return;
    watchAuth.bound = true;
    window.htSupabase.auth.onAuthStateChange(function () {
      refreshAuthNav();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindUserMenu();
    refreshAuthNav();
    watchAuth();
    if (!watchAuth.bound) {
      window.setTimeout(watchAuth, 400);
    }
  });
  document.addEventListener('ht:auth-change', refreshAuthNav);
})();

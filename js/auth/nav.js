(function () {
  'use strict';

  async function refreshAuthNav() {
    if (!window.HTAuth) return;

    var guestNodes = document.querySelectorAll('[data-auth-guest]');
    var userNodes = document.querySelectorAll('[data-auth-user]');
    var nameNodes = document.querySelectorAll('[data-auth-nombre]');

    try {
      var session = await HTAuth.getSession();
      var profile = session ? await HTAuth.getProfile() : null;
      var loggedIn = Boolean(session);
      var displayName = loggedIn ? HTAuth.getDisplayName(profile, session) : '';

      guestNodes.forEach(function (node) {
        node.hidden = loggedIn;
      });
      userNodes.forEach(function (node) {
        node.hidden = !loggedIn;
      });
      nameNodes.forEach(function (node) {
        if (!loggedIn) return;
        node.textContent = displayName;
        if (node.tagName === 'A') {
          node.setAttribute('aria-label', 'Cuenta de ' + displayName);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', refreshAuthNav);
  document.addEventListener('ht:auth-change', refreshAuthNav);
})();

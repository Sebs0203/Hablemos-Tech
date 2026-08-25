(function () {
  'use strict';

  async function refreshAuthNav() {
    if (!window.HTAuth) return;

    var guestNodes = document.querySelectorAll('[data-auth-guest]');
    var userNodes = document.querySelectorAll('[data-auth-user]');

    try {
      var session = await HTAuth.getSession();

      guestNodes.forEach(function (node) {
        node.hidden = Boolean(session);
      });
      userNodes.forEach(function (node) {
        node.hidden = !session;
      });
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', refreshAuthNav);
  document.addEventListener('ht:auth-change', refreshAuthNav);
})();

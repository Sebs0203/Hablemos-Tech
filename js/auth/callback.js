(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    var status = document.getElementById('auth-status');
    if (!window.HTAuth || !HTAuth.getClient()) {
      if (status) status.textContent = 'No se pudo conectar con el servicio de acceso.';
      return;
    }

    try {
      var params = new URLSearchParams(window.location.search);
      var next = HTAuth.getNextParam() || '/revista/';

      if (params.get('error_description')) {
        throw new Error(params.get('error_description'));
      }

      var client = HTAuth.getClient();
      var code = params.get('code');

      if (code) {
        var exchange = await client.auth.exchangeCodeForSession(code);
        if (exchange.error) throw exchange.error;
      }

      var sessionResult = await client.auth.getSession();
      if (!sessionResult.data.session) {
        throw new Error('No se pudo iniciar sesión. Intenta de nuevo.');
      }

      await HTAuth.applyPendingProfile();
      var profile = await HTAuth.getProfile();

      if (HTAuth.needsProfessionalInfo(profile)) {
        var dest = next;
        var separator = dest.indexOf('?') >= 0 ? '&' : '?';
        window.location.replace(
          dest + separator + 'auth=completar&next=' + encodeURIComponent(next)
        );
        return;
      }

      window.location.replace(next);
    } catch (error) {
      if (status) {
        status.textContent = error.message || 'Ocurrió un error al iniciar sesión.';
      }
    }
  });
})();

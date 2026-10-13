(function () {
  'use strict';

  /* Supabase manda los errores del enlace en el fragmento (#error=...) y el
     cliente lo limpia al iniciar; se lee antes de que eso pase. */
  var fragmento = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  function conVista(destino, vista, next) {
    var separator = destino.indexOf('?') >= 0 ? '&' : '?';
    return destino + separator + 'auth=' + vista + '&next=' + encodeURIComponent(next);
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var status = document.getElementById('auth-status');
    var volver = document.getElementById('auth-volver');
    if (!window.HTAuth || !HTAuth.getClient()) {
      if (status) status.textContent = 'No se pudo conectar con el servicio de acceso.';
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var next = HTAuth.getNextParam() || '/revista/';
    var recuperando = params.get('tipo') === 'recuperar' || fragmento.get('type') === 'recovery';

    try {
      var errorEnlace = params.get('error_description') || fragmento.get('error_description');
      if (errorEnlace) {
        var expirado = /expired|invalid/i.test(errorEnlace + ' ' + (fragmento.get('error_code') || ''));
        throw new Error(expirado
          ? 'El enlace ya expiró o ya se usó. Pide uno nuevo e inténtalo otra vez.'
          : errorEnlace);
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

      if (recuperando) {
        window.location.replace(conVista(next, 'nueva-clave', next));
        return;
      }

      await HTAuth.applyPendingProfile();
      var profile = await HTAuth.getProfile();

      if (HTAuth.needsProfessionalInfo(profile)) {
        window.location.replace(conVista(next, 'completar', next));
        return;
      }

      window.location.replace(next);
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = error.message || 'Ocurrió un error al iniciar sesión.';
      }
      if (volver) {
        var vista = recuperando ? 'recuperar' : 'sign-in';
        volver.href = conVista(next.split('?')[0], vista, next);
        volver.textContent = recuperando ? 'Pedir otro enlace' : 'Volver a iniciar sesión';
        volver.hidden = false;
      }
    }
  });
})();

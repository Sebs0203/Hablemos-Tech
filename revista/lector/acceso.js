(function () {
  'use strict';

  var HUB = '/revista/';
  var ESPERA_MAX = 12000;

  var raiz = document.documentElement;
  var puerta = document.getElementById('acceso');
  var abrir;

  window.revistaAcceso = new Promise(function (resolve) {
    abrir = resolve;
  });

  if (!puerta) {
    abrir();
    return;
  }

  /* El lector no monta el modal de cuenta; registro, sign in y completar
     perfil se resuelven en el hub y vuelven aquí con ?next. */
  var params = new URLSearchParams(window.location.search);
  var vistaAuth = params.get('auth');
  if (['registro', 'sign-in', 'completar', 'recuperar', 'nueva-clave'].indexOf(vistaAuth) !== -1) {
    window.location.replace(enlaceAuth(vistaAuth));
    return;
  }

  function enlaceAuth(vista) {
    var query = new URLSearchParams({ auth: vista, next: window.location.pathname });
    return HUB + '?' + query.toString();
  }

  function mostrar(estado) {
    puerta.dataset.estado = estado;
    puerta.setAttribute('aria-busy', estado === 'revisando' ? 'true' : 'false');
    puerta.querySelectorAll('[data-vista]').forEach(function (nodo) {
      nodo.hidden = nodo.dataset.vista !== estado;
    });
  }

  function desbloquear() {
    raiz.classList.remove('revista-bloqueada');
    puerta.hidden = true;
    abrir();
  }

  function conLimite(promesa) {
    return Promise.race([
      promesa,
      new Promise(function (_, reject) {
        window.setTimeout(function () {
          reject(new Error('Tiempo de espera agotado al verificar el acceso.'));
        }, ESPERA_MAX);
      })
    ]);
  }

  async function revisar() {
    if (!window.HTAuth || !HTAuth.getClient()) throw new Error('Servicio de cuentas no disponible.');

    var session = await HTAuth.getSession();
    if (!session) return 'invitado';

    var profile = await HTAuth.getProfile();
    if (HTAuth.hasRevistaAccess(profile)) return 'aprobado';
    if (profile && profile.access_status === 'rejected') return 'rechazado';
    if (profile && HTAuth.needsProfessionalInfo(profile)) return 'completar';
    return 'pendiente';
  }

  async function verificar() {
    mostrar('revisando');
    try {
      var estado = await conLimite(revisar());
      if (estado === 'aprobado') desbloquear();
      else mostrar(estado);
    } catch (error) {
      console.error(error);
      mostrar('error');
    }
  }

  puerta.querySelectorAll('[data-acceso-auth]').forEach(function (enlace) {
    enlace.href = enlaceAuth(enlace.dataset.accesoAuth);
  });

  puerta.querySelectorAll('[data-acceso-reintentar]').forEach(function (boton) {
    boton.addEventListener('click', verificar);
  });

  puerta.querySelectorAll('[data-acceso-salir]').forEach(function (boton) {
    boton.addEventListener('click', function () {
      if (window.HTAuth) HTAuth.signOut();
    });
  });

  verificar();
})();

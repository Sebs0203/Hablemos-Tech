(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    var nameEl = document.getElementById('cuenta-nombre');
    var emailEl = document.getElementById('cuenta-email');
    var empresaEl = document.getElementById('cuenta-empresa');
    var accesoEl = document.getElementById('cuenta-acceso');
    var tipoEl = document.getElementById('cuenta-tipo');
    var logoutBtn = document.getElementById('cuenta-logout');
    var revistaBtn = document.getElementById('cuenta-revista');

    if (!window.HTAuth) return;

    var session = await HTAuth.requireAuth({ redirectTo: '/cuenta.html' });
    if (!session) return;

    try {
      var profile = await HTAuth.getProfile();
      if (nameEl) nameEl.textContent = profile.name || '—';
      if (emailEl) emailEl.textContent = profile.email || session.user.email;
      if (empresaEl) empresaEl.textContent = profile.empresa || '—';

      if (accesoEl) {
        if (profile.access_status === 'approved') {
          accesoEl.textContent = 'Aprobado — puedes leer la revista completa.';
          accesoEl.dataset.estado = 'approved';
        } else if (profile.access_status === 'pending') {
          accesoEl.textContent = 'En revisión — puedes ver el sumario mientras validamos tu acceso.';
          accesoEl.dataset.estado = 'pending';
        } else {
          accesoEl.textContent = 'Acceso no disponible. Escríbenos si crees que es un error.';
          accesoEl.dataset.estado = 'rejected';
        }
      }

      if (tipoEl) {
        tipoEl.textContent = profile.email_type === 'personal'
          ? 'Email personal'
          : 'Email corporativo';
      }

      if (revistaBtn && HTAuth.hasRevistaAccess(profile)) {
        revistaBtn.hidden = false;
      }
    } catch (error) {
      console.error(error);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        HTAuth.signOut();
      });
    }
  });
})();

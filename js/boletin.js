(function () {
  'use strict';

  var form = document.getElementById('boletin-form');
  if (!form) return;

  var emailInput = document.getElementById('boletin-email');
  var trapInput = document.getElementById('boletin-empresa');
  var submitBtn = form.querySelector('.boletin__enviar');
  var statusEl = document.getElementById('boletin-estado');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.classList.remove('boletin__estado--ok', 'boletin__estado--error');
    if (kind) statusEl.classList.add('boletin__estado--' + kind);
  }

  function client() {
    return window.htSupabase || null;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (trapInput && trapInput.value.trim()) {
      form.classList.add('es-enviado');
      setStatus('Listo. Te avisamos cuando haya algo nuevo.', 'ok');
      return;
    }

    var email = String(emailInput.value || '').trim();
    if (!email || !emailRe.test(email)) {
      setStatus('Escribe un correo válido, por ejemplo nombre@empresa.com.', 'error');
      emailInput.focus();
      return;
    }

    var db = client();
    if (!db) {
      setStatus('El formulario no está listo. Recarga la página e inténtalo de nuevo.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Enviando…', '');

    db.from('boletin_suscriptores')
      .insert({
        email: email,
        fuentes: ['revista', 'podcast', 'eventos'],
        origen: 'home'
      })
      .then(function (result) {
        var error = result && result.error;
        var duplicate = error && (error.code === '23505' || /duplicate|unique/i.test(error.message || ''));

        if (error && !duplicate) {
          submitBtn.disabled = false;
          setStatus('No se pudo guardar. Revisa el correo e inténtalo de nuevo.', 'error');
          return;
        }

        form.classList.add('es-enviado');
        submitBtn.disabled = false;
        setStatus(
          duplicate
            ? 'Ese correo ya está en la lista. Te seguimos avisando.'
            : 'Listo. Te avisamos cuando haya revista, episodio o evento.',
          'ok'
        );
      })
      .catch(function () {
        submitBtn.disabled = false;
        setStatus('No se pudo guardar. Inténtalo de nuevo en un momento.', 'error');
      });
  });
})();

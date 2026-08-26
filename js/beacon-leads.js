(function () {
  'use strict';

  function defaultSource() {
    return (window.HT_CONFIG && window.HT_CONFIG.beaconSource) || 'hablemos-tech';
  }

  async function sendLead(payload) {
    var client = window.htSupabase;
    if (!client) {
      return { ok: false, skipped: true };
    }

    try {
      var result = await client.functions.invoke('beacon-lead', {
        body: Object.assign({ source: defaultSource() }, payload || {})
      });

      if (result.error) {
        return { ok: false, error: result.error };
      }

      return result.data || { ok: true };
    } catch (error) {
      return { ok: false, error: error };
    }
  }

  window.HTBeacon = {
    sendLead: sendLead
  };
})();

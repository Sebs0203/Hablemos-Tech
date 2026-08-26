(function () {
  'use strict';

  function init() {
    if (window.htSupabase) return true;
    if (!window.supabase || !window.HT_CONFIG) return false;

    window.htSupabase = window.supabase.createClient(
      window.HT_CONFIG.supabaseUrl,
      window.HT_CONFIG.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
    return true;
  }

  if (!init()) {
    document.addEventListener('DOMContentLoaded', init);
  }
})();

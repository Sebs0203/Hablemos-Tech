(function () {
  'use strict';

  if (!window.supabase || !window.HT_CONFIG) return;

  window.htSupabase = window.supabase.createClient(
    window.HT_CONFIG.supabaseUrl,
    window.HT_CONFIG.supabaseAnonKey
  );
})();

(function () {
  'use strict';

  var PERSONAL_DOMAINS = [
    'gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com',
    'yahoo.com', 'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
    'aol.com', 'msn.com', 'ymail.com'
  ];

  function getClient() {
    return window.htSupabase || null;
  }

  function isPersonalEmail(email) {
    if (!email || email.indexOf('@') === -1) return false;
    var domain = email.split('@')[1].toLowerCase();
    return PERSONAL_DOMAINS.indexOf(domain) !== -1;
  }

  function redirectUrl(path) {
    return window.location.origin + path;
  }

  function getNextParam() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next');
    if (!next || next.charAt(0) !== '/') return null;
    return next;
  }

  async function getSession() {
    var client = getClient();
    if (!client) return null;
    var result = await client.auth.getSession();
    return result.data.session || null;
  }

  async function getProfile() {
    var client = getClient();
    var session = await getSession();
    if (!client || !session) return null;

    var result = await client
      .from('profiles')
      .select('id, email, name, empresa, cargo, role_area, access_status, email_type')
      .eq('id', session.user.id)
      .maybeSingle();

    if (result.error) throw result.error;
    return result.data;
  }

  function hasRevistaAccess(profile) {
    return Boolean(profile && profile.access_status === 'approved');
  }

  function getDisplayName(profile, session) {
    var full = '';
    if (profile && profile.name) full = String(profile.name).trim();
    if (!full && session && session.user && session.user.user_metadata) {
      full = String(session.user.user_metadata.name || '').trim();
    }
    if (full) {
      var parts = full.split(/\s+/);
      return parts[0];
    }
    var email = (profile && profile.email) || (session && session.user && session.user.email) || '';
    var local = email.split('@')[0];
    return local || 'Cuenta';
  }

  async function requireAuth(options) {
    var opts = options || {};
    var session = await getSession();
    if (!session) {
      var target = opts.redirectTo || window.location.pathname + window.location.search;
      if (window.HTAuthModal) {
        HTAuthModal.open('sign-in', target);
      } else {
        var params = new URLSearchParams({ auth: 'sign-in', next: target });
        window.location.href = window.location.pathname + '?' + params.toString();
      }
      return null;
    }
    return session;
  }

  async function signOut() {
    var client = getClient();
    if (!client) return;
    await client.auth.signOut();
    window.location.href = '/';
  }

  async function updateProfileFields(fields) {
    var client = getClient();
    var session = await getSession();
    if (!client || !session) return;

    var payload = {};
    if (fields.company) payload.empresa = fields.company;
    if (fields.role_area) {
      payload.role_area = fields.role_area;
      payload.cargo = fields.role_area;
    }
    if (fields.name) payload.name = fields.name;

    if (Object.keys(payload).length === 0) return;

    var result = await client.from('profiles').update(payload).eq('id', session.user.id);
    if (result.error) throw result.error;
  }

  var PENDING_KEY = 'ht-pending-profile';

  function setPendingProfile(fields) {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        company: String(fields.company || '').trim(),
        role_area: String(fields.role_area || '').trim()
      }));
    } catch (error) {
      console.error(error);
    }
  }

  function getPendingProfile() {
    try {
      var raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !String(data.company || '').trim() || !String(data.role_area || '').trim()) return null;
      return {
        company: String(data.company).trim(),
        role_area: String(data.role_area).trim()
      };
    } catch (error) {
      return null;
    }
  }

  function clearPendingProfile() {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch (error) {
      console.error(error);
    }
  }

  function needsProfessionalInfo(profile) {
    if (!profile) return true;
    var empresa = String(profile.empresa || '').trim();
    var area = String(profile.role_area || profile.cargo || '').trim();
    return !empresa || !area;
  }

  async function applyPendingProfile() {
    var pending = getPendingProfile();
    if (!pending) return false;
    try {
      await updateProfileFields(pending);
      clearPendingProfile();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  window.HTAuth = {
    getClient: getClient,
    isPersonalEmail: isPersonalEmail,
    redirectUrl: redirectUrl,
    getNextParam: getNextParam,
    getSession: getSession,
    getProfile: getProfile,
    hasRevistaAccess: hasRevistaAccess,
    getDisplayName: getDisplayName,
    requireAuth: requireAuth,
    signOut: signOut,
    updateProfileFields: updateProfileFields,
    setPendingProfile: setPendingProfile,
    getPendingProfile: getPendingProfile,
    clearPendingProfile: clearPendingProfile,
    needsProfessionalInfo: needsProfessionalInfo,
    applyPendingProfile: applyPendingProfile
  };
})();

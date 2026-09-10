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
    if (!next || next.charAt(0) !== '/' || next.charAt(1) === '/') return null;
    return next;
  }

  function getReturnPath(options) {
    var opts = options || {};
    var blocked = opts.exclude || '/cuenta.html';
    var next = getNextParam();
    if (next && next.indexOf(blocked) !== 0) return next;

    try {
      if (document.referrer) {
        var url = new URL(document.referrer);
        if (url.origin === window.location.origin && url.pathname.indexOf(blocked) !== 0) {
          return url.pathname + url.search + url.hash;
        }
      }
    } catch (error) {
      /* ignore invalid referrer */
    }

    return '/';
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
    if (full) return full;
    var email = (profile && profile.email) || (session && session.user && session.user.email) || '';
    var local = email.split('@')[0];
    return local || 'Cuenta';
  }

  function getInitials(profile, session) {
    var name = '';
    if (profile && profile.name) name = String(profile.name).trim();
    if (!name && session && session.user && session.user.user_metadata) {
      name = String(session.user.user_metadata.name || '').trim();
    }
    if (name) {
      var parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    var email = (profile && profile.email) || (session && session.user && session.user.email) || '';
    return (email.charAt(0) || 'H').toUpperCase();
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
    getReturnPath: getReturnPath,
    getSession: getSession,
    getProfile: getProfile,
    hasRevistaAccess: hasRevistaAccess,
    getDisplayName: getDisplayName,
    getInitials: getInitials,
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

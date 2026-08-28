// Strategic X — shared auth helpers (sign in, sign up, Google OAuth).
// Depends on sx-supabase-config.js being loaded first (defines sxSupabaseClient,
// SX_AUTH_REDIRECT_URL). Kept separate from the main site's reviews.js/analytics.js
// on purpose — see sx-supabase-config.js header comment.

(function () {
  function showFormError(formEl, message) {
    var existing = formEl.querySelector('.sx-form-error');
    if (existing) existing.remove();
    if (!message) return;
    var el = document.createElement('div');
    el.className = 'sx-form-error';
    el.textContent = message;
    formEl.insertBefore(el, formEl.firstChild);
  }

  function setSubmitting(button, isSubmitting, defaultLabel) {
    if (!button) return;
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Please wait...' : defaultLabel;
  }

  async function signInWithGoogle() {
    var client = window.sxSupabaseClient;
    if (!client) return;
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.SX_AUTH_REDIRECT_URL }
    });
  }

  function isOnboarded(user) {
    return !!(user && user.user_metadata && user.user_metadata.sx_onboarded);
  }

  async function signOut() {
    var client = window.sxSupabaseClient;
    if (client) {
      await client.auth.signOut();
    }
    window.location.href = 'index.html';
  }

  // Wires up the profile chip in the dashboard-style pages' topbar: clicking
  // it toggles a small dropdown menu (currently just "Log Out"), clicking
  // outside or pressing Escape closes it.
  function wireProfileMenu(toggleEl, menuEl, logoutBtnEl) {
    if (!toggleEl || !menuEl) return;
    var chipEl = toggleEl.closest ? toggleEl.closest('.profile-chip') : toggleEl.parentElement;

    function closeMenu() {
      menuEl.classList.remove('open');
      if (chipEl) chipEl.classList.remove('open');
    }

    function openMenu() {
      menuEl.classList.add('open');
      if (chipEl) chipEl.classList.add('open');
    }

    toggleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuEl.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', function (e) {
      if (!menuEl.classList.contains('open')) return;
      if (menuEl.contains(e.target) || toggleEl.contains(e.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    if (logoutBtnEl) {
      logoutBtnEl.addEventListener('click', function (e) {
        e.stopPropagation();
        signOut();
      });
    }
  }

  // Watches for a SIGNED_IN auth event (password sign-in, Google OAuth
  // redirect, or email-confirmation redirect all land here) and routes
  // first-time users to the onboarding flow, and returning users to their
  // dashboard.
  function watchAuthAndRoute(formEl) {
    var client = window.sxSupabaseClient;
    if (!client) return;
    client.auth.onAuthStateChange(function (event, session) {
      if (event !== 'SIGNED_IN' || !session || !session.user) return;
      if (!isOnboarded(session.user)) {
        window.location.href = 'onboarding.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    });
  }

  window.SXAuth = {
    signInWithGoogle: signInWithGoogle,
    showFormError: showFormError,
    setSubmitting: setSubmitting,
    isOnboarded: isOnboarded,
    watchAuthAndRoute: watchAuthAndRoute,
    signOut: signOut,
    wireProfileMenu: wireProfileMenu
  };
})();

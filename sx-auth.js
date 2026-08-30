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
  //
  // IMPORTANT: Google OAuth redirects back to this page with an auth code
  // in the URL, which the Supabase client exchanges for a session as soon
  // as it's created in sx-supabase-config.js — this can complete (and fire
  // its SIGNED_IN event) BEFORE this function runs and attaches the
  // onAuthStateChange listener below, since script tags execute in order
  // and the exchange is async. If that race is lost, the SIGNED_IN event
  // is missed entirely and the user is left stranded on the sign-in page
  // with no visible reaction, forcing them to click "Continue with
  // Google" a second time. To close that race, we first check for an
  // already-established session via getSession() and route immediately if
  // one exists, in addition to listening for future SIGNED_IN events.
  function routeSignedInUser(user) {
    if (!isOnboarded(user)) {
      window.location.href = 'onboarding.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  function watchAuthAndRoute(formEl) {
    var client = window.sxSupabaseClient;
    if (!client) return;

    client.auth.getSession().then(function (result) {
      var session = result && result.data ? result.data.session : null;
      if (session && session.user) routeSignedInUser(session.user);
    });

    client.auth.onAuthStateChange(function (event, session) {
      if (event !== 'SIGNED_IN' || !session || !session.user) return;
      routeSignedInUser(session.user);
    });
  }

  // Wires up the "Support & Help" sidebar item: clicking it toggles a
  // small popover panel with contact options (WhatsApp / email / call),
  // clicking outside or pressing Escape closes it. Same open/close pattern
  // as wireProfileMenu.
  function wireSupportHelp(toggleEl, panelEl) {
    if (!toggleEl || !panelEl) return;

    function closePanel() {
      panelEl.classList.remove('open');
      toggleEl.classList.remove('active');
    }

    function openPanel() {
      panelEl.classList.add('open');
      toggleEl.classList.add('active');
    }

    toggleEl.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panelEl.classList.contains('open')) {
        closePanel();
      } else {
        openPanel();
      }
    });

    document.addEventListener('click', function (e) {
      if (!panelEl.classList.contains('open')) return;
      if (panelEl.contains(e.target) || toggleEl.contains(e.target)) return;
      closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
  }

  // Wires up the mobile hamburger toggle in the dashboard-style pages'
  // topbar: on narrow screens the sidebar is an off-canvas drawer (see
  // each page's max-width: 760px media query), hidden by default. Clicking
  // the hamburger slides it in over a dark backdrop; clicking the backdrop,
  // pressing Escape, or tapping a nav link inside the drawer closes it
  // again. The backdrop element is created here rather than in markup so
  // every page gets identical behavior without duplicating HTML.
  function wireMobileSidebar(toggleEl, sidebarEl) {
    if (!toggleEl || !sidebarEl) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'sx-sidebar-backdrop';
    document.body.appendChild(backdrop);

    function closeSidebar() {
      sidebarEl.classList.remove('open');
      backdrop.classList.remove('open');
    }

    function openSidebar() {
      sidebarEl.classList.add('open');
      backdrop.classList.add('open');
    }

    toggleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      if (sidebarEl.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    backdrop.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });

    sidebarEl.addEventListener('click', function (e) {
      if (e.target.closest('a.nav-item-link')) closeSidebar();
    });
  }

  window.SXAuth = {
    signInWithGoogle: signInWithGoogle,
    showFormError: showFormError,
    setSubmitting: setSubmitting,
    isOnboarded: isOnboarded,
    watchAuthAndRoute: watchAuthAndRoute,
    signOut: signOut,
    wireProfileMenu: wireProfileMenu,
    wireSupportHelp: wireSupportHelp,
    wireMobileSidebar: wireMobileSidebar
  };
})();

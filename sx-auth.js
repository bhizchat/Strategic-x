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

  // Owners and staff/managers share the exact same set of pages
  // (dashboard.html, my-shop.html, products.html, reviews.html,
  // add-product.html, payments-billing.html) — nothing is hidden or
  // redirected away by role for now. This resolves which shop's data a
  // signed-in user should see: owners by the shop they own (owner_id),
  // staff/managers by the shop they've joined (sx_shop_members). Returns
  // null if a staff account hasn't joined any shop yet (picked "Join as
  // Staff" but never entered an invitation code), so the caller can send
  // them to staff-join.html.
  async function resolveShopContext(user) {
    var client = window.sxSupabaseClient;
    var meta = (user && user.user_metadata) || {};
    var isStaff = meta.sx_shop_role === 'staff';

    if (isStaff) {
      var membershipResult = await client
        .from('sx_shop_members')
        .select('role, sx_shops(id, shop_name, category, market_platform, logo_url)')
        .eq('user_id', user.id)
        .maybeSingle();
      var membership = membershipResult && membershipResult.data;
      if (!membership) return null;
      var joinedShop = membership.sx_shops || {};
      return {
        isStaff: true,
        role: membership.role || null,
        shopId: joinedShop.id || null,
        shopName: joinedShop.shop_name || meta.sx_shop_name || 'Shop',
        category: joinedShop.category || '',
        marketPlatform: joinedShop.market_platform || 'Not set yet',
        logoUrl: joinedShop.logo_url || ''
      };
    }

    var shopRowResult = await client
      .from('sx_shops')
      .select('id, shop_name, category, market_platform, logo_url')
      .eq('owner_id', user.id)
      .maybeSingle();
    var ownedShop = (shopRowResult && shopRowResult.data) || {};
    return {
      isStaff: false,
      role: 'owner',
      shopId: ownedShop.id || null,
      shopName: ownedShop.shop_name || meta.sx_shop_name || 'Your Shop',
      category: ownedShop.category || meta.sx_category || '',
      marketPlatform: ownedShop.market_platform || meta.sx_market_platform || 'Not set yet',
      logoUrl: ownedShop.logo_url || meta.sx_shop_logo_url || ''
    };
  }

  var LAST_GOOGLE_ACCOUNT_KEY = 'sx_last_google_account';

  // Remembers the most recently signed-in Google account (name/email/
  // avatar) in localStorage so the "Continue with Google" button can be
  // personalized into "Sign in as {name}" next time, similar to Google's
  // own account chooser. Only called for Google-provider sessions — email/
  // password sign-ins shouldn't overwrite this.
  function rememberGoogleAccount(user) {
    if (!user || !user.user_metadata) return;
    var meta = user.user_metadata;
    var name = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'there');
    var avatarUrl = meta.avatar_url || meta.picture || '';
    try {
      window.localStorage.setItem(LAST_GOOGLE_ACCOUNT_KEY, JSON.stringify({
        name: name,
        email: user.email || '',
        avatarUrl: avatarUrl
      }));
    } catch (err) {
      // localStorage unavailable (private browsing, etc.) — not critical.
    }
  }

  // Reads back the last-remembered Google account, if any.
  function getLastGoogleAccount() {
    try {
      var raw = window.localStorage.getItem(LAST_GOOGLE_ACCOUNT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  // Rewrites a "Continue with Google" button to show "Sign in as {name}"
  // with the account's avatar, if we have a remembered Google account AND
  // there's still a valid, non-expired session for it. If the session has
  // expired or been signed out of, the button is left as the default
  // "Continue with Google" so a signed-out/expired user isn't shown a
  // stale account (and isn't misled into thinking they're still signed in).
  async function personalizeGoogleButton(buttonEl) {
    var account = getLastGoogleAccount();
    if (!buttonEl || !account) return;

    var client = window.sxSupabaseClient;
    if (!client) return;

    var result = await client.auth.getSession();
    var session = result && result.data ? result.data.session : null;
    if (!session || !session.user) {
      forgetGoogleAccount();
      return;
    }

    var iconHtml = account.avatarUrl
      ? '<img class="oauth-avatar" src="' + account.avatarUrl + '" alt="" referrerpolicy="no-referrer" />'
      : '<span class="oauth-icon"><img src="assets/google.png" alt="" /></span>';
    buttonEl.innerHTML = iconHtml + '<span class="oauth-account">' +
      '<strong>Sign in as ' + account.name + '</strong>' +
      (account.email ? '<span class="oauth-account-email">' + account.email + '</span>' : '') +
      '</span>';
  }

  // Clears the remembered Google account, e.g. on sign-out or when the
  // session has expired — so the "Continue with Google" button reverts to
  // its generic default rather than showing a stale/signed-out account.
  function forgetGoogleAccount() {
    try {
      window.localStorage.removeItem(LAST_GOOGLE_ACCOUNT_KEY);
    } catch (err) {
      // localStorage unavailable — not critical.
    }
  }

  async function signOut() {
    var client = window.sxSupabaseClient;
    if (client) {
      await client.auth.signOut();
    }
    forgetGoogleAccount();
    window.location.href = 'sign-in.html';
  }

  // Permanently deletes the signed-in user's account via the
  // sx_delete_account SECURITY DEFINER RPC (see sx-delete-account-schema.sql)
  // — this removes their auth.users row, which cascades to their sx_shops,
  // sx_products, and sx_shop_members rows. Irreversible, so this always
  // confirms with the user first. Any failure is surfaced with a plain
  // alert (there's no form/toast surface available from a profile-menu
  // button), consistent with the confirm()-based remove-member flow in
  // my-shop.html.
  async function deleteAccount() {
    var client = window.sxSupabaseClient;
    if (!client) return;

    var confirmed = window.confirm(
      'Delete your account? This permanently removes your shop, products, and team data and cannot be undone.'
    );
    if (!confirmed) return;

    var result = await client.rpc('sx_delete_account');
    if (result && result.error) {
      window.alert('Could not delete your account: ' + result.error.message);
      return;
    }

    await client.auth.signOut();
    forgetGoogleAccount();
    window.location.href = 'sign-in.html';
  }

  // Wires up the profile chip in the dashboard-style pages' topbar: clicking
  // it toggles a small dropdown menu ("Log Out" and "Delete Account"),
  // clicking outside or pressing Escape closes it.
  function wireProfileMenu(toggleEl, menuEl, logoutBtnEl, deleteAccountBtnEl) {
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

    if (deleteAccountBtnEl) {
      deleteAccountBtnEl.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteAccount();
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
    if (user && user.app_metadata && user.app_metadata.provider === 'google') {
      rememberGoogleAccount(user);
    }
    if (!isOnboarded(user)) {
      window.location.href = 'onboarding.html';
      return;
    }
    // Owners and staff/managers share the SAME dashboard.html — it's the
    // one place that figures out (by role) whether to load the shop the
    // user owns or the shop they've joined as staff, and will bounce a
    // staff account further to staff-join.html itself if it finds they
    // haven't entered an invitation code yet.
    window.location.href = 'dashboard.html';
  }

  function watchAuthAndRoute(formEl) {
    var client = window.sxSupabaseClient;
    if (!client) return;

    client.auth.getSession().then(function (result) {
      var session = result && result.data ? result.data.session : null;
      if (session && session.user) {
        routeSignedInUser(session.user);
      } else {
        // Nothing to route to (plain page visit, or an OAuth callback that
        // failed to produce a session) — reveal the sign-in form instead
        // of leaving the blank-white loading overlay (see sign-in.html's
        // sx-oauth-loading class) up forever.
        document.documentElement.classList.remove('sx-oauth-loading');
      }
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
  // every page gets identical behavior without duplicating HTML. An
  // optional extraToggleEl (the "More" item in the mobile bottom tab bar)
  // opens/closes the same drawer as toggleEl (the topbar hamburger).
  function wireMobileSidebar(toggleEl, sidebarEl, extraToggleEl) {
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

    function toggleSidebar(e) {
      e.preventDefault();
      e.stopPropagation();
      if (sidebarEl.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }

    toggleEl.addEventListener('click', toggleSidebar);
    if (extraToggleEl) {
      extraToggleEl.addEventListener('click', toggleSidebar);
    }

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
    resolveShopContext: resolveShopContext,
    watchAuthAndRoute: watchAuthAndRoute,
    signOut: signOut,
    deleteAccount: deleteAccount,
    wireProfileMenu: wireProfileMenu,
    wireSupportHelp: wireSupportHelp,
    wireMobileSidebar: wireMobileSidebar,
    personalizeGoogleButton: personalizeGoogleButton
  };
})();

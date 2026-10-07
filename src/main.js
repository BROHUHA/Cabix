/**
 * Mobile Coffee Profile & TD Administrative Portal - Main JavaScript
 * Includes SDF Liquid Glass Refraction Generator and Interactive Navigation
 */

// State tracking for authenticated barista vs guest session
const savedAuth = localStorage.getItem('roastery_auth');
const savedUsername = localStorage.getItem('roastery_username') || 'Dasha';
const savedEmail = localStorage.getItem('roastery_email') || 'ajinaju68@gmail.com';

window.currentUser = {
  isGuest: savedAuth === 'guest',
  name: savedAuth === 'guest' ? 'Guest' : savedUsername,
  email: savedAuth === 'guest' ? 'guest@artisanroastery.app' : savedEmail
};

const ICON_PENCIL = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9"></path>
  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
</svg>`;

const ICON_SIGNIN = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
  <polyline points="10 17 15 12 10 7"></polyline>
  <line x1="15" y1="12" x2="3" y2="12"></line>
</svg>`;

function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return 'Guest';
  const trimmed = name.trim();
  if (!trimmed) return 'Guest';
  if (trimmed.toLowerCase() === 'guest') return 'Guest';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

window.updateTopBarState = function() {
  const btnTopAction = document.getElementById('btn-top-action');
  const iconContainer = document.getElementById('top-action-icon');
  const roleBadge = document.querySelector('.admin-role-badge');
  const roleBadgeSpan = document.querySelector('.admin-role-badge span');
  const userNameEl = document.querySelector('.user-name');
  const userSubtitle = document.querySelector('.user-subtitle');
  const userEmailDisplay = document.querySelector('.user-email-display');

  const isGuest = Boolean(window.currentUser && window.currentUser.isGuest);

  if (isGuest) {
    if (iconContainer) iconContainer.innerHTML = ICON_SIGNIN;
    if (btnTopAction) {
      btnTopAction.setAttribute('aria-label', 'Sign In to Account');
      btnTopAction.setAttribute('title', 'Sign In to Account');
      btnTopAction.classList.add('btn-guest-action');
      btnTopAction.classList.remove('btn-edit');
    }
    if (roleBadge) roleBadge.classList.add('guest-badge');
    if (roleBadgeSpan) roleBadgeSpan.textContent = 'GUEST ACCESS';
    if (userNameEl) userNameEl.textContent = 'Guest';
    if (userSubtitle) {
      userSubtitle.textContent = '';
      userSubtitle.style.display = 'none';
    }
    if (userEmailDisplay) {
      userEmailDisplay.textContent = '';
      userEmailDisplay.style.display = 'none';
    }
  } else {
    if (iconContainer) iconContainer.innerHTML = ICON_PENCIL;
    if (btnTopAction) {
      btnTopAction.setAttribute('aria-label', 'Edit Barista Name');
      btnTopAction.setAttribute('title', 'Edit Barista Name');
      btnTopAction.classList.add('btn-edit');
      btnTopAction.classList.remove('btn-guest-action');
    }
    if (roleBadge) roleBadge.classList.remove('guest-badge');
    const currentName = localStorage.getItem('roastery_username') || (window.currentUser ? window.currentUser.name : 'Dasha');
    if (roleBadgeSpan) roleBadgeSpan.textContent = 'ADMINISTRATIVE ROLE';
    if (userNameEl) userNameEl.textContent = formatDisplayName(currentName);
    if (userSubtitle) {
      userSubtitle.textContent = 'Plum Parfait Latte';
      userSubtitle.style.display = '';
    }
    if (userEmailDisplay) {
      userEmailDisplay.textContent = '';
      userEmailDisplay.style.display = 'none';
    }
  }
};

// Top Left Button Dynamic Action: Sign In for Guests, Edit Username for Logged Users
window.handleTopAction = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const isGuest = Boolean(window.currentUser && window.currentUser.isGuest);

  if (isGuest) {
    // Non-logged (guest) user: Top-left button provides Sign In feature!
    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) {}
    }
    const feedbackEl = document.getElementById('login-feedback');
    if (feedbackEl) {
      feedbackEl.className = 'login-feedback';
      feedbackEl.textContent = 'Sign in with your barista account to edit username and unlock admin privileges.';
    }
    // Return smoothly to login screen
    window.handleBackToLogin();
  } else {
    // Logged-in user: Top-left button opens Edit Username modal!
    window.openEditUsernameModal();
  }

  return false;
};

// Edit Username Modal Functions (10 letters max)
window.openEditUsernameModal = function() {
  const modal = document.getElementById('modal-edit-username');
  const input = document.getElementById('input-edit-username');
  const counter = document.getElementById('edit-username-counter');
  const userNameEl = document.querySelector('.user-name');

  if (input && userNameEl) {
    input.value = userNameEl.textContent.trim().substring(0, 10) || 'Dasha';
    if (counter) {
      counter.textContent = `${input.value.length}/10`;
      counter.classList.toggle('limit', input.value.length >= 10);
    }
  }

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 120);
  }

  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
};

window.closeEditUsernameModal = function() {
  const modal = document.getElementById('modal-edit-username');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

window.saveUsername = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const input = document.getElementById('input-edit-username');
  const userNameEl = document.querySelector('.user-name');

  if (input) {
    const trimmed = input.value.trim().substring(0, 10);
    if (trimmed) {
      const formatted = formatDisplayName(trimmed);
      if (userNameEl) {
        userNameEl.textContent = formatted;
      }
      localStorage.setItem('roastery_username', formatted);
      if (window.currentUser) {
        window.currentUser.name = formatted;
      }
    }
  }

  window.closeEditUsernameModal();

  if (navigator.vibrate) {
    try { navigator.vibrate([20, 40, 20]); } catch (_) {}
  }

  return false;
};

// First-Time Login Welcome Modal Functions (10 letters max)
window.openFirstLoginModal = function() {
  const modal = document.getElementById('modal-first-login');
  const input = document.getElementById('input-first-username');
  const counter = document.getElementById('first-username-counter');
  const currentName = localStorage.getItem('roastery_username') || '';

  if (input) {
    input.value = currentName.substring(0, 10);
    if (counter) {
      counter.textContent = `${input.value.length}/10`;
      counter.classList.toggle('limit', input.value.length >= 10);
    }
  }

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 150);
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([20, 40]); } catch (_) {}
  }
};

window.closeFirstLoginModal = function() {
  const modal = document.getElementById('modal-first-login');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

window.saveFirstLoginUsername = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const input = document.getElementById('input-first-username');
  const userNameEl = document.querySelector('.user-name');

  let chosenName = 'Dasha';
  if (input && input.value.trim()) {
    chosenName = formatDisplayName(input.value.trim().substring(0, 10));
  } else {
    chosenName = 'Dasha';
  }

  localStorage.setItem('roastery_username', chosenName);
  localStorage.setItem('roastery_first_login_completed', 'true');

  if (window.currentUser) {
    window.currentUser.name = chosenName;
  }
  if (userNameEl) {
    userNameEl.textContent = chosenName;
  }

  window.closeFirstLoginModal();

  if (navigator.vibrate) {
    try { navigator.vibrate([25, 50, 25]); } catch (_) {}
  }

  return false;
};

// Global instant navigation handlers (available immediately before DOMContentLoaded)
window.handleDirectLogin = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const viewLogin = document.getElementById('view-login');
  const viewProfile = document.getElementById('view-profile');
  const feedbackEl = document.getElementById('login-feedback');
  const emailInput = document.getElementById('td-email');

  const isFirstTime = !localStorage.getItem('roastery_first_login_completed');

  // Authenticate user
  if (window.currentUser) {
    window.currentUser.isGuest = false;
    if (emailInput && emailInput.value.trim()) {
      window.currentUser.email = emailInput.value.trim();
      localStorage.setItem('roastery_email', emailInput.value.trim());
    }
  }
  localStorage.setItem('roastery_auth', 'logged_in');
  window.updateTopBarState();

  if (feedbackEl) {
    feedbackEl.className = 'login-feedback success';
    feedbackEl.textContent = '✓ Administrative Login Authorized';
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([20, 40, 20]); } catch (_) {}
  }

  setTimeout(() => {
    if (viewLogin) viewLogin.classList.remove('active');
    if (viewProfile) viewProfile.classList.add('active');
    const screenEl = document.querySelector('.screen');
    if (screenEl) screenEl.scrollTop = 0;
    if (feedbackEl) feedbackEl.textContent = '';

    try {
      history.pushState({ screen: 'profile' }, '', '#profile');
    } catch (_) {}

    // Pop up window for first-time logged user to set their username (max 10 letters)
    if (isFirstTime) {
      setTimeout(() => {
        window.openFirstLoginModal();
      }, 300);
    }

    // Safely recompute liquid glass on visible profile screen
    setTimeout(() => {
      try {
        if (typeof window.initLiquidGlass === 'function') {
          window.initLiquidGlass();
        }
      } catch (_) {}
    }, 80);
  }, 180);

  return false;
};

// 1-Tap Free Guest Login Handler
window.handleGuestLogin = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const viewLogin = document.getElementById('view-login');
  const viewProfile = document.getElementById('view-profile');
  const feedbackEl = document.getElementById('login-feedback');

  // Set guest state
  if (window.currentUser) {
    window.currentUser.isGuest = true;
    window.currentUser.name = 'Guest';
    window.currentUser.email = 'guest@artisanroastery.app';
  }
  localStorage.setItem('roastery_auth', 'guest');
  window.updateTopBarState();

  if (feedbackEl) {
    feedbackEl.className = 'login-feedback success';
    feedbackEl.textContent = '✓ Free Guest Barista Pass Activated';
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([15, 30, 15]); } catch (_) {}
  }

  setTimeout(() => {
    if (viewLogin) viewLogin.classList.remove('active');
    if (viewProfile) viewProfile.classList.add('active');
    const screenEl = document.querySelector('.screen');
    if (screenEl) screenEl.scrollTop = 0;
    if (feedbackEl) feedbackEl.textContent = '';

    try {
      history.pushState({ screen: 'profile' }, '', '#profile');
    } catch (_) {}

    setTimeout(() => {
      try {
        if (typeof window.initLiquidGlass === 'function') {
          window.initLiquidGlass();
        }
      } catch (_) {}
    }, 80);
  }, 160);

  return false;
};

window.handleBackToLogin = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const viewLogin = document.getElementById('view-login');
  const viewProfile = document.getElementById('view-profile');

  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }

  if (viewProfile) viewProfile.classList.remove('active');
  if (viewLogin) viewLogin.classList.add('active');
  const screenEl = document.querySelector('.screen');
  if (screenEl) screenEl.scrollTop = 0;

  try {
    history.pushState({ screen: 'login' }, '', '#login');
  } catch (_) {}

  return false;
};

window.triggerDirectInstall = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  if (window.deferredInstallPrompt) {
    window.deferredInstallPrompt.prompt();
    window.deferredInstallPrompt.userChoice.then((choice) => {
      console.log('[PWA] Install prompt outcome:', choice.outcome);
      window.deferredInstallPrompt = null;
    }).catch(() => {});
  } else {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
      alert('📲 Install to iOS Home Screen:\n\n1. Tap the Share button (⎋) at the bottom of Safari.\n2. Tap "Add to Home Screen".\n3. Tap "Add" to launch in edge-to-edge standalone mode!');
    } else {
      alert('📲 Direct 1-Tap Web App Install:\n\n1. Tap the 3 dots (⋮) in Chrome top right.\n2. Tap "Install app" or "Add to Home screen".\n3. Tap "Install".\n\nIt installs directly onto your phone drawer with live OTA updates!');
    }
  }
};

// Handle hardware back button navigation
window.addEventListener('popstate', (e) => {
  const viewLogin = document.getElementById('view-login');
  const viewProfile = document.getElementById('view-profile');
  if (e.state && e.state.screen === 'profile') {
    if (viewLogin) viewLogin.classList.remove('active');
    if (viewProfile) viewProfile.classList.add('active');
  } else {
    if (viewProfile) viewProfile.classList.remove('active');
    if (viewLogin) viewLogin.classList.add('active');
  }
  const screenEl = document.querySelector('.screen');
  if (screenEl) screenEl.scrollTop = 0;
});

function generateLiquidGlassFilter(element, index) {
  try {
    const rect = element.getBoundingClientRect();
    const width = Math.round(rect.width || element.offsetWidth || 0);
    const height = Math.round(rect.height || element.offsetHeight || 0);

    // Skip elements that are not currently visible (e.g. In hidden screens)
    if (width < 15 || height < 15) return;

    const computedStyle = window.getComputedStyle(element);
    const borderRadiusStyle = computedStyle.borderRadius || '22px';
    const borderRadius = parseInt(borderRadiusStyle, 10) || 22;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(30, width);
    canvas.height = Math.max(30, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    const rx = borderRadius;
    const ry = borderRadius;
    const wHalf = canvas.width / 2;
    const hHalf = canvas.height / 2;
    const innerW = Math.max(0, wHalf - rx);
    const innerH = Math.max(0, hHalf - ry);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;

        const dx = Math.max(0, Math.abs(x - wHalf) - innerW);
        const dy = Math.max(0, Math.abs(y - hHalf) - innerH);
        const cornerDist = Math.sqrt(dx * dx + dy * dy);

        let sdf;
        let nx = 0;
        let ny = 0;

        if (dx > 0 || dy > 0) {
          sdf = rx - cornerDist;
          if (cornerDist > 0) {
            nx = (x > wHalf ? 1 : -1) * (dx / cornerDist);
            ny = (y > hHalf ? 1 : -1) * (dy / cornerDist);
          }
        } else {
          const distToX = innerW - Math.abs(x - wHalf);
          const distToY = innerH - Math.abs(y - hHalf);
          sdf = rx + Math.min(distToX, distToY);

          nx = (x - wHalf) / wHalf * 0.15;
          ny = (y - hHalf) / hHalf * 0.15;
        }

        let refractionStrength = 0;
        const edgeWidth = 14;
        if (sdf < edgeWidth && sdf > 0) {
          const t = 1 - (sdf / edgeWidth);
          refractionStrength = Math.sin(t * Math.PI * 0.5);
        }

        const rVal = Math.max(0, Math.min(255, Math.round(128 + nx * refractionStrength * 120)));
        const gVal = Math.max(0, Math.min(255, Math.round(128 + ny * refractionStrength * 120)));

        data[i]     = rVal;
        data[i + 1] = gVal;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    const filterId = `liquid-glass-filter-${index}`;
    const svgNS = 'http://www.w3.org/2000/svg';

    let svgContainer = document.getElementById('svg-liquid-filters');
    if (!svgContainer) {
      svgContainer = document.createElementNS(svgNS, 'svg');
      svgContainer.id = 'svg-liquid-filters';
      svgContainer.style.position = 'absolute';
      svgContainer.style.width = '0';
      svgContainer.style.height = '0';
      svgContainer.style.overflow = 'hidden';
      svgContainer.style.pointerEvents = 'none';
      document.body.appendChild(svgContainer);
    }

    const existingFilter = document.getElementById(filterId);
    if (existingFilter) existingFilter.remove();

    const filter = document.createElementNS(svgNS, 'filter');
    filter.id = filterId;
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '120%');
    filter.setAttribute('height', '120%');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');

    filter.innerHTML = `
      <feImage href="${dataUrl}" result="map" width="${canvas.width}" height="${canvas.height}" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
      <feGaussianBlur in="displaced" stdDeviation="0.3" result="blurred" />
      <feColorMatrix in="blurred" type="saturate" values="1.3" />
    `;

    svgContainer.appendChild(filter);

    const filterStyle = `url(#${filterId}) blur(0.3px) saturate(1.3)`;
    element.style.backdropFilter = filterStyle;
    element.style.webkitBackdropFilter = filterStyle;
  } catch (_) {
    // Graceful fallback to pure blur + saturate
    try {
      element.style.backdropFilter = 'blur(16px) saturate(1.4)';
      element.style.webkitBackdropFilter = 'blur(16px) saturate(1.4)';
    } catch (_) {}
  }
}

function initLiquidGlass() {
  try {
    const liquidElements = document.querySelectorAll('[data-liquid]');
    liquidElements.forEach((el, index) => {
      generateLiquidGlassFilter(el, index);
    });
  } catch (_) {}
}
window.initLiquidGlass = initLiquidGlass;

function setupTdLogin() {
  const loginForm = document.getElementById('td-login-form');
  const btnSignin = document.getElementById('btn-signin');
  const btnLogout = document.getElementById('btn-logout');
  const btnBackLogin = document.getElementById('btn-back-login');

  if (loginForm) {
    loginForm.addEventListener('submit', window.handleDirectLogin);
  }

  if (btnSignin) {
    btnSignin.addEventListener('click', window.handleDirectLogin);
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', window.handleBackToLogin);
  }

  const btnGuestLogin = document.getElementById('btn-guest-login');
  if (btnGuestLogin) {
    btnGuestLogin.addEventListener('click', window.handleGuestLogin);
  }
}

function setupInteractions() {
  const buttons = document.querySelectorAll('.glass');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
    });
  });

  const menuBtn = document.querySelector('.td-menu-btn');
  const btnTopInstall = document.getElementById('btn-top-install');

  if (menuBtn) {
    menuBtn.addEventListener('click', window.triggerDirectInstall);
  }

  if (btnTopInstall) {
    btnTopInstall.addEventListener('click', window.triggerDirectInstall);
  }

  const shuffleBtn = document.querySelector('.btn-shuffle');
  if (shuffleBtn) {
    const drinks = [
      { name: 'Latte', badge: 'Favorite', count: 'Ordered 73 times' },
      { name: 'Plum Parfait Latte', badge: 'Signature', count: 'Ordered 48 times' },
      { name: 'Iced Americano', badge: 'Daily Fix', count: 'Ordered 62 times' }
    ];
    let currentIndex = 0;

    shuffleBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % drinks.length;
      const drink = drinks[currentIndex];
      const favoriteCard = document.querySelector('.favorite-card');
      const titleEl = favoriteCard?.querySelector('.favorite-title');
      const badgeEl = favoriteCard?.querySelector('.favorite-badge');
      const countEl = favoriteCard?.querySelector('.favorite-count');

      if (favoriteCard && titleEl && badgeEl && countEl) {
        favoriteCard.style.opacity = '0.5';
        favoriteCard.style.transition = 'opacity 0.15s ease';
        setTimeout(() => {
          titleEl.textContent = drink.name;
          badgeEl.textContent = drink.badge;
          countEl.textContent = drink.count;
          favoriteCard.style.opacity = '1';
        }, 150);
      }
    });
  }

  const btnTopAction = document.getElementById('btn-top-action');
  if (btnTopAction) {
    btnTopAction.addEventListener('click', window.handleTopAction);
  }

  const formEditUsername = document.getElementById('form-edit-username');
  if (formEditUsername) {
    formEditUsername.addEventListener('submit', window.saveUsername);
  }

  const formFirstLogin = document.getElementById('form-first-login');
  if (formFirstLogin) {
    formFirstLogin.addEventListener('submit', window.saveFirstLoginUsername);
  }

  const modalEditEl = document.getElementById('modal-edit-username');
  if (modalEditEl) {
    modalEditEl.addEventListener('click', (e) => {
      if (e.target === modalEditEl) {
        window.closeEditUsernameModal();
      }
    });
  }

  const modalFirstEl = document.getElementById('modal-first-login');
  if (modalFirstEl) {
    modalFirstEl.addEventListener('click', (e) => {
      if (e.target === modalFirstEl) {
        window.closeFirstLoginModal();
      }
    });
  }

  // Live 10-letter character counter handler
  const bindCharCounter = (inputId, counterId) => {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;

    const updateCounter = () => {
      const len = input.value.length;
      counter.textContent = `${len}/10`;
      counter.classList.toggle('limit', len >= 10);
    };

    input.addEventListener('input', updateCounter);
    input.addEventListener('keyup', updateCounter);
  };

  bindCharCounter('input-edit-username', 'edit-username-counter');
  bindCharCounter('input-first-username', 'first-username-counter');

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeEditUsernameModal();
      window.closeFirstLoginModal();
    }
  });
}

function initDynamicBackground() {
  const canvas = document.getElementById('login-ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Video autoplay assurance on mobile devices
  const loginVideo = document.querySelector('.login-video');
  if (loginVideo) {
    loginVideo.muted = true;
    const attemptPlay = () => {
      loginVideo.play().catch(() => {});
    };
    attemptPlay();
    window.addEventListener('touchstart', attemptPlay, { once: true, passive: true });
    window.addEventListener('click', attemptPlay, { once: true });
  }

  let width = 0;
  let height = 0;
  let lastWidth = window.innerWidth;

  function resize() {
    // Use maximum viewport height to guarantee full coverage even when keyboard is open
    const currentW = Math.max(320, Math.round(window.innerWidth));
    const currentH = Math.max(600, Math.round(window.innerHeight), height);
    width = canvas.width = currentW;
    height = canvas.height = currentH;
  }
  resize();

  window.addEventListener('resize', () => {
    // Only re-initialize canvas on actual screen orientation change (width change)
    // Prevents canvas clearing and visual flickering when mobile keyboard appears/disappears
    if (Math.abs(window.innerWidth - lastWidth) > 30) {
      lastWidth = window.innerWidth;
      resize();
    }
  });

  // Vibrant warm amber, golden crema, roasted mocha & ruby light blooms
  const blooms = [
    { x: 0.35, y: 0.20, r: 0.58, color: [245, 125, 25], speedX: 0.65, speedY: 0.45 },
    { x: 0.72, y: 0.38, r: 0.64, color: [200, 75, 15], speedX: 0.50, speedY: 0.60 },
    { x: 0.48, y: 0.78, r: 0.55, color: [255, 155, 45], speedX: 0.75, speedY: 0.55 },
    { x: 0.18, y: 0.82, r: 0.48, color: [175, 55, 12], speedX: 0.40, speedY: 0.70 }
  ];

  // Floating golden crema steam motes
  const particleCount = 28;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.4 + Math.random() * 2.4,
      speedY: 0.35 + Math.random() * 0.75,
      swaySpeed: 0.015 + Math.random() * 0.02,
      swayAmp: 12 + Math.random() * 18,
      seed: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.5,
      hue: Math.random() > 0.35 ? 'crema' : 'gold'
    });
  }

  // Interactive subtle touch / cursor point
  let pointer = { x: width * 0.5, y: height * 0.3, active: false };
  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });

  let t = 0;
  function animate() {
    t += 0.015;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw drifting ambient warm light blooms
    for (let i = 0; i < blooms.length; i++) {
      const b = blooms[i];
      const cx = (b.x + Math.sin(t * b.speedX + i * 1.8) * 0.14) * width;
      const cy = (b.y + Math.cos(t * b.speedY + i * 1.4) * 0.14) * height;
      const radius = b.r * Math.max(width, height);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const [r, g, bVal] = b.color;
      grad.addColorStop(0, `rgba(${r}, ${g}, ${bVal}, 0.38)`);
      grad.addColorStop(0.44, `rgba(${r}, ${g}, ${bVal}, 0.16)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Interactive touch glow
    if (pointer.active) {
      const touchGrad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180);
      touchGrad.addColorStop(0, 'rgba(245, 140, 45, 0.30)');
      touchGrad.addColorStop(0.5, 'rgba(245, 140, 45, 0.08)');
      touchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = touchGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Floating rising crema embers & steam motes
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.speedY;
      const sway = Math.sin(t + p.seed) * p.swayAmp;
      const px = p.x + sway;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(px, p.y, p.size, 0, Math.PI * 2);
      if (p.hue === 'crema') {
        ctx.fillStyle = `rgba(245, 185, 95, ${p.opacity * (0.7 + 0.3 * Math.sin(t * 2 + p.seed))})`;
      } else {
        ctx.fillStyle = `rgba(255, 215, 140, ${p.opacity * (0.7 + 0.3 * Math.cos(t * 2 + p.seed))})`;
      }
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }
  animate();
}

// Register Service Worker for PWA / WebAPK support with Live Over-The-Air Server Updates
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully:', reg.scope);
          setInterval(() => {
            reg.update().catch(() => {});
          }, 30000);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
    console.log('[PWA] WebAPK install prompt ready');
  });
}

// Bulletproof execution order: Login & navigation attached first, visual enhancements follow
function initializeApp() {
  setupTdLogin();
  setupInteractions();
  try { window.updateTopBarState(); } catch (_) {}
  try { initDynamicBackground(); } catch (_) {}
  try { initLiquidGlass(); } catch (_) {}
  try { registerServiceWorker(); } catch (_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

let orientationTimer;
let lastOrientWidth = window.innerWidth;
window.addEventListener('resize', () => {
  // Only recalculate liquid glass on device rotation, not during virtual keyboard typing
  if (Math.abs(window.innerWidth - lastOrientWidth) > 30) {
    lastOrientWidth = window.innerWidth;
    clearTimeout(orientationTimer);
    orientationTimer = setTimeout(() => {
      try { initLiquidGlass(); } catch (_) {}
    }, 200);
  }
});

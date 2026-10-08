/**
 * Cabix Dual-Portal Application - Main JavaScript
 * Includes SDF Liquid Glass Refraction Generator and Dual-Portal Router (/ vs /console)
 */

import { CabixConsoleApp } from './console/consoleApp.js';
import { cabixDB } from './services/db.js';

// State tracking via Cabix Database Engine
function getActiveUser() {
  return cabixDB.getCurrentUser();
}

/**
 * RENDER CABIX CLIENT PORTAL (MODULE 3 & 4)
 * Dynamically updates facility info, building lifts, active inquiry tickets, and engineering services
 */
export function renderClientPortal() {
  const user = getActiveUser();
  const isGuest = cabixDB.isGuest();

  // 1. Update User Display Name in Reference Hero Section
  const heroUserNameEl = document.getElementById('hero-user-name');
  if (heroUserNameEl) {
    heroUserNameEl.textContent = isGuest ? 'Guest' : (user.displayName || 'Abin');
  }

  // 2. Dynamic Role Pill (ADMINISTRATIVE ROLE / PENDING APPROVAL / VERIFIED CLIENT)
  const heroRoleBadge = document.getElementById('hero-role-badge');
  const heroRoleText = document.getElementById('hero-role-text');
  const isApproved = Boolean(user.isApproved || user.role === 'admin' || user.role === 'god_admin');

  if (heroRoleBadge && heroRoleText) {
    if (user.role === 'admin' || user.role === 'god_admin') {
      heroRoleBadge.className = 'admin-role-badge';
      heroRoleText.textContent = 'ADMINISTRATIVE ROLE';
    } else if (isApproved) {
      heroRoleBadge.className = 'admin-role-badge';
      heroRoleText.textContent = 'VERIFIED CLIENT';
    } else if (isGuest) {
      heroRoleBadge.className = 'admin-role-badge guest';
      heroRoleText.textContent = 'GUEST PREVIEW';
    } else {
      heroRoleBadge.className = 'admin-role-badge pending';
      heroRoleText.textContent = 'PENDING APPROVAL';
    }
  }

  // 3. Anti-Spam Access Approval Barrier & Unlocked Content Gating
  const heroRequestContainer = document.getElementById('hero-request-container');
  const approvedWrapper = document.getElementById('approved-content-wrapper');
  const btnRequestAccess = document.getElementById('btn-request-access');
  const btnRequestLabel = document.getElementById('btn-request-access-label');

  if (isApproved) {
    // Approved: Hide access barrier, reveal works, action pills & live chat
    if (heroRequestContainer) heroRequestContainer.style.display = 'none';
    if (approvedWrapper) {
      approvedWrapper.classList.remove('hidden');
      approvedWrapper.style.display = 'block';
    }
  } else {
    // Unapproved: Show access barrier at bottom of hero to reduce spam users
    if (heroRequestContainer) heroRequestContainer.style.display = 'flex';
    if (approvedWrapper) {
      approvedWrapper.classList.add('hidden');
      approvedWrapper.style.display = 'none';
    }

    if (btnRequestAccess && btnRequestLabel) {
      if (user.accessRequested) {
        btnRequestAccess.classList.add('requested');
        btnRequestLabel.textContent = 'Request Sent — Awaiting Review';
      } else {
        btnRequestAccess.classList.remove('requested');
        btnRequestLabel.textContent = isGuest ? 'Sign In to Request Access' : 'Request Access Approval';
      }
    }
  }

  // 4. Update Reference Works Stats Grid (154 works, 36 inspections, 12 lifts)
  const statsWorksCount = document.getElementById('stats-works-count');
  const statsInspectionsCount = document.getElementById('stats-inspections-count');
  const statsLiftsCount = document.getElementById('stats-lifts-count');
  if (statsWorksCount) statsWorksCount.textContent = '154';
  if (statsInspectionsCount) statsInspectionsCount.textContent = '36';
  if (statsLiftsCount) statsLiftsCount.textContent = String(cabixDB.getLifts().length || 12);

  // 5. Inquiries & Requests List
  const requestsContainer = document.getElementById('client-requests-container');
  const requestsCountEl = document.getElementById('client-requests-count');

  if (requestsContainer) {
    if (isGuest) {
      if (requestsCountEl) requestsCountEl.textContent = 'Sign In';
      requestsContainer.innerHTML = `
        <div class="inquiry-guest-notice">
          <p>You are viewing Cabix in <strong>Guest Mode</strong>. Sign in to submit maintenance requests, receive live engineer updates, and access QR lifecycle inspections.</p>
          <button type="button" class="glass modal-btn-save" style="margin: 0 auto; max-width: 200px;" onclick="window.handleOpenGuestPrompt && window.handleOpenGuestPrompt();">
            Sign In to Connect
          </button>
        </div>
      `;
    } else {
      const myRequests = cabixDB.getMaintenanceRequests();
      if (requestsCountEl) {
        requestsCountEl.textContent = `${myRequests.length} Active`;
      }

      if (myRequests.length === 0) {
        requestsContainer.innerHTML = `
          <div class="inquiry-guest-notice">
            <p>No open maintenance requests recorded for your account. All elevator units are operating smoothly.</p>
            <button type="button" class="glass modal-btn-save" style="margin: 0 auto; max-width: 220px;" onclick="window.handleOpenRequestModal && window.handleOpenRequestModal();">
              Report New Issue
            </button>
          </div>
        `;
      } else {
        requestsContainer.innerHTML = myRequests.map(req => {
          const lift = req.liftId ? cabixDB.getLiftById(req.liftId) : null;
          const liftCode = lift ? lift.unitCode : 'General Lift';
          const isUrgent = req.priority === 'urgent' || req.priority === 'emergency';
          
          let statusLabel = 'Pending';
          if (req.status === 'in_review') statusLabel = 'In Review';
          if (req.status === 'dispatched') statusLabel = 'Tech Dispatched';
          if (req.status === 'resolved') statusLabel = 'Resolved';

          const formattedDate = new Date(req.createdAt).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          return `
            <div class="inquiry-card">
              <div class="inquiry-header">
                <div>
                  <span class="inquiry-ticket-num">${req.ticketNumber}</span>
                  <span style="font-size: 11px; color: var(--muted); margin-left: 6px;">(${liftCode})</span>
                </div>
                <span class="inquiry-status-pill ${req.status}">${statusLabel}</span>
              </div>
              <div class="inquiry-body">
                ${req.description || 'Elevator maintenance inquiry submitted.'}
              </div>
              <div class="inquiry-meta-row">
                <span>Priority: <strong style="color: ${isUrgent ? '#ff4d4d' : '#ede4d8'}">${req.priority.toUpperCase()}</strong></span>
                <span>${formattedDate}</span>
              </div>
              ${req.adminNotes ? `
                <div class="inquiry-admin-note">
                  <strong>Technician Dispatch Note:</strong> ${req.adminNotes}
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }
  }

  // 6. Admin Live Chat Messages Feed (Zero Emojis, Pure SVGs)
  renderLiveChatFeed(user);
}
window.renderClientPortal = renderClientPortal;

/**
 * Render Live Chat Messages Feed
 */
function renderLiveChatFeed(user) {
  const feed = document.getElementById('chat-messages-feed');
  if (!feed) return;

  const messages = cabixDB.getChatMessages();
  if (!messages || messages.length === 0) {
    feed.innerHTML = `
      <div style="text-align: center; font-size: 11.5px; color: var(--muted); padding: 18px 0;">
        Direct technician channel ready. Send a message to start live dispatch.
      </div>
    `;
    return;
  }

  feed.innerHTML = messages.map(msg => {
    const isSentByMe = user && msg.senderId === user.id;
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isTech = msg.senderRole === 'admin' || msg.senderRole === 'god_admin';

    return `
      <div class="chat-msg-row ${isSentByMe ? 'sent' : 'received'}">
        <div class="chat-msg-author">
          <span>${msg.senderName || (isTech ? 'Technician Lead' : 'Client')}</span>
          ${isTech ? '<span style="font-size: 9px; padding: 2px 5px; border-radius: 4px; background: rgba(245,158,11,0.25); color: #f5c285; font-weight: 700;">STAFF</span>' : ''}
        </div>
        <div class="chat-bubble">
          ${msg.text}
          <span class="chat-bubble-time">${time}</span>
        </div>
      </div>
    `;
  }).join('');

  feed.scrollTop = feed.scrollHeight;
}

// ============================================================================
// QUESTION FORM MODAL CONTROLLER (MODULE 3)
// ============================================================================

window.handleOpenRequestModal = function(liftId, defaultCategory) {
  if (cabixDB.isGuest()) {
    window.handleOpenGuestPrompt();
    return;
  }

  const modal = document.getElementById('modal-question-form');
  const selectLift = document.getElementById('q-input-lift');
  const descInput = document.getElementById('q-input-desc');

  if (selectLift) {
    const lifts = cabixDB.getLifts();
    selectLift.innerHTML = lifts.map(l => `
      <option value="${l.id}" ${l.id === liftId ? 'selected' : ''}>
        ${l.unitCode} (${l.buildingName} - ${l.modelType})
      </option>
    `).join('') + `<option value="">General Building Elevator / Other</option>`;
  }

  if (defaultCategory) {
    const radio = document.querySelector(`input[name="q-category"][value="${defaultCategory}"]`);
    if (radio) radio.checked = true;
  }

  if (descInput && !descInput.value) {
    descInput.value = '';
  }

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
};

window.closeQuestionModal = function() {
  const modal = document.getElementById('modal-question-form');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

window.handleSubmitQuestionForm = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const selectLift = document.getElementById('q-input-lift');
  const categoryRadio = document.querySelector('input[name="q-category"]:checked');
  const locRadio = document.querySelector('input[name="q-loc"]:checked');
  const frequencySelect = document.getElementById('q-input-frequency');
  const impactSelect = document.getElementById('q-input-impact');
  const urgentCheck = document.getElementById('q-input-urgent');
  const descInput = document.getElementById('q-input-desc');

  const liftId = selectLift ? selectLift.value : null;
  const issueCategory = categoryRadio ? categoryRadio.value : 'abnormal_noise';
  const locationInLift = locRadio ? locRadio.value : 'Cabin Interior';
  const timeOfDayObserved = frequencySelect ? frequencySelect.value : 'Continuous';
  const impactOnRide = impactSelect ? impactSelect.value : 'Smooth, but noise concerns passengers';
  const isUrgent = urgentCheck ? urgentCheck.checked : false;
  const description = descInput ? descInput.value.trim() : '';

  const res = cabixDB.createMaintenanceRequest({
    liftId,
    issueCategory,
    priority: isUrgent ? 'urgent' : 'normal',
    description: description || `Reported ${issueCategory.replace(/_/g, ' ')} issue via client mobile portal.`,
    questionnaireAnswers: {
      locationInLift,
      timeOfDayObserved,
      impactOnRide,
      urgentEscalationRequested: isUrgent
    }
  });

  if (res.success) {
    if (navigator.vibrate) {
      try { navigator.vibrate([30, 60, 30]); } catch (_) {}
    }

    window.closeQuestionModal();
    renderClientPortal();

    alert(`✓ Maintenance Request Dispatched!\n\nTicket: ${res.request.ticketNumber}\nStatus: PENDING REVIEW\nOur certified technicians have been notified.`);
    
    // Clear description
    if (descInput) descInput.value = '';
  } else {
    alert(`Could not submit request: ${res.error || 'Unknown error'}`);
  }

  return false;
};

window.handleServiceInquire = function(serviceId, serviceCategory) {
  if (cabixDB.isGuest()) {
    window.handleOpenGuestPrompt();
    return;
  }

  window.handleOpenRequestModal(null, 'routine_maintenance');
  const descInput = document.getElementById('q-input-desc');
  if (descInput) {
    descInput.value = `Client inquiry regarding: ${serviceCategory}. Please arrange an engineering consultation.`;
  }
};

// ============================================================================
// GUEST PROMPT MODAL CONTROLLER (MODULE 4)
// ============================================================================

window.handleOpenGuestPrompt = function() {
  const modal = document.getElementById('modal-guest-prompt');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
};

window.closeGuestPromptModal = function() {
  const modal = document.getElementById('modal-guest-prompt');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

window.handleQuickDemoClientLogin = function() {
  cabixDB.login('user@cabix.app', 'user123');
  window.closeGuestPromptModal();

  const emailInput = document.getElementById('td-email');
  const passInput = document.getElementById('td-password');
  if (emailInput) emailInput.value = 'user@cabix.app';
  if (passInput) passInput.value = 'user123';

  renderClientPortal();

  if (navigator.vibrate) {
    try { navigator.vibrate([20, 40]); } catch (_) {}
  }
};

// ============================================================================
// AUTHENTICATION HANDLERS
// ============================================================================

window.handleDirectLogin = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const viewLogin = document.getElementById('view-login');
  const viewProfile = document.getElementById('view-profile');
  const feedbackEl = document.getElementById('login-feedback');
  const emailInput = document.getElementById('td-email');
  const passInput = document.getElementById('td-password');

  const email = emailInput ? emailInput.value.trim() : 'user@cabix.app';
  const pass = passInput ? passInput.value.trim() : 'user123';

  const loginRes = cabixDB.login(email, pass);

  if (!loginRes.success) {
    if (feedbackEl) {
      feedbackEl.className = 'login-feedback error';
      feedbackEl.textContent = `✕ ${loginRes.error || 'Invalid credentials'}`;
    }
    if (navigator.vibrate) {
      try { navigator.vibrate([40, 40, 40]); } catch (_) {}
    }
    return false;
  }

  const user = loginRes.user;

  // If God Admin or Secondary Admin, provide clear path to Console
  if (user.role === 'god_admin' || user.role === 'admin') {
    if (feedbackEl) {
      feedbackEl.className = 'login-feedback success';
      feedbackEl.textContent = `✓ Engineering Authorization Verified (${user.role.toUpperCase()})`;
    }
    setTimeout(() => {
      window.location.hash = '#console';
      routeDualPortal();
    }, 250);
    return false;
  }

  // Client User
  if (feedbackEl) {
    feedbackEl.className = 'login-feedback success';
    feedbackEl.textContent = '✓ Client Portal Authorized';
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([20, 40, 20]); } catch (_) {}
  }

  setTimeout(() => {
    if (viewLogin) viewLogin.classList.remove('active');
    if (viewProfile) viewProfile.classList.add('active');
    const screenEl = document.querySelector('.screen');
    if (screenEl) screenEl.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (feedbackEl) feedbackEl.textContent = '';

    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
      try { heroVideo.play().catch(() => {}); } catch (_) {}
    }

    try {
      history.pushState({ screen: 'profile' }, '', '#profile');
    } catch (_) {}

    renderClientPortal();

    // If new user registered, pop up the minimal "Enter Your Name" modal immediately
    if (loginRes.isNewUser) {
      setTimeout(() => {
        window.openMinimalNameModal && window.openMinimalNameModal();
      }, 350);
    }

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

window.handleGuestLogin = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }

  const viewLogin = document.getElementById('view-login');
  const viewProfile = document.getElementById('view-profile');
  const feedbackEl = document.getElementById('login-feedback');

  cabixDB.loginAsGuest();

  if (feedbackEl) {
    feedbackEl.className = 'login-feedback success';
    feedbackEl.textContent = '✓ Guest Services Preview Activated';
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([15, 30, 15]); } catch (_) {}
  }

  setTimeout(() => {
    if (viewLogin) viewLogin.classList.remove('active');
    if (viewProfile) viewProfile.classList.add('active');
    const screenEl = document.querySelector('.screen');
    if (screenEl) screenEl.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (feedbackEl) feedbackEl.textContent = '';

    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
      try { heroVideo.play().catch(() => {}); } catch (_) {}
    }

    try {
      history.pushState({ screen: 'profile' }, '', '#profile');
    } catch (_) {}

    renderClientPortal();

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

  cabixDB.logout();

  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }

  if (viewProfile) viewProfile.classList.remove('active');
  if (viewLogin) viewLogin.classList.add('active');
  const screenEl = document.querySelector('.screen');
  if (screenEl) screenEl.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  try {
    history.pushState({ screen: 'login' }, '', '#login');
  } catch (_) {}

  return false;
};

// ============================================================================
// ACCESS APPROVAL SYSTEM (ANTI-SPAM BARRIER)
// ============================================================================

window.handleRequestAccess = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const user = getActiveUser();

  if (user.isGuest) {
    window.handleOpenGuestPrompt();
    return;
  }

  const res = cabixDB.requestUserAccess(user.id);
  if (res.success) {
    if (navigator.vibrate) {
      try { navigator.vibrate([30, 40, 30]); } catch (_) {}
    }

    const btnRequestAccess = document.getElementById('btn-request-access');
    const btnRequestLabel = document.getElementById('btn-request-access-label');
    if (btnRequestAccess) btnRequestAccess.classList.add('requested');
    if (btnRequestLabel) btnRequestLabel.textContent = 'Request Sent — Awaiting Review';

    alert('Access request submitted directly to Cabix Administrators.\n\nOnce an engineer approves your profile in the console, your access to Works, Add Work, QR Scanner, and Live Chat will automatically unlock.');
    renderClientPortal();
  }
};

// ============================================================================
// ADMIN LIVE CHAT MESSAGING CONTROLLER
// ============================================================================

window.handleSendChatMessage = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const input = document.getElementById('chat-input-text');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const res = cabixDB.sendChatMessage(text);
  if (res.success) {
    input.value = '';
    const user = getActiveUser();
    renderLiveChatFeed(user);
    if (navigator.vibrate) {
      try { navigator.vibrate(15); } catch (_) {}
    }
  }
};

window.openLiveChatModal = function() {
  const modal = document.getElementById('modal-live-chat');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const user = getActiveUser();
    renderLiveChatFeed(user);
    setTimeout(() => {
      const input = document.getElementById('chat-input-text');
      if (input) input.focus();
    }, 150);
  }
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
};

window.closeLiveChatModal = function() {
  const modal = document.getElementById('modal-live-chat');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

// ============================================================================
// MINIMAL "ENTER YOUR NAME" MODAL CONTROLLER
// ============================================================================

window.openMinimalNameModal = function() {
  const modal = document.getElementById('modal-first-login');
  const input = document.getElementById('input-first-username');
  const counter = document.getElementById('first-username-counter');
  const user = getActiveUser();

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
  if (input) {
    input.value = user && user.displayName && user.displayName !== 'Guest' ? user.displayName : '';
    if (counter) counter.textContent = `${input.value.length}/10`;
    setTimeout(() => {
      input.focus();
      input.select();
    }, 120);
  }
};

window.closeMinimalNameModal = function() {
  const modal = document.getElementById('modal-first-login');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};
window.closeFirstLoginModal = window.closeMinimalNameModal;

window.saveMinimalUsername = function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const input = document.getElementById('input-first-username');
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  const user = getActiveUser();
  cabixDB.updateUserDisplayName(user.id, name);

  const heroUserNameEl = document.getElementById('hero-user-name');
  if (heroUserNameEl) heroUserNameEl.textContent = name;

  window.closeMinimalNameModal();
  renderClientPortal();

  if (navigator.vibrate) {
    try { navigator.vibrate([20, 30]); } catch (_) {}
  }
};
window.saveFirstLoginUsername = window.saveMinimalUsername;

// ============================================================================
// CLIENT QR SCANNER MODAL CONTROLLER
// ============================================================================

window.handleOpenClientQrScanner = function() {
  const modal = document.getElementById('modal-client-qr');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
};

window.closeClientQrScanner = function() {
  const modal = document.getElementById('modal-client-qr');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

window.simulateScanUnit = function(liftId) {
  window.closeClientQrScanner();
  window.handleOpenRequestModal(liftId);
};

// ============================================================================
// SHUFFLE PRIMARY WORK ORDER
// ============================================================================

const demoWorkOrders = [
  { code: 'CBX-LIFT-101', desc: 'MRL Traction • 18 Landings Verified', img: '/assets/images/elevator_cabin.jpg' },
  { code: 'CBX-LIFT-102', desc: 'Hydraulic Freight • Pressure Test Passed', img: '/assets/images/elevator_works.jpg' },
  { code: 'CBX-LIFT-103', desc: 'Panoramic Glass • PM Scheduled in 4d', img: '/assets/images/elevator_tower.jpg' }
];
let activeWorkIndex = 0;

window.shuffleActiveWork = function() {
  activeWorkIndex = (activeWorkIndex + 1) % demoWorkOrders.length;
  const wo = demoWorkOrders[activeWorkIndex];
  const titleEl = document.getElementById('active-work-title');
  const descEl = document.getElementById('active-work-desc');
  const imgEl = document.getElementById('active-work-img');
  if (titleEl) titleEl.textContent = wo.code;
  if (descEl) descEl.textContent = wo.desc;
  if (imgEl && wo.img) imgEl.src = wo.img;

  if (navigator.vibrate) {
    try { navigator.vibrate(20); } catch (_) {}
  }
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
      alert('Install to iOS Home Screen:\n\n1. Tap the Share button at the bottom of Safari.\n2. Tap "Add to Home Screen".\n3. Tap "Add" to launch in edge-to-edge standalone mode!');
    } else {
      alert('Direct 1-Tap Web App Install:\n\n1. Tap the 3 dots menu in Chrome top right.\n2. Tap "Install app" or "Add to Home screen".\n3. Tap "Install".\n\nIt installs directly onto your phone drawer with live OTA updates!');
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
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
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

  const modalQuestionEl = document.getElementById('modal-question-form');
  if (modalQuestionEl) {
    modalQuestionEl.addEventListener('click', (e) => {
      if (e.target === modalQuestionEl) {
        window.closeQuestionModal();
      }
    });
  }

  const modalGuestEl = document.getElementById('modal-guest-prompt');
  if (modalGuestEl) {
    modalGuestEl.addEventListener('click', (e) => {
      if (e.target === modalGuestEl) {
        window.closeGuestPromptModal();
      }
    });
  }

  const modalChatEl = document.getElementById('modal-live-chat');
  if (modalChatEl) {
    modalChatEl.addEventListener('click', (e) => {
      if (e.target === modalChatEl) {
        window.closeLiveChatModal();
      }
    });
  }

  const modalQrEl = document.getElementById('modal-client-qr');
  if (modalQrEl) {
    modalQrEl.addEventListener('click', (e) => {
      if (e.target === modalQrEl) {
        window.closeClientQrScanner();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeEditUsernameModal();
      window.closeFirstLoginModal();
      window.closeQuestionModal();
      window.closeGuestPromptModal();
      window.closeLiveChatModal();
      window.closeClientQrScanner();
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

// ============================================================================
// DUAL-PORTAL ROUTER (/ vs /console)
// ============================================================================
function routeDualPortal() {
  const isConsole = window.location.pathname.startsWith('/console') || window.location.hash === '#console';
  const clientApp = document.getElementById('view-client-app');
  const consoleAppEl = document.getElementById('view-console');

  if (isConsole) {
    if (clientApp) clientApp.style.display = 'none';
    if (consoleAppEl) {
      consoleAppEl.style.display = 'block';
      if (!window.activeConsoleInstance) {
        window.activeConsoleInstance = new CabixConsoleApp(consoleAppEl);
        window.activeConsoleInstance.mount();
      } else {
        window.activeConsoleInstance.render();
      }
    }
    document.title = 'Cabix Engineering Console';
  } else {
    if (consoleAppEl) consoleAppEl.style.display = 'none';
    if (clientApp) clientApp.style.display = '';
    document.title = 'Cabix - Elevator Engineering & Maintenance';

    const user = cabixDB.getCurrentUser();
    const isProfileHash = window.location.hash === '#profile';
    const viewLogin = document.getElementById('view-login');
    const viewProfile = document.getElementById('view-profile');

    if (isProfileHash || (user && !user.isGuest && user.id)) {
      if (viewLogin) viewLogin.classList.remove('active');
      if (viewProfile) viewProfile.classList.add('active');
      const heroVideo = document.querySelector('.hero-video');
      if (heroVideo) {
        try { heroVideo.play().catch(() => {}); } catch (_) {}
      }
    }

    try { renderClientPortal(); } catch (_) {}
  }
}

window.addEventListener('popstate', routeDualPortal);
window.addEventListener('hashchange', routeDualPortal);

function setupSecretBackdoor() {
  let taps = 0;
  let timer = null;
  const brandTrigger = document.querySelector('.cafe-brand-title') || document.querySelector('.top-bar-logo') || document.querySelector('.td-header');
  if (brandTrigger) {
    brandTrigger.addEventListener('click', () => {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(() => { taps = 0; }, 1200);
      if (taps >= 3) {
        taps = 0;
        if (confirm('Enter Cabix Enterprise Engineering Console (/console)?')) {
          window.location.hash = '#console';
          routeDualPortal();
        }
      }
    });
  }
}

// Bulletproof execution order: Login & navigation attached first, visual enhancements follow
function initializeApp() {
  setupTdLogin();
  setupInteractions();
  setupSecretBackdoor();
  try { routeDualPortal(); } catch (_) {}
  try { renderClientPortal(); } catch (_) {}
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

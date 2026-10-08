/**
 * Cabix Enterprise Engineering Console Application (/console)
 * Handles God Admin Master Hub, Technician Workstation,
 * QR Code Generator & Real-Time Camera Scanner.
 */

import { cabixDB } from '../services/db.js';
import { generateQrSvg, generatePrintableQrBadge, CabixCameraScanner } from '../services/qr.js';

export class CabixConsoleApp {
  constructor(rootContainer) {
    this.root = rootContainer;
    this.currentTab = 'lifts'; // 'lifts', 'requests', 'users', 'team', 'audit'
    this.selectedLiftId = null;
    this.activeScanner = null;
    this.userFilter = 'all'; // 'all', 'clients', 'approved', 'pending', 'suspended'
    this.userSearchTerm = '';
  }

  mount() {
    this.render();
  }

  render() {
    const user = cabixDB.getCurrentUser();

    // If not authenticated as Admin or God Admin, render the high-security gate
    if (!cabixDB.isAdmin()) {
      this.renderGate();
      return;
    }

    this.renderConsole(user);
  }

  // ==========================================================================
  // 1. HIGH-SECURITY LOGIN GATE
  // ==========================================================================

  renderGate() {
    this.root.innerHTML = `
      <div class="page-container console-gate-page-container">
        <div class="phone-wrapper">
          <div class="phone-frame">
            <div class="screen">
              <div id="view-console-login" class="view-screen active">
                
                <!-- Dynamic Ambient & Video Canvas matching User UI -->
                <div class="login-bg-media">
                  <video class="login-video console-gate-video" autoplay loop muted playsinline>
                    <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260707_003042_3d2380a6-1ce6-4407-a2e2-cfec46546407.mp4" type="video/mp4">
                  </video>
                  <div class="login-bg-overlay"></div>
                </div>

                <!-- Top Navigation Header -->
                <div class="td-header">
                  <button type="button" class="glass circle td-menu-btn" data-liquid id="btn-console-gate-back" aria-label="Return to App" title="Return to Customer App">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </button>

                  <div class="td-header-right">
                    <div class="glass circle btn-install-top" data-liquid title="Console Port Security Gateway" style="cursor: default;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Cabix Brand Header -->
                <div class="cafe-brand-header">
                  <h2 class="cafe-brand-title">Cabix</h2>
                  <p class="cafe-brand-subtitle">Engineering Console &bull; Security Gateway</p>
                </div>

                <!-- Console Login Form -->
                <form id="console-login-form" class="td-form" autocomplete="on" novalidate>
                  
                  <!-- Administrative Email Field -->
                  <div class="td-input-group">
                    <div class="icon-col">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <div class="input-col">
                      <label for="console-email" class="td-label">Administrative Email</label>
                      <input type="email" id="console-email" class="td-input" value="god@cabix.app" inputmode="email" autocomplete="email" required />
                    </div>
                  </div>

                  <!-- Master Password / PIN Field -->
                  <div class="td-input-group">
                    <div class="icon-col">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <div class="input-col">
                      <label for="console-password" class="td-label">Master Password / PIN</label>
                      <input type="password" id="console-password" class="td-input" value="god1234" autocomplete="current-password" required />
                    </div>
                  </div>

                  <!-- Credentials Quick Hint -->
                  <div class="creds-hint-pill" style="display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 10px 14px;">
                    <div>
                      <span>God Admin: <code style="cursor: pointer;" title="Click to fill" id="fill-god">god@cabix.app / god1234</code></span>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.07); padding-top: 5px;">
                      <span>Technician Lead: <code style="cursor: pointer;" title="Click to fill" id="fill-admin">admin@cabix.app / admin123</code></span>
                    </div>
                  </div>

                  <!-- Feedback message -->
                  <div id="console-login-feedback" class="login-feedback"></div>

                  <!-- Bottom Form Actions -->
                  <div class="td-form-actions">
                    <button type="submit" id="btn-console-signin" class="td-signin-btn glass" data-liquid>
                      <span>Authenticate & Enter Console</span>
                    </button>

                    <a href="#" class="td-forgot-link" id="link-console-return-app">&larr; Return to Customer App</a>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Video playback
    const video = this.root.querySelector('.console-gate-video');
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }

    // Return to Customer App handler
    const returnHome = (e) => {
      if (e) e.preventDefault();
      window.location.hash = '';
      if (window.location.pathname.startsWith('/console')) {
        history.pushState(null, '', '/');
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    this.root.querySelector('#btn-console-gate-back')?.addEventListener('click', returnHome);
    this.root.querySelector('#link-console-return-app')?.addEventListener('click', returnHome);

    // Bind login form
    const form = this.root.querySelector('#console-login-form');
    const feedback = this.root.querySelector('#console-login-feedback');
    const emailInput = this.root.querySelector('#console-email');
    const passwordInput = this.root.querySelector('#console-password');

    this.root.querySelector('#fill-god')?.addEventListener('click', () => {
      emailInput.value = 'god@cabix.app';
      passwordInput.value = 'god1234';
    });

    this.root.querySelector('#fill-admin')?.addEventListener('click', () => {
      emailInput.value = 'admin@cabix.app';
      passwordInput.value = 'admin123';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedback.textContent = '';
      const res = cabixDB.login(emailInput.value, passwordInput.value);
      if (!res.success) {
        feedback.textContent = res.error;
        return;
      }
      if (res.user.role !== 'god_admin' && res.user.role !== 'admin') {
        feedback.textContent = 'Access Denied: Administrative credentials required for /console.';
        cabixDB.logout();
        return;
      }
      this.render();
    });
  }

  // ==========================================================================
  // 2. MAIN CONSOLE ENVIRONMENT
  // ==========================================================================

  renderConsole(user) {
    const isGod = user.role === 'god_admin';
    const allProfiles = cabixDB.getAllProfiles();
    const openRequestsCount = cabixDB.getMaintenanceRequests().filter(r => r.status !== 'resolved').length;
    const clientUsersCount = allProfiles.filter(p => p.role === 'user').length;
    const pendingApprovalCount = allProfiles.filter(p => p.role === 'user' && !p.isApproved).length;
    const adminCount = cabixDB.getAdmins().length;
    const lifts = cabixDB.getLifts();
    const liftsCount = lifts.length;
    const componentsCount = lifts.reduce((acc, l) => acc + cabixDB.getComponentsForLift(l.id).length, 0);

    this.root.innerHTML = `
      <div class="console-container">
        
        <!-- 1. PROFESSIONAL COMMAND HEADER (FIXED TOPBAR) -->
        <header class="console-header">
          <div class="console-brand-left">
            <h1 class="console-title-text">
              Cabix
              <span class="console-telemetry-pill" title="Telemetry Online">
                <span class="telemetry-dot"></span>
                <span class="telemetry-text">ONLINE</span>
              </span>
            </h1>
          </div>

          <div class="console-header-actions">
            <!-- COMBINED BUTTONS (FROM HEADER & HERO) -->
            <!-- 1. Edit Name Circle Button (combined from hero) -->
            <button type="button" class="glass circle console-header-circle-btn" id="btn-console-edit-name" data-liquid aria-label="Edit Name" title="Edit Admin Display Name">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>

            <!-- 2. Scan Lift QR Pill Button -->
            <button type="button" class="glass console-header-btn btn-scan" id="btn-trigger-scanner" data-liquid title="Scan Lift QR Code">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <circle cx="17.5" cy="17.5" r="2.5"></circle>
              </svg>
              <span>Scan Lift QR</span>
            </button>

            <!-- 3. Customer App Pill Button (combined with home circle) -->
            <button type="button" class="glass console-header-btn" id="btn-console-exit" data-liquid title="Return to Customer App">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Customer App</span>
            </button>

            <!-- 4. Lock / Exit Button (combined with close circle) -->
            <button type="button" class="glass console-header-btn btn-danger-lock" id="btn-console-logout" data-liquid title="Lock Console">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ede4d8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Lock / Exit</span>
            </button>
          </div>
        </header>

        <!-- 2. HERO SECTION (Executive Cinematic Canvas without duplicate floating buttons) -->
        <section class="console-hero-section">
          <video class="console-hero-video" autoplay loop muted playsinline>
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260707_003042_3d2380a6-1ce6-4407-a2e2-cfec46546407.mp4" type="video/mp4">
          </video>
          <div class="console-hero-overlay"></div>
        </section>

        <!-- 3. IDENTITY SECTION MATCHING USER UI LAURELS -->
        <section class="console-identity-section">
          <div class="console-role-badge ${isGod ? 'god' : 'admin'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${isGod ? `
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              ` : `
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              `}
            </svg>
            <span>${isGod ? 'GOD ADMINISTRATOR • ROOT COMMAND' : 'TECHNICIAN LEAD • FIELD OPERATIONS'}</span>
          </div>

          <div class="console-name-container">
            <img class="console-laurel" src="/assets/images/laurel-left.png" alt="Left laurel branch" />
            <h1 class="console-user-name">${user.displayName || (isGod ? 'GodDirector' : 'TechLead')}</h1>
            <img class="console-laurel" src="/assets/images/laurel-right.png" alt="Right laurel branch" />
          </div>

          <p class="console-user-subtitle">Grand Horizon Tower &bull; Enterprise Lift Lifecycle Management</p>
        </section>

        <!-- 4. DOWN ACTION BUTTONS (User Requests Window, User Management, Admin Management) -->
        <section class="console-actions-row">
          
          <!-- Button A: User Requests Window -->
          <button type="button" class="glass console-action-pill-btn" id="btn-action-requests" data-liquid>
            <div class="action-pill-icon-box glass">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div class="action-pill-text-col">
              <div class="action-pill-title">
                <span>User Requests Window</span>
                <span class="action-badge-counter">${openRequestsCount} Open</span>
              </div>
              <span class="action-pill-sub">Maintenance inquiries & dispatch</span>
            </div>
          </button>

          <!-- Button B: User Management -->
          <button type="button" class="glass console-action-pill-btn" id="btn-action-users" data-liquid>
            <div class="action-pill-icon-box glass">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="action-pill-text-col">
              <div class="action-pill-title">
                <span>User Management</span>
                <span class="action-badge-counter ${pendingApprovalCount > 0 ? '' : 'green'}">
                  ${pendingApprovalCount > 0 ? `${pendingApprovalCount} Pending` : `${clientUsersCount} Users`}
                </span>
              </div>
              <span class="action-pill-sub">Client approvals & directories</span>
            </div>
          </button>

          <!-- Button C: Admin Management (God Admin Only) -->
          ${isGod ? `
            <button type="button" class="glass console-action-pill-btn" id="btn-action-admins" data-liquid>
              <div class="action-pill-icon-box glass">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <circle cx="12" cy="11" r="3"></circle>
                </svg>
              </div>
              <div class="action-pill-text-col">
                <div class="action-pill-title">
                  <span>Admin Management</span>
                  <span class="action-badge-counter">${adminCount} Admins</span>
                </div>
                <span class="action-pill-sub">Manage technicians & roles</span>
              </div>
            </button>
          ` : ''}

          <!-- Button D: Scan Lift QR -->
          <button type="button" class="glass console-action-pill-btn" id="btn-action-scan" data-liquid>
            <div class="action-pill-icon-box glass">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <circle cx="17.5" cy="17.5" r="2.5"></circle>
              </svg>
            </div>
            <div class="action-pill-text-col">
              <div class="action-pill-title">
                <span>Scan Lift QR</span>
                <span class="action-badge-counter green">Optical</span>
              </div>
              <span class="action-pill-sub">Instant field camera scan</span>
            </div>
          </button>

          <!-- Button E: Register New Lift (God Admin Only) -->
          ${isGod ? `
            <button type="button" class="glass console-action-pill-btn" id="btn-action-add-lift" data-liquid>
              <div class="action-pill-icon-box glass">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <div class="action-pill-text-col">
                <div class="action-pill-title">
                  <span>+ Register New Lift</span>
                  <span class="action-badge-counter">${liftsCount} Lifts</span>
                </div>
                <span class="action-pill-sub">Provision new hoistway unit</span>
              </div>
            </button>
          ` : ''}

        </section>

        <!-- 5. REAL-TIME STATS TELEMETRY GRID -->
        <section class="console-stats-grid">
          <div class="console-stat-card glass" data-liquid>
            <div class="console-stat-icon-wrap glass">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                <line x1="12" y1="6" x2="12.01" y2="6"></line>
                <line x1="12" y1="12" x2="12.01" y2="12"></line>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <div class="console-stat-meta">
              <span class="console-stat-num">${liftsCount}</span>
              <span class="console-stat-lbl">Lift Units Monitored</span>
            </div>
          </div>

          <div class="console-stat-card glass" data-liquid>
            <div class="console-stat-icon-wrap glass">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="console-stat-meta">
              <span class="console-stat-num" style="color: ${openRequestsCount > 0 ? '#f59e0b' : '#ffffff'};">${openRequestsCount}</span>
              <span class="console-stat-lbl">Active Inquiries</span>
            </div>
          </div>

          <div class="console-stat-card glass" data-liquid>
            <div class="console-stat-icon-wrap glass">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <div class="console-stat-meta">
              <span class="console-stat-num">${componentsCount}</span>
              <span class="console-stat-lbl">Active Components</span>
            </div>
          </div>

          <div class="console-stat-card glass" data-liquid>
            <div class="console-stat-icon-wrap glass">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="console-stat-meta">
              <span class="console-stat-num" style="color: #4ade80;">${allProfiles.filter(p => p.role === 'user' && p.isApproved).length}</span>
              <span class="console-stat-lbl">Approved Clients</span>
            </div>
          </div>
        </section>

        <!-- 6. EXECUTIVE NAVIGATION TOGGLES -->
        <nav class="console-tabs" id="console-tabs-nav">
          <button type="button" class="glass console-tab ${this.currentTab === 'lifts' ? 'active' : ''}" data-liquid data-tab="lifts">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg>
            <span>Lifts & Machinery</span>
          </button>
          <button type="button" class="glass console-tab ${this.currentTab === 'requests' ? 'active' : ''}" data-liquid data-tab="requests">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
            <span>User Requests (${openRequestsCount})</span>
          </button>
          <button type="button" class="glass console-tab ${this.currentTab === 'users' ? 'active' : ''}" data-liquid data-tab="users">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <span>Users & Clients (${clientUsersCount})</span>
          </button>
          ${isGod ? `
            <button type="button" class="glass console-tab ${this.currentTab === 'team' ? 'active' : ''}" data-liquid data-tab="team">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Admin Team (${adminCount})</span>
            </button>
            <button type="button" class="glass console-tab ${this.currentTab === 'audit' ? 'active' : ''}" data-liquid data-tab="audit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span>Audit Trail</span>
            </button>
          ` : ''}
        </nav>

        <!-- 7. MAIN CONTENT AREA -->
        <main class="console-content" id="console-main-content">
          <!-- Dynamic panels rendered here -->
        </main>
      </div>

      <!-- Container Slots for Modals & Scanner -->
      <div id="scanner-modal-slot"></div>
      <div id="console-modals-slot"></div>
    `;

    // 1. Bind Header & Top Controls
    this.root.querySelector('#btn-trigger-scanner')?.addEventListener('click', () => {
      this.openCameraScanner();
    });

    this.root.querySelector('#btn-console-exit')?.addEventListener('click', () => {
      window.location.href = '/';
    });

    this.root.querySelector('#btn-console-logout')?.addEventListener('click', () => {
      cabixDB.logout();
      this.render();
    });

    this.root.querySelector('#btn-hero-logout')?.addEventListener('click', () => {
      cabixDB.logout();
      this.render();
    });

    this.root.querySelector('#btn-console-edit-name')?.addEventListener('click', () => {
      this.openNameEditModal(user);
    });

    // 2. Bind Down Action Buttons
    this.root.querySelector('#btn-action-requests')?.addEventListener('click', () => {
      this.currentTab = 'requests';
      this.selectedLiftId = null;
      this.render();
      setTimeout(() => {
        document.getElementById('console-tabs-nav')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    this.root.querySelector('#btn-action-users')?.addEventListener('click', () => {
      this.currentTab = 'users';
      this.selectedLiftId = null;
      this.render();
      setTimeout(() => {
        document.getElementById('console-tabs-nav')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    this.root.querySelector('#btn-action-admins')?.addEventListener('click', () => {
      this.currentTab = 'team';
      this.selectedLiftId = null;
      this.render();
      setTimeout(() => {
        document.getElementById('console-tabs-nav')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    this.root.querySelector('#btn-action-scan')?.addEventListener('click', () => {
      this.openCameraScanner();
    });

    this.root.querySelector('#btn-action-add-lift')?.addEventListener('click', () => {
      const code = prompt('Enter Lift Unit Code (e.g. CBX-LIFT-104):', `CBX-LIFT-${Math.floor(104 + Math.random() * 50)}`);
      if (!code) return;
      const bldg = prompt('Enter Building Name:', 'Metropolitan Tower B');
      if (!bldg) return;
      cabixDB.createLift({ unitCode: code, buildingName: bldg, modelType: 'Gearless Traction MRL' });
      this.currentTab = 'lifts';
      this.render();
    });

    // 3. Bind Navigation Toggles
    this.root.querySelectorAll('.console-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        this.selectedLiftId = null;
        this.render();
      });
    });

    // 4. Render Active Tab Content
    this.renderActiveTab();
    this.initLiquidInteractions();
  }

  initLiquidInteractions() {
    try {
      if (typeof window.initLiquidGlass === 'function') {
        window.initLiquidGlass();
      }
    } catch (_) {}

    this.root.querySelectorAll('.glass').forEach(btn => {
      if (!btn.dataset.liquidBound) {
        btn.dataset.liquidBound = 'true';
        btn.addEventListener('click', () => {
          btn.style.transform = 'scale(0.93)';
          setTimeout(() => {
            btn.style.transform = '';
          }, 150);
        });
      }
    });
  }

  openNameEditModal(user) {
    const slot = this.root.querySelector('#console-modals-slot');
    if (!slot) return;
    slot.innerHTML = `
      <div class="console-modal-overlay" id="modal-name-backdrop">
        <div class="console-modal-card" style="max-width: 360px; text-align: center;">
          <div style="font-weight: 700; color: #f5c285; font-size: 16px; margin-bottom: 6px;">Administrator Display Name</div>
          <p style="font-size: 12px; color: rgba(235, 220, 205, 0.6); margin: 0 0 16px;">Update the name displayed inside the command center hero section.</p>
          <form id="form-edit-admin-name">
            <input type="text" id="admin-name-input" class="console-input" value="${user.displayName || ''}" maxlength="16" required style="text-align: center; font-size: 16px; margin-bottom: 16px;" />
            <div style="display: flex; gap: 8px;">
              <button type="button" class="glass console-nav-btn" data-liquid id="btn-cancel-name-edit" style="flex: 1; justify-content: center;">Cancel</button>
              <button type="submit" class="glass console-nav-btn btn-scan" data-liquid style="flex: 1; justify-content: center;">Save Name</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.initLiquidInteractions();

    const form = slot.querySelector('#form-edit-admin-name');
    const input = slot.querySelector('#admin-name-input');
    const cancelBtn = slot.querySelector('#btn-cancel-name-edit');

    input.focus();
    input.select();

    cancelBtn.addEventListener('click', () => { slot.innerHTML = ''; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = input.value.trim();
      if (newName) {
        cabixDB.updateUserDisplayName(user.id, newName);
        slot.innerHTML = '';
        this.render();
      }
    });
  }

  renderActiveTab() {
    const content = this.root.querySelector('#console-main-content');
    if (!content) return;

    if (this.currentTab === 'lifts') {
      if (this.selectedLiftId) {
        this.renderLiftInspector(content, this.selectedLiftId);
      } else {
        this.renderLiftsList(content);
      }
    } else if (this.currentTab === 'requests') {
      this.renderRequestsQueue(content);
    } else if (this.currentTab === 'users') {
      this.renderUsersList(content);
    } else if (this.currentTab === 'team') {
      this.renderAdminTeamManager(content);
    } else if (this.currentTab === 'audit') {
      this.renderAuditLogs(content);
    }

    this.initLiquidInteractions();
  }

  // ==========================================================================
  // 3. LIFTS & COMPONENT LIFECYCLE PANELS
  // ==========================================================================

  renderLiftsList(container) {
    const lifts = cabixDB.getLifts();
    const isGod = cabixDB.isGodAdmin();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 4px;">Registered Elevator Units</h2>
          <p style="font-size: 13px; color: rgba(235, 220, 205, 0.6); margin: 0;">Select a unit to inspect components, active time periods & generate QR badges.</p>
        </div>
        ${isGod ? `
          <button type="button" class="glass console-nav-btn btn-scan" data-liquid id="btn-create-lift">
            + Register New Lift Unit
          </button>
        ` : ''}
      </div>

      <div class="lifts-grid">
        ${lifts.map(lift => `
          <div class="lift-card" data-lift-id="${lift.id}">
            <div class="lift-card-header">
              <span class="lift-unit-code">${lift.unitCode}</span>
              <span class="lift-status-badge ${lift.status}">${lift.status.replace('_', ' ')}</span>
            </div>
            <h3 class="lift-building-title">${lift.buildingName}</h3>
            <div class="lift-model-sub">${lift.modelType}</div>
            <div class="lift-meta-row">
              <span>Capacity: ${lift.capacityKg} kg (${lift.maxPersons} pers)</span>
              <span>Floors: ${lift.floorsServed}</span>
            </div>
            <div class="lift-meta-row" style="margin-top: 6px;">
              <span>Installed: ${lift.installDate}</span>
              <span style="color: #f5c285; font-weight: 600;">Inspect Components →</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Card click opens Inspector
    container.querySelectorAll('.lift-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedLiftId = card.dataset.liftId;
        this.renderActiveTab();
      });
    });

    // Create lift button (God Admin)
    container.querySelector('#btn-create-lift')?.addEventListener('click', () => {
      const code = prompt('Enter Lift Unit Code (e.g. CBX-LIFT-104):', `CBX-LIFT-${Math.floor(104 + Math.random() * 50)}`);
      if (!code) return;
      const bldg = prompt('Enter Building Name:', 'Metropolitan Tower B');
      if (!bldg) return;
      cabixDB.createLift({ unitCode: code, buildingName: bldg, modelType: 'Gearless Traction MRL' });
      this.renderActiveTab();
    });
  }

  renderLiftInspector(container, liftId) {
    const lift = cabixDB.getLiftById(liftId);
    if (!lift) {
      this.selectedLiftId = null;
      this.renderActiveTab();
      return;
    }

    const components = cabixDB.getComponentsForLift(liftId);
    const logs = cabixDB.getLiftworkLogs(liftId);

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <button type="button" class="glass console-nav-btn" data-liquid id="btn-back-to-lifts">
          ← Back to All Lift Units
        </button>
      </div>

      <!-- Inspector Header & QR Badge -->
      <div class="inspector-header">
        <div>
          <div style="font-family: monospace; font-size: 16px; font-weight: 800; color: #f5c285;">${lift.unitCode}</div>
          <h2 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 4px 0;">${lift.buildingName}</h2>
          <div style="font-size: 13px; color: rgba(235, 220, 205, 0.7);">${lift.locationAddress}</div>
          <div style="font-size: 12.5px; color: #f5c285; margin-top: 6px;">
            ${lift.modelType} • ${lift.capacityKg} kg (${lift.maxPersons} Persons) • ${lift.floorsServed} Floors
          </div>
        </div>

        <div class="inspector-qr-slot">
          <div style="background: #fff; padding: 10px; border-radius: 12px; display: inline-block;">
            ${generateQrSvg(lift.unitCode, 100, '#0e0604', '#ffffff')}
          </div>
          <div>
            <button type="button" class="glass console-nav-btn btn-scan" data-liquid id="btn-print-qr" style="margin-bottom: 8px;">
              Print QR Tag
            </button>
            <div style="font-size: 11px; color: rgba(235, 220, 205, 0.5);">QR Tag for Machine Room</div>
          </div>
        </div>
      </div>

      <!-- Components Section Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 2px;">Installed Components & Lifecycle Time Periods</h3>
          <p style="font-size: 12.5px; color: rgba(235, 220, 205, 0.6); margin: 0;">Tracking operational age, wear thresholds & replacement schedules.</p>
        </div>
        <button type="button" class="glass console-nav-btn" data-liquid id="btn-add-comp">
          + Add Component
        </button>
      </div>

      <!-- Components List -->
      <div class="components-list">
        ${components.map(comp => `
          <div class="component-item">
            <div class="comp-top-row">
              <div>
                <span class="comp-name">${comp.name}</span>
                <span style="font-size: 12px; color: rgba(235,220,205,0.5); margin-left: 8px; font-family: monospace;">${comp.serialNumber}</span>
              </div>
              <span class="comp-status-pill ${comp.lifecycleStatus}">${comp.statusLabel}</span>
            </div>

            <div class="comp-time-metrics">
              <span>Installed: <strong>${comp.installedDate}</strong></span>
              <span>Active Time: <strong>${comp.monthsElapsed} months</strong> (${comp.daysElapsed} days)</span>
              <span>Expected Lifespan: <strong>${comp.lifespanMonths} months</strong></span>
            </div>

            <div class="comp-progress-bar">
              <div class="comp-progress-fill" style="width: ${comp.progressPercent}%; background: ${comp.statusColor};"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: rgba(235, 220, 205, 0.5);">
              <span>Manufacturer: ${comp.manufacturer}</span>
              <span>Lifespan Consumed: ${comp.progressPercent}%</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Maintenance Logs Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin: 32px 0 16px; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 2px;">Liftwork Service History</h3>
          <p style="font-size: 12.5px; color: rgba(235, 220, 205, 0.6); margin: 0;">Past technician inspections, adjustments & parts replacement.</p>
        </div>
        <button type="button" class="glass console-nav-btn btn-scan" data-liquid id="btn-log-liftwork">
          + Log New Liftwork
        </button>
      </div>

      <!-- Logs Feed -->
      <div class="components-list">
        ${logs.length === 0 ? '<div style="color: rgba(235,220,205,0.5); font-size: 13px;">No liftwork logs recorded yet for this unit.</div>' : ''}
        ${logs.map(log => `
          <div class="component-item" style="border-left: 3px solid #34d399;">
            <div class="comp-top-row">
              <div>
                <strong style="color: #fff;">Inspection Date:</strong> ${new Date(log.serviceDate).toLocaleDateString()}
                <span style="margin-left: 10px; font-size: 12px; color: #f5c285;">Technician: ${log.technicianName}</span>
              </div>
              <span style="font-size: 12px; color: #34d399; font-weight: 700;">✓ Safety Test Passed</span>
            </div>
            <div style="font-size: 13px; color: #ede4d8; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; line-height: 1.5;">
              ${log.inspectionOutput}
            </div>
            <div style="font-size: 12px; color: rgba(235,220,205,0.6);">
              Time Spent: ${log.timePeriodHours} hrs
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Inspector Events
    container.querySelector('#btn-back-to-lifts')?.addEventListener('click', () => {
      this.selectedLiftId = null;
      this.renderActiveTab();
    });

    container.querySelector('#btn-print-qr')?.addEventListener('click', () => {
      const badgeHtml = generatePrintableQrBadge(lift.unitCode, lift.buildingName, lift.modelType);
      const printWin = window.open('', '_blank', 'width=600,height=600');
      if (printWin) {
        printWin.document.write(`
          <html>
            <head><title>Print QR - ${lift.unitCode}</title></head>
            <body style="display:flex; justify-content:center; align-items:center; min-height:90vh; background:#f0f0f0;">
              ${badgeHtml}
              <script>window.onload = function() { window.print(); };</script>
            </body>
          </html>
        `);
        printWin.document.close();
      }
    });

    container.querySelector('#btn-add-comp')?.addEventListener('click', () => {
      const name = prompt('Component Name (e.g. Hoist Ropes, Door Header):', 'Main Hoist Ropes');
      if (!name) return;
      const lifespan = prompt('Expected Lifespan in Months:', '36');
      cabixDB.addComponentToLift(liftId, { name, lifespanMonths: lifespan });
      this.renderLiftInspector(container, liftId);
    });

    container.querySelector('#btn-log-liftwork')?.addEventListener('click', () => {
      const output = prompt('Enter Inspection Output & Adjustments Made:', 'Brake clearance checked to 0.40mm. Guide shoe lubrication refreshed.');
      if (!output) return;
      const hours = prompt('Time Period Spent (hours):', '2.5');
      cabixDB.logLiftwork({ liftId, timePeriodHours: hours, inspectionOutput: output });
      this.renderLiftInspector(container, liftId);
    });
  }

  // ==========================================================================
  // 4. MAINTENANCE INQUIRIES QUEUE (USER QUESTION FORMS)
  // ==========================================================================

  renderRequestsQueue(container) {
    const requests = cabixDB.getMaintenanceRequests();
    const accessRequests = cabixDB.getAccessRequests();

    container.innerHTML = `
      <!-- User Access Requests Section (Anti-Spam Verification) -->
      <div style="margin-bottom: 24px; padding: 18px; border-radius: 16px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 17px; font-weight: 700; color: #f5c285; margin: 0 0 4px;">Client Access Approval Requests</h3>
            <p style="font-size: 12.5px; color: rgba(235, 220, 205, 0.65); margin: 0;">New client registrations requesting portal access verification to unlock Works & Live Chat.</p>
          </div>
          <span style="font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: rgba(245, 158, 11, 0.2); color: #f5c285;">${accessRequests.length} Pending Review</span>
        </div>

        ${accessRequests.length === 0 ? `
          <div style="font-size: 12.5px; color: rgba(235, 220, 205, 0.5); padding: 8px 0;">All client registrations are currently reviewed. No pending access requests.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${accessRequests.map(reqUser => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 12px; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 8px;">
                <div>
                  <strong style="color: #ffffff; font-size: 14px;">${reqUser.displayName}</strong>
                  <span style="font-size: 12.5px; color: #f5c285; margin-left: 8px;">${reqUser.email}</span>
                  <div style="font-size: 11px; color: rgba(235, 220, 205, 0.5); margin-top: 2px;">Requested: ${reqUser.accessRequestedAt ? new Date(reqUser.accessRequestedAt).toLocaleTimeString() : 'Recently'}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button type="button" class="console-nav-btn btn-scan approve-access-btn" data-user-id="${reqUser.id}">Approve Access</button>
                  <button type="button" class="console-nav-btn reject-access-btn" data-user-id="${reqUser.id}" style="color: #ff6b6b;">Reject</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 4px;">User Maintenance Inquiries</h2>
        <p style="font-size: 13px; color: rgba(235, 220, 205, 0.6); margin: 0;">Question forms submitted by clients requiring engineering assessment.</p>
      </div>

      <div class="components-list">
        ${requests.length === 0 ? '<div style="color: rgba(235,220,205,0.5);">No pending inquiries.</div>' : ''}
        ${requests.map(req => `
          <div class="component-item" style="border-left: 3px solid ${req.priority === 'urgent' ? '#f59e0b' : '#34d399'};">
            <div class="comp-top-row">
              <div>
                <span style="font-family: monospace; font-weight: 700; color: #f5c285;">${req.ticketNumber}</span>
                <span style="font-weight: 700; color: #fff; margin-left: 8px;">${req.buildingName}</span>
                <span style="font-size: 12px; color: rgba(235,220,205,0.6); margin-left: 8px;">from: ${req.userName} (${req.userEmail})</span>
              </div>
              <span class="comp-status-pill ${req.status === 'resolved' ? 'good' : 'service_soon'}">${req.status.toUpperCase()}</span>
            </div>

            <div style="font-size: 14px; color: #ede4d8; line-height: 1.5; margin: 4px 0;">
              <strong>Issue:</strong> ${req.description}
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; font-size: 12.5px; line-height: 1.5; color: rgba(235,220,205,0.85);">
              <div>• <strong>Observed Location:</strong> ${req.questionnaireAnswers.locationInLift || 'N/A'}</div>
              <div>• <strong>Time of Day:</strong> ${req.questionnaireAnswers.timeOfDayObserved || 'N/A'}</div>
              <div>• <strong>Ride Impact:</strong> ${req.questionnaireAnswers.impactOnRide || 'N/A'}</div>
              ${req.adminNotes ? `<div style="margin-top: 6px; color: #f5c285;">• <strong>Admin Notes:</strong> ${req.adminNotes}</div>` : ''}
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 12px; color: rgba(235,220,205,0.5);">Submitted: ${new Date(req.createdAt).toLocaleString()}</span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="glass console-nav-btn update-req-status" data-liquid data-req-id="${req.id}" data-status="in_review">Mark In Review</button>
                <button type="button" class="glass console-nav-btn update-req-status" data-liquid data-req-id="${req.id}" data-status="dispatched">Dispatch Tech</button>
                <button type="button" class="glass console-nav-btn update-req-status btn-scan" data-liquid data-req-id="${req.id}" data-status="resolved">Resolve</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.approve-access-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        cabixDB.approveUserAccess(userId);
        alert('Client Access Approved. The user now has full access to Works, Add Work, QR Scanner, and Live Chat.');
        this.renderActiveTab();
      });
    });

    container.querySelectorAll('.reject-access-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        cabixDB.rejectUserAccess(userId);
        this.renderActiveTab();
      });
    });

    container.querySelectorAll('.update-req-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const reqId = btn.dataset.reqId;
        const status = btn.dataset.status;
        const notes = prompt(`Add internal note for ticket status '${status}':`, 'Technician dispatched to building.');
        cabixDB.updateRequestStatus(reqId, status, notes);
        this.renderActiveTab();
      });
    });
  }

  // ==========================================================================
  // 4.5. USERS & CLIENT DIRECTORY
  // ==========================================================================

  renderUsersList(container) {
    const allProfiles = cabixDB.getAllProfiles();
    const currentUser = cabixDB.getCurrentUser();

    const totalCount = allProfiles.length;
    const clientCount = allProfiles.filter(p => p.role === 'user').length;
    const approvedCount = allProfiles.filter(p => p.role === 'user' && p.isApproved).length;
    const pendingCount = allProfiles.filter(p => p.role === 'user' && !p.isApproved).length;
    const suspendedCount = allProfiles.filter(p => !p.isActive).length;

    // Filter profiles based on this.userFilter and this.userSearchTerm
    const filtered = allProfiles.filter(user => {
      // Role & status filter
      if (this.userFilter === 'clients' && user.role !== 'user') return false;
      if (this.userFilter === 'approved' && (!user.isApproved || user.role !== 'user')) return false;
      if (this.userFilter === 'pending' && (user.isApproved || user.role !== 'user')) return false;
      if (this.userFilter === 'suspended' && user.isActive) return false;

      // Search term filter
      if (this.userSearchTerm) {
        const query = this.userSearchTerm.toLowerCase();
        const matchName = (user.displayName || '').toLowerCase().includes(query);
        const matchEmail = (user.email || '').toLowerCase().includes(query);
        const matchRole = (user.role || '').toLowerCase().includes(query);
        const matchId = (user.id || '').toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchRole && !matchId) return false;
      }

      return true;
    });

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 4px;">Users & Clients Directory</h2>
          <p style="font-size: 13px; color: rgba(235, 220, 205, 0.6); margin: 0;">Live facility client directory, access approval controls, and account management.</p>
        </div>
        <button type="button" class="glass console-nav-btn btn-scan" data-liquid id="btn-create-client-user">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>+ Register New Client</span>
        </button>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="users-stats-grid">
        <div class="user-stat-card">
          <div class="user-stat-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Total Profiles
          </div>
          <div class="user-stat-val">${totalCount}</div>
          <div class="user-stat-sub">${clientCount} Client accounts, ${totalCount - clientCount} Staff</div>
        </div>

        <div class="user-stat-card stat-approved">
          <div class="user-stat-label" style="color: #34d399;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Approved Clients
          </div>
          <div class="user-stat-val" style="color: #34d399;">${approvedCount}</div>
          <div class="user-stat-sub">Granted full portal & lift access</div>
        </div>

        <div class="user-stat-card stat-pending">
          <div class="user-stat-label" style="color: #fbbf24;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Pending Access
          </div>
          <div class="user-stat-val" style="color: #fbbf24;">${pendingCount}</div>
          <div class="user-stat-sub">Awaiting verification approval</div>
        </div>

        <div class="user-stat-card stat-suspended">
          <div class="user-stat-label" style="color: #f87171;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            Suspended
          </div>
          <div class="user-stat-val" style="color: #f87171;">${suspendedCount}</div>
          <div class="user-stat-sub">Blocked from login access</div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="users-filter-bar">
        <div class="users-search-wrap">
          <div class="users-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input type="text" id="users-search-input" class="users-search-input" placeholder="Search by name, email, or user ID..." value="${this.userSearchTerm || ''}" />
        </div>

        <div class="users-filter-pills">
          <button type="button" class="glass users-filter-pill ${this.userFilter === 'all' ? 'active' : ''}" data-liquid data-filter="all">All (${totalCount})</button>
          <button type="button" class="glass users-filter-pill ${this.userFilter === 'clients' ? 'active' : ''}" data-liquid data-filter="clients">Clients (${clientCount})</button>
          <button type="button" class="glass users-filter-pill ${this.userFilter === 'approved' ? 'active' : ''}" data-liquid data-filter="approved">Approved (${approvedCount})</button>
          <button type="button" class="glass users-filter-pill ${this.userFilter === 'pending' ? 'active' : ''}" data-liquid data-filter="pending">Pending (${pendingCount})</button>
          <button type="button" class="glass users-filter-pill ${this.userFilter === 'suspended' ? 'active' : ''}" data-liquid data-filter="suspended">Suspended (${suspendedCount})</button>
        </div>
      </div>

      <!-- Users List -->
      <div class="users-table-list">
        ${filtered.length === 0 ? `
          <div style="background: rgba(22, 10, 6, 0.5); border: 1px dashed rgba(255,255,255,0.12); border-radius: 18px; padding: 40px; text-align: center; color: rgba(235, 220, 205, 0.5);">
            No users found matching your search or active filter criteria.
          </div>
        ` : ''}

        ${filtered.map(user => {
          const isSelf = user.id === currentUser.id;
          const isUserGod = user.role === 'god_admin';
          const isUserAdmin = user.role === 'admin';
          const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

          return `
            <div class="user-row-card" data-user-id="${user.id}">
              <div class="user-info-cluster">
                <div class="user-avatar-disc">${initial}</div>
                <div class="user-name-group">
                  <div class="user-display-name">
                    <span>${user.displayName}</span>
                    ${isSelf ? '<span style="font-size: 11px; color: #f5c285; font-weight: normal;">(You)</span>' : ''}
                  </div>
                  <div class="user-email-text">${user.email}</div>
                  <div style="font-size: 11px; color: rgba(235, 220, 205, 0.45); margin-top: 2px;">
                    Registered: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'System Seed'}
                  </div>
                </div>
              </div>

              <div class="user-badges-cluster">
                <span class="user-role-badge ${isUserGod ? 'god' : (isUserAdmin ? 'admin' : '')}">
                  ${isUserGod ? 'GOD ADMIN' : (isUserAdmin ? 'TECHNICIAN LEAD' : 'FACILITY CLIENT')}
                </span>

                ${user.role === 'user' ? `
                  <span class="user-status-pill ${user.isApproved ? 'approved' : (user.accessRequested ? 'pending' : 'unrequested')}">
                    ${user.isApproved ? `
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      APPROVED
                    ` : (user.accessRequested ? `
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      PENDING APPROVAL
                    ` : `
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      UNVERIFIED
                    `)}
                  </span>
                ` : `
                  <span class="user-status-pill approved" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.4); color: #fbbf24;">
                    AUTHORIZED STAFF
                  </span>
                `}

                <span class="user-status-pill ${user.isActive ? 'approved' : 'suspended'}" style="padding: 3px 8px; font-size: 10px;">
                  ${user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </span>
              </div>

              <div class="user-actions-cluster">
                ${user.role === 'user' ? `
                  <button type="button" class="console-action-btn ${user.isApproved ? 'btn-revoke-toggle' : 'btn-approve-toggle'} toggle-user-approval-btn" data-user-id="${user.id}">
                    ${user.isApproved ? `
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      Revoke
                    ` : `
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Approve
                    `}
                  </button>
                ` : ''}

                <button type="button" class="console-action-btn edit-user-name-btn" data-user-id="${user.id}" data-current-name="${user.displayName}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  Edit Name
                </button>

                <button type="button" class="console-action-btn send-user-chat-btn" data-user-name="${user.displayName}" data-user-email="${user.email}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Chat
                </button>

                ${!isUserGod && !isSelf ? `
                  <button type="button" class="console-action-btn toggle-user-status-btn" data-user-id="${user.id}">
                    ${user.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                  <button type="button" class="console-action-btn btn-danger delete-user-btn" data-user-id="${user.id}" data-user-email="${user.email}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Slot for dynamic modal -->
      <div id="user-modal-container"></div>
    `;

    // Event listeners
    // Search input
    const searchInput = container.querySelector('#users-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.userSearchTerm = e.target.value;
      this.renderUsersList(container);
    });

    // Filter pills
    container.querySelectorAll('.users-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.userFilter = pill.dataset.filter;
        this.renderUsersList(container);
      });
    });

    // Toggle user approval
    container.querySelectorAll('.toggle-user-approval-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        cabixDB.toggleUserApproval(userId);
        this.renderUsersList(container);
      });
    });

    // Edit user name
    container.querySelectorAll('.edit-user-name-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        const current = btn.dataset.currentName;
        const newName = prompt('Enter updated display name for client (max 15 characters):', current);
        if (newName !== null && newName.trim()) {
          cabixDB.updateUserDisplayName(userId, newName.trim());
          this.renderUsersList(container);
        }
      });
    });

    // Toggle user active / suspended status
    container.querySelectorAll('.toggle-user-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        cabixDB.toggleUserStatus(userId);
        this.renderUsersList(container);
      });
    });

    // Delete user
    container.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        const email = btn.dataset.userEmail;
        if (confirm(`Permanently remove client account '${email}'?`)) {
          cabixDB.deleteUser(userId);
          this.renderUsersList(container);
        }
      });
    });

    // Quick Chat direct message
    container.querySelectorAll('.send-user-chat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.userName;
        const msg = prompt(`Send direct notification to ${name}:`, `Hello ${name}, your facility access and elevator reports have been verified.`);
        if (msg && msg.trim()) {
          cabixDB.sendChatMessage(`[@${name}]: ${msg.trim()}`);
          alert(`Message successfully dispatched to Live Chat feed for ${name}.`);
        }
      });
    });

    // Register New Client Button
    container.querySelector('#btn-create-client-user')?.addEventListener('click', () => {
      this.openCreateUserModal(container);
    });
  }

  openCreateUserModal(container) {
    const modalSlot = container.querySelector('#user-modal-container');
    if (!modalSlot) return;

    modalSlot.innerHTML = `
      <div class="console-modal-overlay" id="create-user-modal">
        <div class="console-modal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="font-weight: 700; font-size: 18px; color: #ffffff;">Register New Facility Client</div>
            <button type="button" class="glass console-nav-btn" data-liquid id="btn-close-user-modal" style="padding: 4px 10px;">✕</button>
          </div>

          <form id="create-client-form">
            <div class="console-input-group">
              <label class="console-label" for="new-client-name">Display Name</label>
              <input type="text" id="new-client-name" class="console-input" placeholder="e.g. Victor Stone" maxlength="15" required />
            </div>

            <div class="console-input-group">
              <label class="console-label" for="new-client-email">Email Address</label>
              <input type="email" id="new-client-email" class="console-input" placeholder="client@building.com" required />
            </div>

            <div class="console-input-group">
              <label class="console-label" for="new-client-pwd">Password</label>
              <input type="text" id="new-client-pwd" class="console-input" value="user123" required />
            </div>

            <div style="display: flex; align-items: center; gap: 10px; margin: 16px 0;">
              <input type="checkbox" id="new-client-approve" checked style="width: 18px; height: 18px; accent-color: #f59e0b; cursor: pointer;" />
              <label for="new-client-approve" style="font-size: 13px; color: #ede4d8; cursor: pointer;">
                Pre-approve client for immediate elevator portal access
              </label>
            </div>

            <div id="create-user-error" style="color: #ff6b6b; font-size: 13px; min-height: 18px; margin-bottom: 12px;"></div>

            <div style="display: flex; gap: 12px; margin-top: 10px;">
              <button type="button" class="glass console-nav-btn" data-liquid id="btn-cancel-create-user" style="flex: 1; justify-content: center; height: 44px;">Cancel</button>
              <button type="submit" class="console-btn-primary" style="flex: 2; margin-top: 0; height: 44px;">Register Client</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.initLiquidInteractions();

    const form = modalSlot.querySelector('#create-client-form');
    const closeBtn = modalSlot.querySelector('#btn-close-user-modal');
    const cancelBtn = modalSlot.querySelector('#btn-cancel-create-user');
    const errBox = modalSlot.querySelector('#create-user-error');

    const closeModal = () => {
      modalSlot.innerHTML = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      errBox.textContent = '';
      const name = modalSlot.querySelector('#new-client-name').value;
      const email = modalSlot.querySelector('#new-client-email').value;
      const pwd = modalSlot.querySelector('#new-client-pwd').value;
      const isApproved = modalSlot.querySelector('#new-client-approve').checked;

      const res = cabixDB.createClientUser({
        displayName: name,
        email,
        password: pwd,
        isApproved
      });

      if (!res.success) {
        errBox.textContent = res.error;
        return;
      }

      closeModal();
      this.renderUsersList(container);
    });
  }

  // ==========================================================================
  // 5. GOD ADMIN: ADMIN TEAM MANAGEMENT
  // ==========================================================================

  renderAdminTeamManager(container) {
    const admins = cabixDB.getAdmins();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 4px;">Master Admin Team Provisioning</h2>
          <p style="font-size: 13px; color: rgba(235, 220, 205, 0.6); margin: 0;">God Admin exclusive: Provision, suspend, and configure secondary technicians.</p>
        </div>
        <button type="button" class="glass console-nav-btn btn-scan" data-liquid id="btn-provision-admin">
          + Provision Secondary Admin
        </button>
      </div>

      <div class="components-list">
        ${admins.map(admin => `
          <div class="component-item">
            <div class="comp-top-row">
              <div>
                <span class="comp-name">${admin.displayName}</span>
                <span style="font-size: 13px; color: #f5c285; margin-left: 10px;">${admin.email}</span>
                <span class="console-role-indicator ${admin.role === 'god_admin' ? 'god' : 'admin'}" style="margin-left: 10px;">
                  ${admin.role === 'god_admin' ? 'GOD ADMIN' : 'SECONDARY ADMIN'}
                </span>
              </div>
              <span class="comp-status-pill ${admin.isActive ? 'good' : 'overdue_replacement'}">
                ${admin.isActive ? 'ACTIVE' : 'SUSPENDED'}
              </span>
            </div>

            <div style="font-size: 12px; color: rgba(235,220,205,0.6); display: flex; justify-content: space-between;">
              <span>Created: ${new Date(admin.createdAt).toLocaleDateString()}</span>
              ${admin.role !== 'god_admin' ? `
                <div style="display: flex; gap: 8px;">
                  <button type="button" class="console-nav-btn toggle-admin-btn" data-admin-id="${admin.id}">
                    ${admin.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                  <button type="button" class="console-nav-btn delete-admin-btn" data-admin-id="${admin.id}" style="color: #ff6b6b;">
                    Revoke & Delete
                  </button>
                </div>
              ` : '<span style="color: #fbbf24; font-weight: 700;">Supreme Authority</span>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btn-provision-admin')?.addEventListener('click', () => {
      const email = prompt('Enter New Admin Email:', 'tech2@cabix.app');
      if (!email) return;
      const name = prompt('Display Name (max 10 chars):', 'TechAlex');
      if (!name) return;
      const pwd = prompt('Temporary Password:', 'admin123');
      cabixDB.createSecondaryAdmin({ email, displayName: name, password: pwd });
      this.renderActiveTab();
    });

    container.querySelectorAll('.toggle-admin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cabixDB.toggleAdminStatus(btn.dataset.adminId);
        this.renderActiveTab();
      });
    });

    container.querySelectorAll('.delete-admin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Revoke and delete this secondary administrator account?')) {
          cabixDB.deleteSecondaryAdmin(btn.dataset.adminId);
          this.renderActiveTab();
        }
      });
    });
  }

  // ==========================================================================
  // 6. SYSTEM AUDIT LOGS
  // ==========================================================================

  renderAuditLogs(container) {
    const logs = cabixDB.getAuditLogs();

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 4px;">System Audit Logs</h2>
        <p style="font-size: 13px; color: rgba(235, 220, 205, 0.6); margin: 0;">Immutable trail of administrative events & permissions changes.</p>
      </div>

      <div class="components-list">
        ${logs.length === 0 ? '<div style="color: rgba(235,220,205,0.5);">No audit records generated in this session.</div>' : ''}
        ${logs.map(log => `
          <div class="component-item" style="font-size: 13px;">
            <div class="comp-top-row">
              <strong style="color: #f5c285;">${log.actionType}</strong>
              <span style="font-size: 12px; color: rgba(235,220,205,0.5);">${new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style="font-size: 12px; color: rgba(235,220,205,0.8);">
              Actor: ${log.actorEmail} (${log.actorRole})
            </div>
            <div style="font-family: monospace; font-size: 11px; color: rgba(235,220,205,0.5); background: rgba(0,0,0,0.25); padding: 6px; border-radius: 6px;">
              ${JSON.stringify(log.details)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==========================================================================
  // 7. REAL-TIME CAMERA QR SCANNER MODAL
  // ==========================================================================

  openCameraScanner() {
    const slot = this.root.querySelector('#scanner-modal-slot');
    if (!slot) return;

    slot.innerHTML = `
      <div class="qr-scanner-modal-backdrop" id="scanner-modal">
        <div class="qr-scanner-box">
          <div style="padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: #fff;">Scan Lift QR Code</span>
            <button type="button" class="glass console-nav-btn" data-liquid id="btn-close-scanner" style="padding: 4px 10px;">✕</button>
          </div>

          <div class="scanner-video-wrap">
            <video id="scanner-camera-video"></video>
            <div class="scanner-reticle"></div>
          </div>

          <div style="padding: 20px;">
            <div id="scanner-status" style="font-size: 13px; color: #f5c285; margin-bottom: 12px;">
              Initializing camera... Point camera at Lift QR tag.
            </div>

            <!-- Manual Fallback Input -->
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
              <div style="font-size: 12px; color: rgba(235,220,205,0.6); margin-bottom: 8px;">Or enter code manually:</div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="manual-code-input" class="console-input" placeholder="e.g. CBX-LIFT-101" value="CBX-LIFT-101" />
                <button type="button" class="glass console-nav-btn btn-scan" data-liquid id="btn-manual-code-go">Go</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initLiquidInteractions();

    const videoEl = slot.querySelector('#scanner-camera-video');
    const statusEl = slot.querySelector('#scanner-status');
    const closeBtn = slot.querySelector('#btn-close-scanner');
    const manualInput = slot.querySelector('#manual-code-input');
    const manualBtn = slot.querySelector('#btn-manual-code-go');

    const handleResolvedCode = (code) => {
      if (this.activeScanner) {
        this.activeScanner.stop();
        this.activeScanner = null;
      }
      slot.innerHTML = '';

      const matchedLift = cabixDB.getLiftByCode(code);
      if (matchedLift) {
        this.currentTab = 'lifts';
        this.selectedLiftId = matchedLift.id;
        this.render();
      } else {
        alert(`QR Code '${code}' recognized, but no matching elevator unit found in registry.`);
      }
    };

    manualBtn.addEventListener('click', () => {
      if (manualInput.value.trim()) {
        handleResolvedCode(manualInput.value.trim());
      }
    });

    closeBtn.addEventListener('click', () => {
      if (this.activeScanner) {
        this.activeScanner.stop();
        this.activeScanner = null;
      }
      slot.innerHTML = '';
    });

    // Start camera scanner
    this.activeScanner = new CabixCameraScanner(
      videoEl,
      (detectedText) => {
        handleResolvedCode(detectedText);
      },
      (err) => {
        statusEl.innerHTML = `<span style="color: #ff6b6b;">Camera unavailable (${err.message}). Use manual code input below.</span>`;
      }
    );

    this.activeScanner.start().then(started => {
      if (started) {
        statusEl.textContent = 'Camera active. Align QR code within frame.';
      }
    });
  }
}

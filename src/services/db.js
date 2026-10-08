/**
 * Cabix Database & State Engine (Module 1)
 * Manages LocalStorage Persistence, Lift Entities, Component Lifecycles,
 * Maintenance Inquiries, and Role-Based Access Control (RBAC).
 * Fully prepared for direct Supabase PostgreSQL integration.
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'cabix_current_user',
  PROFILES: 'cabix_profiles',
  LIFT_UNITS: 'cabix_lift_units',
  COMPONENTS: 'cabix_components',
  REQUESTS: 'cabix_maintenance_requests',
  LIFTWORK_LOGS: 'cabix_liftwork_logs',
  AUDIT_LOGS: 'cabix_audit_logs',
  SERVICES_CATALOG: 'cabix_services_catalog',
  CHAT_MESSAGES: 'cabix_chat_messages'
};

// ============================================================================
// INITIAL SEED DATA
// ============================================================================

const SEED_PROFILES = [
  {
    id: 'user-god-001',
    email: 'god@cabix.app',
    password: 'god1234',
    displayName: 'GodDirector',
    role: 'god_admin',
    isActive: true,
    isApproved: true,
    accessRequested: true,
    permissions: {
      canManageAdmins: true,
      canManageUsers: true,
      canManageLifts: true,
      canLogLiftwork: true,
      canGenerateQr: true,
      canViewAuditLogs: true
    },
    createdBy: null,
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'user-admin-002',
    email: 'admin@cabix.app',
    password: 'admin123',
    displayName: 'TechLead',
    role: 'admin',
    isActive: true,
    isApproved: true,
    accessRequested: true,
    permissions: {
      canManageAdmins: false,
      canManageUsers: false,
      canManageLifts: false,
      canLogLiftwork: true,
      canGenerateQr: true,
      canViewAuditLogs: false
    },
    createdBy: 'user-god-001',
    createdAt: '2026-02-15T10:30:00Z'
  },
  {
    id: 'user-client-003',
    email: 'user@cabix.app',
    password: 'user123',
    displayName: 'Abin',
    role: 'user',
    isActive: true,
    isApproved: true,
    accessRequested: true,
    permissions: {},
    createdBy: null,
    createdAt: '2026-03-01T12:00:00Z'
  },
  {
    id: 'user-client-004',
    email: 'client@cabix.app',
    password: 'user123',
    displayName: 'Elena',
    role: 'user',
    isActive: true,
    isApproved: true,
    accessRequested: true,
    permissions: {},
    createdBy: null,
    createdAt: '2026-03-05T14:00:00Z'
  },
  {
    id: 'user-client-005',
    email: 'pending@cabix.app',
    password: 'user123',
    displayName: 'Marcus',
    role: 'user',
    isActive: true,
    isApproved: false,
    accessRequested: false,
    permissions: {},
    createdBy: null,
    createdAt: '2026-03-08T15:00:00Z'
  }
];

const SEED_LIFTS = [
  {
    id: 'lift-101',
    unitCode: 'CBX-LIFT-101',
    buildingName: 'Grand Horizon Tower',
    locationAddress: '742 Evergreen Terrace, Core Sector 4',
    modelType: 'MRL Gearless Traction 2.5 m/s',
    capacityKg: 1000,
    maxPersons: 13,
    floorsServed: 18,
    installDate: '2023-04-12',
    lastServiceDate: '2026-09-18',
    status: 'operational',
    qrData: 'CBX-LIFT-101'
  },
  {
    id: 'lift-102',
    unitCode: 'CBX-LIFT-102',
    buildingName: 'Metropolitan Cargo Plaza',
    locationAddress: 'Dock 14, Industrial Avenue',
    modelType: 'Heavy Freight Hydraulic 1.0 m/s',
    capacityKg: 3500,
    maxPersons: 40,
    floorsServed: 6,
    installDate: '2022-08-20',
    lastServiceDate: '2026-08-30',
    status: 'maintenance_due',
    qrData: 'CBX-LIFT-102'
  },
  {
    id: 'lift-103',
    unitCode: 'CBX-LIFT-103',
    buildingName: 'Skyline Luxury Residences',
    locationAddress: '88 Oceanview Boulevard, West Wing',
    modelType: 'Panoramic Glass VVVF Traction 2.0 m/s',
    capacityKg: 800,
    maxPersons: 10,
    floorsServed: 24,
    installDate: '2024-01-10',
    lastServiceDate: '2026-09-28',
    status: 'operational',
    qrData: 'CBX-LIFT-103'
  }
];

const SEED_COMPONENTS = [
  // Components for CBX-LIFT-101
  {
    id: 'comp-101-1',
    liftId: 'lift-101',
    name: 'Permanent Magnet Synchronous Traction Motor',
    serialNumber: 'PMSM-TRAC-9082',
    installedDate: '2023-04-12',
    lifespanMonths: 72,
    manufacturer: 'Torin Drive Global',
    notes: 'Zero-gear quiet operation, 94% efficiency factor.'
  },
  {
    id: 'comp-101-2',
    liftId: 'lift-101',
    name: 'VVVF Variable Frequency Inverter Drive',
    serialNumber: 'YASKAWA-L1000-44A',
    installedDate: '2023-04-12',
    lifespanMonths: 48,
    manufacturer: 'Yaskawa Electric',
    notes: 'S-curve acceleration profile configured.'
  },
  {
    id: 'comp-101-3',
    liftId: 'lift-101',
    name: 'Main Hoist Steel Suspension Ropes (10mm x 5)',
    serialNumber: 'GUSTAV-WOLF-ST-88',
    installedDate: '2023-06-15',
    lifespanMonths: 36, // ~39 months elapsed: overdue replacement!
    manufacturer: 'Gustav Wolf Wire Rope',
    notes: 'Inspected for crown wire breaks; tension balance recorded.'
  },
  {
    id: 'comp-101-4',
    liftId: 'lift-101',
    name: 'Center-Opening Automatic Door Operator Assembly',
    serialNumber: 'SELCOM-HYDRA-PLUS',
    installedDate: '2024-03-10',
    lifespanMonths: 36,
    manufacturer: 'Wittur Group',
    notes: 'Optical multi-beam safety curtain integrated.'
  },
  {
    id: 'comp-101-5',
    liftId: 'lift-101',
    name: 'Progressive Safety Gear & Overspeed Governor',
    serialNumber: 'DYNATECH-PRG-02',
    installedDate: '2023-04-12',
    lifespanMonths: 60,
    manufacturer: 'Dynatech Safety Systems',
    notes: 'Bi-directional overspeed trip tested @ 2.85 m/s.'
  },

  // Components for CBX-LIFT-102
  {
    id: 'comp-102-1',
    liftId: 'lift-102',
    name: 'Submerged Hydraulic Power Unit & Twin Ram',
    serialNumber: 'BUCHER-HYD-T4000',
    installedDate: '2022-08-20',
    lifespanMonths: 48,
    manufacturer: 'Bucher Hydraulics',
    notes: 'ISO VG 46 anti-wear fluid level nominal.'
  },
  {
    id: 'comp-102-2',
    liftId: 'lift-102',
    name: 'Solid Roller Guide Shoes & Lubricators',
    serialNumber: 'ELSCO-ROL-800',
    installedDate: '2023-01-14',
    lifespanMonths: 36,
    manufacturer: 'ELSCO Guides',
    notes: 'Neoprene tire dampeners inspected for wear.'
  },

  // Components for CBX-LIFT-103
  {
    id: 'comp-103-1',
    liftId: 'lift-103',
    name: 'Direct Drive Glass Door Header',
    serialNumber: 'FERMATOR-PREM-4P',
    installedDate: '2024-01-10',
    lifespanMonths: 48,
    manufacturer: 'Fermator Group',
    notes: 'Silent brushless DC motor drive.'
  },
  {
    id: 'comp-103-2',
    liftId: 'lift-103',
    name: 'Regenerative Power Feeding Matrix',
    serialNumber: 'REGEN-MX-15KW',
    installedDate: '2024-01-10',
    lifespanMonths: 60,
    manufacturer: 'Schneider Electric',
    notes: 'Feeds clean braking energy back into building grid.'
  }
];

const SEED_REQUESTS = [
  {
    id: 'req-8491',
    ticketNumber: 'CBX-REQ-8491',
    liftId: 'lift-101',
    userId: 'user-client-003',
    userName: 'HorizonMgr',
    userEmail: 'user@cabix.app',
    buildingName: 'Grand Horizon Tower',
    issueCategory: 'abnormal_noise',
    priority: 'urgent',
    status: 'in_review',
    description: 'Slight rhythmic clicking sound heard when elevator ascends past 12th floor.',
    questionnaireAnswers: {
      locationInLift: 'Cabin roof / hoistway upper shaft',
      timeOfDayObserved: 'Peak morning hours (8:00 AM - 10:00 AM)',
      impactOnRide: 'Ride feels smooth, but passengers are concerned by sound',
      urgentEscalationRequested: true
    },
    assignedAdminId: 'user-admin-002',
    adminNotes: 'Assigned to TechLead. Inspect hoist rope tension and guide shoe alignment on floor 12 bracket.',
    createdAt: '2026-10-06T14:30:00Z',
    updatedAt: '2026-10-07T09:15:00Z'
  },
  {
    id: 'req-8492',
    ticketNumber: 'CBX-REQ-8492',
    liftId: 'lift-102',
    userId: 'user-client-003',
    userName: 'HorizonMgr',
    userEmail: 'user@cabix.app',
    buildingName: 'Metropolitan Cargo Plaza',
    issueCategory: 'routine_maintenance',
    priority: 'normal',
    status: 'pending',
    description: 'Scheduled quarterly hydraulic valve pack calibration and fluid analysis.',
    questionnaireAnswers: {
      locationInLift: 'Basement Machine Room',
      timeOfDayObserved: 'Routine 90-day maintenance interval',
      impactOnRide: 'Normal operation',
      urgentEscalationRequested: false
    },
    assignedAdminId: null,
    adminNotes: null,
    createdAt: '2026-10-07T08:00:00Z',
    updatedAt: '2026-10-07T08:00:00Z'
  }
];

const SEED_LIFTWORK_LOGS = [
  {
    id: 'log-001',
    liftId: 'lift-101',
    requestId: 'req-8491',
    technicianId: 'user-admin-002',
    technicianName: 'TechLead',
    serviceDate: '2026-09-18T11:00:00Z',
    timePeriodHours: 3.5,
    componentsReplaced: [
      { name: 'Door Guide Shoe Bushings (Pair)', partNumber: 'DGB-12' }
    ],
    inspectionOutput: 'Brake air gap calibrated to 0.40mm. Leveling accuracy measured at +/- 1.5mm across all 18 landings. Safety circuit trip test verified.',
    safetyCheckPassed: true,
    createdAt: '2026-09-18T15:00:00Z'
  }
];

const SEED_SERVICES = [
  {
    id: 'srv-1',
    title: 'Full Preventative Maintenance Plan',
    category: 'Preventative Maintenance',
    description: 'Comprehensive 42-point monthly mechanical & electrical inspection, optical alignment, and 24/7 priority emergency dispatch.',
    priceIndicator: 'From $180 / unit / mo',
    status: 'active',
    iconName: 'wrench'
  },
  {
    id: 'srv-2',
    title: 'MRL & Gearless Modernization Package',
    category: 'Modernization',
    description: 'Upgrade aged geared systems to energy-efficient permanent magnet gearless traction, cutting power consumption by up to 45%.',
    priceIndicator: 'Custom Engineering Quote',
    status: 'active',
    iconName: 'zap'
  },
  {
    id: 'srv-3',
    title: 'Component Lifespan & QR Audit Service',
    category: 'Safety & Compliance',
    description: 'Complete ultrasonic rope inspection, governor drop testing, and individual QR lifecycle tagging for building compliance.',
    priceIndicator: 'One-Time Audit: $450',
    status: 'active',
    iconName: 'qr'
  },
  {
    id: 'srv-4',
    title: 'Emergency 24/7 Entrapment Response',
    category: 'Emergency Dispatch',
    description: 'Rapid on-site response within 30 minutes with certified lift engineers for critical faults and entrapment rescue.',
    priceIndicator: 'Contract Client Included',
    status: 'active',
    iconName: 'shield'
  }
];

// ============================================================================
// DATABASE CLASS IMPLEMENTATION
// ============================================================================

class CabixDatabase {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
    } else {
      // Ensure all seed profiles and approvals are synchronized into existing storage
      const existing = this._get(STORAGE_KEYS.PROFILES);
      let changed = false;
      SEED_PROFILES.forEach(seed => {
        const found = existing.find(p => p.email.toLowerCase() === seed.email.toLowerCase());
        if (!found) {
          existing.push(seed);
          changed = true;
        } else if (seed.isApproved && !found.isApproved) {
          found.isApproved = true;
          found.accessRequested = true;
          changed = true;
        }
      });
      if (changed) {
        this._set(STORAGE_KEYS.PROFILES, existing);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIFT_UNITS)) {
      localStorage.setItem(STORAGE_KEYS.LIFT_UNITS, JSON.stringify(SEED_LIFTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPONENTS)) {
      localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(SEED_COMPONENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(SEED_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LIFTWORK_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LIFTWORK_LOGS, JSON.stringify(SEED_LIFTWORK_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES_CATALOG)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES_CATALOG, JSON.stringify(SEED_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify([
        {
          id: 'msg-01',
          senderId: 'user-admin-002',
          senderName: 'TechLead (Admin)',
          senderRole: 'admin',
          text: 'Hello! I am on-site monitoring Grand Horizon Tower. Please reach out here for any urgent hoistway or ride quality inquiries.',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg-02',
          senderId: 'user-client-003',
          senderName: 'Abin',
          senderRole: 'user',
          text: 'Thanks TechLead. Lift 101 leveling was inspected yesterday, ride is operating smoothly.',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ]));
    }
  }

  // --- Helpers ---
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (_) {
      return [];
    }
  }

  _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  _logAudit(actionType, details = {}) {
    const logs = this._get(STORAGE_KEYS.AUDIT_LOGS);
    const currentUser = this.getCurrentUser();
    logs.unshift({
      id: 'audit-' + Date.now(),
      actorId: currentUser ? currentUser.id : 'anon',
      actorEmail: currentUser ? currentUser.email : 'guest',
      actorRole: currentUser ? currentUser.role : 'guest',
      actionType,
      details,
      timestamp: new Date().toISOString()
    });
    this._set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  }

  // ==========================================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================================================

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.isGuest && parsed.id) {
          const profiles = this._get(STORAGE_KEYS.PROFILES);
          const live = profiles.find(p => p.id === parsed.id);
          if (live) {
            return {
              ...parsed,
              displayName: live.displayName,
              isApproved: Boolean(live.isApproved),
              accessRequested: Boolean(live.accessRequested),
              isActive: live.isActive
            };
          }
        }
        return parsed;
      }
    } catch (_) {}
    return {
      id: 'guest',
      email: 'guest@cabix.app',
      displayName: 'Guest',
      role: 'guest',
      isGuest: true,
      isApproved: false,
      accessRequested: false
    };
  }

  login(email, password) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const profiles = this._get(STORAGE_KEYS.PROFILES);

    let user = profiles.find(
      p => p.email.toLowerCase() === trimmedEmail
    );

    let isNewUser = false;
    if (!user) {
      // Auto-register new unapproved user
      user = {
        id: 'user-client-' + Date.now(),
        email: trimmedEmail,
        password: password || '123456',
        displayName: trimmedEmail.split('@')[0],
        role: 'user',
        isActive: true,
        isApproved: false,
        accessRequested: false,
        permissions: {},
        createdBy: null,
        createdAt: new Date().toISOString()
      };
      profiles.push(user);
      this._set(STORAGE_KEYS.PROFILES, profiles);
      isNewUser = true;
      this._logAudit('NEW_USER_REGISTERED', { email: user.email });
    } else {
      if (password && user.password !== password) {
        return { success: false, error: 'Incorrect password. Please verify credentials.' };
      }
    }

    if (!user.isActive) {
      return { success: false, error: 'Account suspended. Please contact Cabix God Administration.' };
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isApproved: Boolean(user.isApproved),
      accessRequested: Boolean(user.accessRequested),
      permissions: user.permissions || {},
      isGuest: false,
      isNewUser
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    this._logAudit('USER_LOGIN', { email: user.email, role: user.role });

    return { success: true, user: sessionUser, isNewUser };
  }

  loginAsGuest() {
    const guestUser = {
      id: 'guest',
      email: 'guest@cabix.app',
      displayName: 'Guest',
      role: 'guest',
      isGuest: true
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(guestUser));
    return guestUser;
  }

  loginGuest() {
    return this.loginAsGuest();
  }

  logout() {
    const currentUser = this.getCurrentUser();
    this._logAudit('USER_LOGOUT', { email: currentUser.email });
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  isGodAdmin() {
    return this.getCurrentUser().role === 'god_admin';
  }

  isAdmin() {
    const role = this.getCurrentUser().role;
    return role === 'admin' || role === 'god_admin';
  }

  isClient() {
    return this.getCurrentUser().role === 'user';
  }

  isGuest() {
    return !this.getCurrentUser() || this.getCurrentUser().role === 'guest';
  }

  // ==========================================================================
  // GOD ADMIN: SECONDARY ADMIN & USER MANAGEMENT
  // ==========================================================================

  getAdmins() {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    return profiles.filter(p => p.role === 'admin' || p.role === 'god_admin');
  }

  getUsers() {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    return profiles.filter(p => p.role === 'user');
  }

  getAllProfiles() {
    return this._get(STORAGE_KEYS.PROFILES);
  }

  createClientUser({ email, password, displayName, isApproved = true }) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Unauthorized: Admin credentials required.' };
    }

    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) return { success: false, error: 'Email cannot be empty.' };

    const existing = profiles.find(p => p.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'user-client-' + Date.now(),
      email: trimmedEmail,
      password: password || 'user123',
      displayName: (displayName || trimmedEmail.split('@')[0]).substring(0, 15),
      role: 'user',
      isActive: true,
      isApproved: Boolean(isApproved),
      accessRequested: Boolean(isApproved),
      permissions: {},
      createdBy: this.getCurrentUser().id,
      createdAt: new Date().toISOString()
    };

    profiles.push(newUser);
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('CLIENT_USER_CREATED', { email: newUser.email, displayName: newUser.displayName, isApproved: newUser.isApproved });

    return { success: true, user: newUser };
  }

  toggleUserApproval(userId) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized.' };
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    target.isApproved = !target.isApproved;
    if (target.isApproved) {
      target.accessRequested = true;
      target.approvedAt = new Date().toISOString();
    } else {
      target.accessRequested = false;
      target.approvedAt = null;
    }
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('USER_APPROVAL_TOGGLED', { userId: target.id, email: target.email, isApproved: target.isApproved });
    return { success: true, user: target };
  }

  toggleUserStatus(userId) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized.' };
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (target.role === 'god_admin') {
      return { success: false, error: 'Cannot suspend the Master God Admin.' };
    }

    target.isActive = !target.isActive;
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('USER_STATUS_TOGGLED', { userId: target.id, email: target.email, isActive: target.isActive });
    return { success: true, user: target };
  }

  deleteUser(userId) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized.' };
    let profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (target.role === 'god_admin') {
      return { success: false, error: 'Cannot delete the Master God Admin.' };
    }
    if (target.role === 'admin' && !this.isGodAdmin()) {
      return { success: false, error: 'Only God Admin can delete administrators.' };
    }

    profiles = profiles.filter(p => p.id !== userId);
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('USER_DELETED', { userId, email: target.email, role: target.role });
    return { success: true };
  }

  createSecondaryAdmin({ email, password, displayName, permissions }) {
    if (!this.isGodAdmin()) {
      return { success: false, error: 'Unauthorized: Only God Admin can create secondary administrators.' };
    }

    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const existing = profiles.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newAdmin = {
      id: 'user-admin-' + Date.now(),
      email: email.trim().toLowerCase(),
      password: password || 'admin123',
      displayName: (displayName || 'Admin').substring(0, 10),
      role: 'admin',
      isActive: true,
      permissions: permissions || {
        canManageAdmins: false,
        canManageUsers: false,
        canManageLifts: false,
        canLogLiftwork: true,
        canGenerateQr: true,
        canViewAuditLogs: false
      },
      createdBy: this.getCurrentUser().id,
      createdAt: new Date().toISOString()
    };

    profiles.push(newAdmin);
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('ADMIN_CREATED', { adminEmail: newAdmin.email, displayName: newAdmin.displayName });

    return { success: true, admin: newAdmin };
  }

  toggleAdminStatus(adminId) {
    if (!this.isGodAdmin()) {
      return { success: false, error: 'Unauthorized: Only God Admin can modify admin status.' };
    }

    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const admin = profiles.find(p => p.id === adminId);
    if (!admin) return { success: false, error: 'Admin not found.' };

    if (admin.role === 'god_admin') {
      return { success: false, error: 'Cannot suspend the Master God Admin.' };
    }

    admin.isActive = !admin.isActive;
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('ADMIN_STATUS_CHANGED', { adminEmail: admin.email, isActive: admin.isActive });

    return { success: true, admin };
  }

  deleteSecondaryAdmin(adminId) {
    if (!this.isGodAdmin()) {
      return { success: false, error: 'Unauthorized: Only God Admin can delete administrators.' };
    }

    let profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === adminId);
    if (!target) return { success: false, error: 'Admin not found.' };

    if (target.role === 'god_admin') {
      return { success: false, error: 'Cannot delete the Master God Admin.' };
    }

    profiles = profiles.filter(p => p.id !== adminId);
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('ADMIN_DELETED', { adminEmail: target.email });

    return { success: true };
  }

  getAuditLogs() {
    if (!this.isGodAdmin()) return [];
    return this._get(STORAGE_KEYS.AUDIT_LOGS);
  }

  // ==========================================================================
  // LIFT UNITS OPERATIONS
  // ==========================================================================

  getLifts() {
    return this._get(STORAGE_KEYS.LIFT_UNITS);
  }

  getLiftById(liftId) {
    const lifts = this.getLifts();
    return lifts.find(l => l.id === liftId) || null;
  }

  getLiftByCode(unitCode) {
    const lifts = this.getLifts();
    const clean = (unitCode || '').trim().toUpperCase();
    return lifts.find(l => l.unitCode.toUpperCase() === clean || l.qrData.toUpperCase() === clean) || null;
  }

  createLift(liftData) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Unauthorized: Admin privileges required to register lift units.' };
    }

    const lifts = this.getLifts();
    const code = (liftData.unitCode || `CBX-LIFT-${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase();

    if (lifts.some(l => l.unitCode === code)) {
      return { success: false, error: `Lift unit code ${code} is already in use.` };
    }

    const newLift = {
      id: 'lift-' + Date.now(),
      unitCode: code,
      buildingName: liftData.buildingName || 'Untitled Building',
      locationAddress: liftData.locationAddress || 'Unknown Address',
      modelType: liftData.modelType || 'Gearless Traction',
      capacityKg: parseInt(liftData.capacityKg, 10) || 1000,
      maxPersons: parseInt(liftData.maxPersons, 10) || 13,
      floorsServed: parseInt(liftData.floorsServed, 10) || 10,
      installDate: liftData.installDate || new Date().toISOString().split('T')[0],
      lastServiceDate: new Date().toISOString().split('T')[0],
      status: liftData.status || 'operational',
      qrData: code
    };

    lifts.push(newLift);
    this._set(STORAGE_KEYS.LIFT_UNITS, lifts);
    this._logAudit('LIFT_REGISTERED', { unitCode: code, building: newLift.buildingName });

    return { success: true, lift: newLift };
  }

  updateLiftStatus(liftId, newStatus) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized.' };

    const lifts = this.getLifts();
    const lift = lifts.find(l => l.id === liftId);
    if (!lift) return { success: false, error: 'Lift unit not found.' };

    lift.status = newStatus;
    lift.lastServiceDate = new Date().toISOString().split('T')[0];
    this._set(STORAGE_KEYS.LIFT_UNITS, lifts);
    this._logAudit('LIFT_STATUS_UPDATED', { unitCode: lift.unitCode, status: newStatus });

    return { success: true, lift };
  }

  // ==========================================================================
  // LIFT COMPONENTS & TIME PERIOD LIFECYCLE TRACKER
  // ==========================================================================

  getComponentsForLift(liftId) {
    const components = this._get(STORAGE_KEYS.COMPONENTS);
    const liftComponents = components.filter(c => c.liftId === liftId);

    // Calculate real-time active age, time periods, and lifespan status
    return liftComponents.map(comp => {
      const metrics = this.calculateComponentLifecycle(comp.installedDate, comp.lifespanMonths);
      return {
        ...comp,
        ...metrics
      };
    });
  }

  calculateComponentLifecycle(installedDateStr, lifespanMonths = 36) {
    const installDate = new Date(installedDateStr);
    const now = new Date();

    const diffMs = now - installDate;
    const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const monthsElapsed = Math.round((daysElapsed / 30.4375) * 10) / 10;

    const totalDaysLifespan = lifespanMonths * 30.4375;
    const progressPercent = Math.min(100, Math.round((daysElapsed / totalDaysLifespan) * 100));

    let status = 'good';
    let statusLabel = 'Operational';
    let statusColor = '#00e000';

    if (monthsElapsed >= lifespanMonths) {
      status = 'overdue_replacement';
      statusLabel = 'Overdue Replacement';
      statusColor = '#ff4d4d';
    } else if (monthsElapsed >= lifespanMonths * 0.8) {
      status = 'service_soon';
      statusLabel = 'Service Due Soon';
      statusColor = '#f59e0b';
    }

    return {
      daysElapsed,
      monthsElapsed,
      lifespanMonths,
      progressPercent,
      lifecycleStatus: status,
      statusLabel,
      statusColor
    };
  }

  addComponentToLift(liftId, componentData) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Unauthorized: Admin privileges required to add components.' };
    }

    const components = this._get(STORAGE_KEYS.COMPONENTS);
    const newComponent = {
      id: 'comp-' + Date.now(),
      liftId,
      name: componentData.name || 'Component',
      serialNumber: componentData.serialNumber || `SN-${Math.floor(1000 + Math.random() * 9000)}`,
      installedDate: componentData.installedDate || new Date().toISOString().split('T')[0],
      lifespanMonths: parseInt(componentData.lifespanMonths, 10) || 36,
      manufacturer: componentData.manufacturer || 'Standard OEM',
      notes: componentData.notes || ''
    };

    components.push(newComponent);
    this._set(STORAGE_KEYS.COMPONENTS, components);
    this._logAudit('COMPONENT_ADDED', { liftId, componentName: newComponent.name });

    return { success: true, component: newComponent };
  }

  // ==========================================================================
  // USER MAINTENANCE REQUESTS (THE QUESTION FORM PIPELINE)
  // ==========================================================================

  getMaintenanceRequests(filter = 'all') {
    const requests = this._get(STORAGE_KEYS.REQUESTS);
    const currentUser = this.getCurrentUser();

    // If client, only return their own requests
    if (this.isClient()) {
      return requests.filter(r => r.userId === currentUser.id);
    }

    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  }

  getRequestById(requestId) {
    const requests = this._get(STORAGE_KEYS.REQUESTS);
    return requests.find(r => r.id === requestId) || null;
  }

  createMaintenanceRequest(data) {
    const currentUser = this.getCurrentUser();
    if (currentUser.isGuest) {
      return { success: false, error: 'Authentication required: Please sign in to submit maintenance requests.' };
    }

    const requests = this._get(STORAGE_KEYS.REQUESTS);
    const ticketNum = `CBX-REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = {
      id: 'req-' + Date.now(),
      ticketNumber: ticketNum,
      liftId: data.liftId || null,
      userId: currentUser.id,
      userName: currentUser.displayName || 'Client',
      userEmail: currentUser.email,
      buildingName: data.buildingName || 'Grand Horizon Tower',
      issueCategory: data.issueCategory || 'routine_maintenance',
      priority: data.priority || 'normal',
      status: 'pending',
      description: data.description || '',
      questionnaireAnswers: data.questionnaireAnswers || {},
      assignedAdminId: null,
      adminNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    requests.unshift(newRequest);
    this._set(STORAGE_KEYS.REQUESTS, requests);
    this._logAudit('REQUEST_SUBMITTED', { ticketNumber: ticketNum, issue: newRequest.issueCategory });

    return { success: true, request: newRequest };
  }

  updateRequestStatus(requestId, newStatus, adminNotes = null) {
    if (!this.isAdmin()) return { success: false, error: 'Unauthorized.' };

    const requests = this._get(STORAGE_KEYS.REQUESTS);
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Maintenance request not found.' };

    req.status = newStatus;
    if (adminNotes !== null) req.adminNotes = adminNotes;
    req.assignedAdminId = this.getCurrentUser().id;
    req.updatedAt = new Date().toISOString();

    this._set(STORAGE_KEYS.REQUESTS, requests);
    this._logAudit('REQUEST_STATUS_UPDATED', { ticketNumber: req.ticketNumber, status: newStatus });

    return { success: true, request: req };
  }

  // ==========================================================================
  // LIFTWORK SERVICE LOGS & OUTPUT INSPECTIONS
  // ==========================================================================

  getLiftworkLogs(liftId = null) {
    const logs = this._get(STORAGE_KEYS.LIFTWORK_LOGS);
    if (!liftId) return logs;
    return logs.filter(l => l.liftId === liftId);
  }

  logLiftwork(data) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Unauthorized: Technician privileges required.' };
    }

    const logs = this._get(STORAGE_KEYS.LIFTWORK_LOGS);
    const currentUser = this.getCurrentUser();

    const newLog = {
      id: 'log-' + Date.now(),
      liftId: data.liftId,
      requestId: data.requestId || null,
      technicianId: currentUser.id,
      technicianName: currentUser.displayName,
      serviceDate: new Date().toISOString(),
      timePeriodHours: parseFloat(data.timePeriodHours) || 2.0,
      componentsReplaced: data.componentsReplaced || [],
      inspectionOutput: data.inspectionOutput || 'Maintenance check complete. Operational parameters normal.',
      safetyCheckPassed: data.safetyCheckPassed !== false,
      createdAt: new Date().toISOString()
    };

    logs.unshift(newLog);
    this._set(STORAGE_KEYS.LIFTWORK_LOGS, logs);

    // Update lift's last service date and status
    this.updateLiftStatus(data.liftId, 'operational');
    this._logAudit('LIFTWORK_LOGGED', { liftId: data.liftId, technician: currentUser.displayName });

    return { success: true, log: newLog };
  }

  // ==========================================================================
  // SERVICES CATALOG (FOR GUESTS AND CLIENTS)
  // ==========================================================================

  getServicesCatalog() {
    return this._get(STORAGE_KEYS.SERVICES_CATALOG);
  }

  // ==========================================================================
  // ACCESS APPROVAL SYSTEM (ANTI-SPAM BARRIER)
  // ==========================================================================

  requestUserAccess(userId) {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    target.accessRequested = true;
    target.accessRequestedAt = new Date().toISOString();
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('ACCESS_REQUESTED', { userId: target.id, email: target.email, displayName: target.displayName });

    return { success: true, user: target };
  }

  approveUserAccess(userId) {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    target.isApproved = true;
    target.accessRequested = true;
    target.approvedAt = new Date().toISOString();
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('ACCESS_APPROVED', { userId: target.id, email: target.email });

    return { success: true, user: target };
  }

  rejectUserAccess(userId) {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    target.isApproved = false;
    target.accessRequested = false;
    this._set(STORAGE_KEYS.PROFILES, profiles);
    this._logAudit('ACCESS_REJECTED', { userId: target.id, email: target.email });

    return { success: true, user: target };
  }

  getAccessRequests() {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    return profiles.filter(p => p.role === 'user' && p.accessRequested && !p.isApproved);
  }

  updateUserDisplayName(userId, newName) {
    const profiles = this._get(STORAGE_KEYS.PROFILES);
    const target = profiles.find(p => p.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    target.displayName = (newName || '').trim().substring(0, 10) || 'Abin';
    this._set(STORAGE_KEYS.PROFILES, profiles);

    // Update current session if matching
    const currentUser = this.getCurrentUser();
    if (currentUser.id === userId) {
      currentUser.displayName = target.displayName;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }

    return { success: true, user: target };
  }

  // ==========================================================================
  // ADMIN LIVE CHAT MESSAGING
  // ==========================================================================

  getChatMessages() {
    return this._get(STORAGE_KEYS.CHAT_MESSAGES);
  }

  sendChatMessage(text) {
    const clean = (text || '').trim();
    if (!clean) return { success: false, error: 'Message cannot be empty.' };

    const messages = this._get(STORAGE_KEYS.CHAT_MESSAGES);
    const currentUser = this.getCurrentUser();

    const newMsg = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.displayName || (currentUser.role === 'admin' ? 'TechLead' : 'Client'),
      senderRole: currentUser.role || 'user',
      text: clean,
      timestamp: new Date().toISOString()
    };

    messages.push(newMsg);
    this._set(STORAGE_KEYS.CHAT_MESSAGES, messages);

    return { success: true, message: newMsg };
  }
}

// Export singleton instance
export const cabixDB = new CabixDatabase();
if (typeof window !== 'undefined') {
  window.cabixDB = cabixDB;
}

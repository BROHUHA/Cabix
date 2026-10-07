# Cabix Administrative Portal Architecture & Implementation Blueprint (MODEL.md)

This document defines the comprehensive architecture and implementation plan for transforming the application into **Cabix** — featuring a multi-tiered Administrative Portal with a **God Admin (Super Admin)**, **Secondary Admins**, **Authenticated Users**, and a public **Guest Mode**, running **100% on Free-Tier Cloud Infrastructure**.

---

## 1. Free-Tier Architecture & Technology Selection

### Recommended Stack (100% Free Tier, Zero Monthly Cost)

| Layer | Service / Technology | Free Tier Capacity | Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend & PWA** | **Vite + Vanilla JS + CSS** | Unlimited / Local | Mobile-first WebAPK, PWA Service Worker, liquid-glass aesthetic. |
| **Hosting & CI/CD** | **Vercel (Hobby Tier)** | Unlimited deploys, 100GB bandwidth | Automatic Git build on commit (`BROHUHA/Cabix`), global CDN, SSL. |
| **Auth & Database** | **Supabase (Free Tier)** | 50,000 MAU, 500MB DB, 2 Projects | Postgres Database, Row-Level Security (RLS), Realtime events, Auth. |
| **Local Fallback Engine** | **Structured LocalStorage / Mock DB** | Client-side 5MB | Instant local testing without requiring immediate API keys. |

### Why Supabase Free Tier is the Optimal Choice for this Architecture:
1. **Native Role-Based Access Control (RLS)**: Easily enforce security rules at the database level so secondary admins cannot tamper with God Admin records, and regular users can only read/write their own requests.
2. **Real-time Subscriptions**: User question form submissions appear on admin dashboards instantly without manual page refreshing.
3. **Generous Zero-Dollar Limits**: 50,000 active users and 500MB is more than sufficient for full development, production beta, and administrative operations.

---

## 2. Role-Based Access Control (RBAC) Matrix

```
                      +-----------------------------+
                      |          GOD ADMIN          |
                      |  (Master / Super Authority) |
                      +--------------+--------------+
                                     |
                +--------------------+--------------------+
                |                                         |
                v                                         v
   +------------------------+                +------------------------+
   |    SECONDARY ADMINS    |                |    REGISTERED USERS    |
   | (Manage Requests & Ops)|                | (Browse & Submit Forms)|
   +------------+-----------+                +------------+-----------+
                |                                         |
                +--------------------+--------------------+
                                     |
                                     v
                      +-----------------------------+
                      |         GUEST MODE          |
                      | (Public Read-Only Catalog)  |
                      +-----------------------------+
```

| Capabilities & Permissions | Guest Mode | Registered User | Secondary Admin | God Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse Cabix Services Catalog | ✅ | ✅ | ✅ | ✅ |
| Access Service Detail Specs | ✅ | ✅ | ✅ | ✅ |
| Submit Inquiries / Question Forms | ❌ *(Prompts Login)* | ✅ | ✅ | ✅ |
| View Own Message Request Status | ❌ | ✅ | ✅ | ✅ |
| Manage / Reply to User Inquiries | ❌ | ❌ | ✅ | ✅ |
| Update Request Processing Status | ❌ | ❌ | ✅ | ✅ |
| View All User Accounts | ❌ | ❌ | ❌ *(Or Read Only)* | ✅ |
| Create & Assign Secondary Admins | ❌ | ❌ | ❌ | ✅ |
| Modify Admin Permission Scopes | ❌ | ❌ | ❌ | ✅ |
| Delete / Deactivate Admins & Users | ❌ | ❌ | ❌ | ✅ |
| Access Master System Audit Log | ❌ | ❌ | ❌ | ✅ |

---

## 3. Modular Implementation Plan

```
+-------------------------------------------------------------------------------+
|                       CABIX IMPLEMENTATION MODULES                            |
|                                                                               |
|  [Module 1] Data Models & RBAC Schema (Supabase + LocalStorage Fallback)       |
|  [Module 2] Universal Authentication & Role Router                            |
|  [Module 3] Public Guest Services Catalog & Login Gateways                    |
|  [Module 4] User Question Form & Communication Pipeline                       |
|  [Module 5] Secondary Administrator Operations Portal                         |
|  [Module 6] God Admin Master Management Hub                                   |
|  [Module 7] WebAPK & Free-Tier Vercel Continuous Deployment                   |
+-------------------------------------------------------------------------------+
```

---

### Module 1: Data Models & RBAC Schema
* **Target Files:** `src/services/db.js`, `src/services/schema.sql`
* **Objective:** Establish clean relational entities with row-level permission logic.

#### Core Entities:
1. **`profiles`**
   - `id`: UUID (matches `auth.users.id`)
   - `email`: Text
   - `display_name`: Text (10 characters max, capitalized)
   - `role`: Enum (`'god_admin'`, `'admin'`, `'user'`)
   - `is_active`: Boolean
   - `permissions`: JSONB (e.g. `{"can_reply_inquiries": true, "can_manage_services": false}`)
   - `created_at`: Timestamp
   - `created_by`: UUID (references `profiles.id`, tracks which God Admin created secondary admins)

2. **`services`**
   - `id`: UUID
   - `title`: Text (e.g., "Executive Fleet Dispatch", "Private Chauffeur", "Airport Transfer")
   - `category`: Text
   - `description`: Text
   - `price_indicator`: Text
   - `status`: Enum (`'active'`, `'paused'`)
   - `icon_name`: Text

3. **`inquiry_requests` (The Question Form Submissions)**
   - `id`: UUID
   - `user_id`: UUID (references `profiles.id`)
   - `user_name`: Text
   - `user_email`: Text
   - `service_id`: UUID (nullable, references `services.id`)
   - `subject`: Text
   - `question_details`: JSONB / Text (answers from structured question form)
   - `priority`: Enum (`'normal'`, `'urgent'`)
   - `status`: Enum (`'pending'`, `'in_review'`, `'contacted'`, `'resolved'`, `'rejected'`)
   - `admin_notes`: Text
   - `assigned_admin_id`: UUID (references `profiles.id`)
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

---

### Module 2: Universal Authentication & Dynamic Role Router
* **Target Files:** `src/main.js`, `index.html`, `src/style.css`
* **Objective:** Seamless gateway that directs sessions to the appropriate view based on authenticated role.

#### Workflow:
1. **Session Check on App Launch**:
   - `role === 'god_admin'` $\rightarrow$ Render **God Admin Control Hub** (`#view-god-admin`).
   - `role === 'admin'` $\rightarrow$ Render **Admin Operations Portal** (`#view-admin`).
   - `role === 'user'` $\rightarrow$ Render **User Services & Inquiries Portal** (`#view-user-portal`).
   - Unauthenticated $\rightarrow$ Default to **Guest Services Showcase** (`#view-services-showcase`) or **Login Gate** (`#view-login`).
2. **Switching / Logout**:
   - Any screen provides a top-bar lock / switch button.
   - God Admin and Admins can simulate "View as User" or "View as Guest" for testing.

---

### Module 3: Guest & User Services Catalog
* **Target Files:** `index.html`, `src/style.css`, `src/services/servicesRenderer.js`
* **Objective:** Clean, elegant service showcase accessible by guests and users.

#### Key Features:
- **Guest Mode Experience**:
  - Unlocked browsing of all Cabix services with interactive cards.
  - Prominent **"Connect with Admin"** or **"Request Service"** button on each service card.
  - Tapping action button triggers an executive glass modal:  
    *"Authentication Required: Please sign in or create an account to submit inquiries and connect directly with Cabix Administration."*
- **Logged-in User Experience**:
  - Tapping **"Connect"** directly launches the structured **Question Form Modal**.

---

### Module 4: Structured Question Form & Inquiry Pipeline
* **Target Files:** `index.html`, `src/main.js`, `src/components/inquiryModal.js`
* **Objective:** User-friendly question questionnaire that packages user requests directly to the admin queue.

#### Question Form Architecture:
- **Step 1: Inquiry Type**: Select service (or general administrative inquiry).
- **Step 2: Core Questionnaire**:
  - What is the primary purpose? (Business, Corporate, Personal, Event)
  - Estimated timeline or frequency?
  - Specific questions or custom requirements?
- **Step 3: Contact Preference**: Preferred communication channel (Email, Phone/SMS, In-App).
- **Confirmation & Live Tracking**: User receives an instant inquiry tracking badge (`#CBX-XXXX`) with live status pill (`Pending Review`).

---

### Module 5: Secondary Administrator Operations Portal
* **Target Files:** `index.html`, `src/style.css`, `src/admin/adminPortal.js`
* **Objective:** Efficient workstation for secondary admins to respond to user requests.

#### Core Panels:
1. **Inquiry Queue (Live Message Board)**:
   - Filter by: `All`, `Pending`, `Contacted`, `Resolved`.
   - Card displays: User name, submission timestamp, service type, urgent flags.
2. **Inquiry Detail & Response Drawer**:
   - View full answers to the user's question form.
   - Internal admin notes (shared between admins).
   - Quick action: Mark as `Contacted`, `Resolved`, or trigger email response.
3. **Services Status Toggles**:
   - Toggle service availability (e.g., mark a service as temporarily booked/unavailable).

---

### Module 6: God Admin Master Management Hub
* **Target Files:** `index.html`, `src/style.css`, `src/admin/godAdmin.js`
* **Objective:** Supreme command center for the master administrator.

#### Exclusive God Admin Capabilities:
1. **Admin Team Management**:
   - **Add Secondary Admin**: Form with Email, Temporary Password, Name, and Permission toggles.
   - **Admin Roster**: Table/Cards of all admins showing status (Active/Suspended), last login date, and assigned inquiries count.
   - **Deactivate / Revoke Admin**: 1-tap suspension with immediate session termination.
2. **User Directory**:
   - View all registered users and their total inquiries count.
   - Ability to ban abusive or spam accounts.
3. **Service Catalog Editor**:
   - Add new Cabix services, edit titles, pricing indicators, and descriptions.
4. **Master Audit Trail**:
   - Chronological log of which admin answered which ticket, and when accounts were provisioned.

---

### Module 7: Free-Tier Deployment & Live Updates
* **Target Files:** `vercel.json`, `public/sw.js`, `public/manifest.webmanifest`
* **Objective:** Zero-cost deployment with live Over-The-Air updates.

1. **Vercel Hobby Tier**: Connected to `BROHUHA/Cabix` on GitHub for instant automatic deployments.
2. **Supabase Free Project**:
   - Direct connection via client library `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
   - Database secrets stored safely in Vercel environment variables.
3. **Local Hybrid Mode**: Includes mock fallback data so developers can inspect and test God Admin, Admin, User, and Guest flows offline without waiting for cloud credentials.

---

## 4. Immediate Next Step

Now that the blueprint is locked in `MODEL.md`:
1. Provide the specific question form fields and questions you want included.
2. Confirm if you want to initialize the local mock RBAC first (so you can immediately test God Admin $\leftrightarrow$ Secondary Admin $\leftrightarrow$ User $\leftrightarrow$ Guest switching on your screen).

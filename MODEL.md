# Cabix Elevator Engineering & Maintenance Architecture (MODEL.md)

This document defines the comprehensive architecture and implementation plan for **Cabix** — an **Elevator & Lift Engineering Lifecycle & Maintenance Management System**. It features an **Isolated Enterprise Administrative Portal (`/console`)**, a **Customer/Client WebAPK (`/`)**, **On-Site QR Code Generation & Camera Scanning**, **Component Lifecycle & Time Period Tracking**, **User Maintenance Requests**, and a **God Admin (Super Admin)** $\rightarrow$ **Secondary Admins** $\rightarrow$ **Users** $\rightarrow$ **Guest Mode** hierarchy running **100% on Free-Tier Cloud Infrastructure**.

---

## 1. System Topology & Dual-Portal Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CABIX SYSTEM ARCHITECTURE                                │
│                                                                                        │
│  [1] CLIENT & BUILDING RESIDENT APPLICATION (/)                                        │
│      • URL: https://your-domain.vercel.app/                                            │
│      • Target Audience: Building Owners, Facility Managers, Residents, Public Guests   │
│      • POV: Mobile-First PWA & Installable WebAPK                                      │
│      • Guest Mode: Browse lift services, maintenance packages & engineering specs     │
│      • Client Mode: Submit Lift Maintenance Requests via structured Question Form,     │
│                     view live service status (#CBX-REQ-xxxx) & history                 │
│                                                                                        │
│  [2] ENTERPRISE ENGINEERING CONSOLE (/console)                                        │
│      • URL: https://your-domain.vercel.app/console                                     │
│      • Target Audience: God Admin (Master Director) & Secondary Admins (Technicians)   │
│      • POV: High-contrast Command Center (Desktop / Tablet / Mobile Field Device)      │
│      • On-Site Camera QR Scanner: Instant field scanning of lift QR tags               │
│      • QR Code Generator: Generate printable QR codes for all lift units & machinery   │
│      • Liftwork & Component Lifecycle: View parts used, service age & lifespan alerts  │
│      • God Mode: Provision/revoke admins, manage building users, master audit logs     │
│      • Admin/Technician Mode: Process maintenance tickets, log liftwork & inspections  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. QR Code Engine & Field Operations Workflow

```
+----------------------------------------------------------------------------------------+
|                                  QR LIFECYCLE PIPELINE                                 |
|                                                                                        |
|  [1] GOD / ADMIN GENERATION (In /console)                                              |
|      Create Lift Unit ──> System Generates Unique QR Code [CBX-LIFT-XXXX]              |
|                           Printable SVG/PNG Sticker placed inside Elevator Machine Room|
|                           or Cabin Door Jamb                                           |
|                                                                                        |
|  [2] FIELD SCANNING (In /console on Mobile/Tablet)                                     |
|      Technician arrives at building ──> Opens /console Scanner ──> Scans Lift QR Tag   |
|                                                                                        |
|  [3] INSTANT LIFTWORK DASHBOARD DEEP LINK:                                             |
|      • Lift Details (Building, Model, Floors, Installation Date, Operating Status)     |
|      • Installed Components Inventory (Traction Motor, Inverter, Wire Ropes, etc.)     |
|      • Component Time Periods & Lifespans (Days active, Overdue replacement badges)    |
|      • Maintenance Requests Queue (Active tickets submitted by building users)         |
|      • Log New Liftwork Action (Record parts replaced, hours worked, test output)      |
+----------------------------------------------------------------------------------------+
```

---

## 3. Free-Tier Technology Stack (100% Free Tier, Zero Monthly Cost)

| Layer | Technology | Free Tier Capacity | Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend & PWA** | **Vite + Vanilla JS + CSS** | Unlimited / Local | SPA routing (`/` and `/console`), liquid-glass UI, zero framework bloat. |
| **QR Generation** | **Client-Side SVG QR Engine** | Unlimited / 100% Local | Pure JavaScript vector QR generator; zero API latency, works offline. |
| **QR Camera Scanner** | **HTML5 Camera + BarcodeDetector API** | Unlimited / Local Device | Real-time camera stream (`getUserMedia`), scanning on phone cameras. |
| **Hosting & CI/CD** | **Vercel (Hobby Tier)** | Unlimited deploys, 100GB bandwidth | Automatic Git build on commit (`BROHUHA/Cabix`), SSL, `/console` rewrite. |
| **Auth & Database** | **Supabase (Free Tier)** | 50,000 MAU, 500MB DB, 2 Projects | Postgres Database, Row-Level Security (RLS), Realtime WebSocket tickets. |
| **Local Fallback Engine** | **Structured LocalStorage / Mock DB** | Client-side 5MB | Instant offline testing of QR scanning, God Admin, and Lift units. |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Capabilities & Permissions | Guest Mode (`/`) | Client / User (`/`) | Secondary Admin (`/console`) | God Admin (`/console`) |
| :--- | :---: | :---: | :---: | :---: |
| Browse Lift Services & Capabilities | ✅ | ✅ | ✅ | ✅ |
| Submit Lift Maintenance Request (Question Form) | ❌ *(Prompts Login)* | ✅ | ✅ | ✅ |
| Track Status of Submitted Requests | ❌ | ✅ | ✅ | ✅ |
| Access Enterprise `/console` | ❌ *(Denied)* | ❌ *(Denied)* | ✅ | ✅ |
| Scan Lift QR Tag with Camera | ❌ | ❌ | ✅ | ✅ |
| Generate Printable Lift QR Codes | ❌ | ❌ | ❌ | ✅ |
| View Components Installed in Lift | ❌ | ❌ | ✅ | ✅ |
| Inspect Component Service Age & Lifespans | ❌ | ❌ | ✅ | ✅ |
| Log New Liftwork & Component Replacement | ❌ | ❌ | ✅ | ✅ |
| Update Maintenance Request Processing Status | ❌ | ❌ | ✅ | ✅ |
| Create, Edit & Delete Lift Units | ❌ | ❌ | ❌ | ✅ |
| Provision & Revoke Secondary Admins / Techs | ❌ | ❌ | ❌ | ✅ |
| View Master System Audit Logs | ❌ | ❌ | ❌ | ✅ |

---

## 5. Relational Data Models (Supabase + Local Mock Engine)

```
┌─────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│  lift_units     │◄──────│   lift_components    │       │ maintenance_requests │
│                 │1     *│                      │       │  (User Question Form)│
│ • id            │       │ • id                 │       │ • id                 │
│ • unit_code     │       │ • lift_id            │       │ • lift_id            │
│ • building_name │       │ • name (e.g. Motor)  │       │ • user_id            │
│ • model_type    │       │ • installed_date     │       │ • issue_category     │
│ • install_date  │       │ • expected_lifespan  │       │ • description        │
│ • qr_data       │       │ • current_status     │       │ • status (Pending..) │
└────────┬────────┘       └──────────────────────┘       └──────────┬───────────┘
         │1                                                         │*
         │*                                                         │
┌────────▼──────────────┐                                           │
│   liftwork_logs       │◄──────────────────────────────────────────┘
│                       │
│ • id                  │
│ • lift_id             │
│ • technician_id       │
│ • parts_replaced      │
│ • time_period_spent   │
│ • inspection_output   │
└───────────────────────┘
```

### Detailed Schema Entities:

1. **`lift_units`**:
   - `id`: UUID (Primary Key)
   - `unit_code`: Text (e.g., `"CBX-LIFT-101"`, `"EMPIRE-TOWER-L2"`)
   - `building_name`: Text (e.g., `"Grand Horizon Tower"`)
   - `location_address`: Text
   - `model_type`: Text (e.g., `"MRL Gearless Traction 2.5m/s"`, `"Hydraulic Freight"`)
   - `capacity_kg`: Integer (e.g., `1000`)
   - `install_date`: Date
   - `last_service_date`: Date
   - `status`: Enum (`'operational'`, `'maintenance_due'`, `'under_repair'`, `'out_of_service'`)
   - `qr_data`: Text (Unique QR payload URL)

2. **`lift_components`** (Parts used in liftwork):
   - `id`: UUID
   - `lift_id`: UUID (References `lift_units.id`)
   - `component_name`: Text (e.g., `"Traction Machine Motor"`, `"VVVF Inverter Drive"`, `"Hoist Steel Ropes"`, `"Door Operator"`, `"Safety Gear Assembly"`, `"Guide Shoes"`, `"Traveling Cable"`)
   - `serial_number`: Text
   - `installed_date`: Date
   - `lifespan_months`: Integer (e.g., `36` months)
   - `time_period_active`: Virtual/Calculated (Days / months elapsed since installation)
   - `status`: Enum (`'good'`, `'service_soon'`, `'overdue_replacement'`)
   - `manufacturer`: Text

3. **`maintenance_requests`** (User Question Form Submissions):
   - `id`: UUID
   - `lift_id`: UUID (Nullable, references `lift_units.id`)
   - `user_id`: UUID (References `profiles.id`)
   - `user_name`: Text
   - `building_name`: Text
   - `issue_category`: Enum (`'abnormal_noise'`, `'door_fault'`, `'leveling_error'`, `'emergency_stoppage'`, `'routine_maintenance'`, `'general_inquiry'`)
   - `questionnaire_answers`: JSONB (Answers to the detailed question form)
   - `priority`: Enum (`'normal'`, `'urgent'`, `'emergency'`)
   - `status`: Enum (`'pending'`, `'in_review'`, `'dispatched'`, `'resolved'`)
   - `created_at`: Timestamp

4. **`liftwork_logs`** (Technician Inspection & Service Records):
   - `id`: UUID
   - `lift_id`: UUID (References `lift_units.id`)
   - `request_id`: UUID (Nullable, references `maintenance_requests.id`)
   - `technician_id`: UUID (References `profiles.id`)
   - `service_date`: Timestamp
   - `time_period_hours`: Decimal (Hours spent on liftwork)
   - `components_replaced`: JSONB (Array of component IDs/names replaced)
   - `inspection_output`: Text (e.g., `"Brake clearance adjusted to 0.4mm. Rope tension normalized."`)
   - `safety_check_passed`: Boolean

---

## 6. Modular Implementation Status

```
+---------------------------------------------------------------------------------------+
|                               CABIX IMPLEMENTATION PHASES                             |
|                                                                                       |
|  [Module 1] Database & State Engine (Supabase Schema + Mock DB)       [DONE - COMPLETED]|
|  [Module 2] Dual Portal Router (/ vs /console) & URL Dispatcher       [DONE - COMPLETED]|
|  [Module 3] Client Portal (/) - Lift Status & Question Request Form   [DONE - COMPLETED]|
|  [Module 4] Enterprise Console (/console) - High-Security God/Admin   [DONE - COMPLETED]|
|  [Module 5] Camera QR Code Scanner & Instant Lift Profile Resolver    [DONE - COMPLETED]|
|  [Module 6] QR Code Generator (SVG Printable Badges)                  [DONE - COMPLETED]|
|  [Module 7] Liftwork Component Lifecycle (Time Periods & Lifespans)   [DONE - COMPLETED]|
|  [Module 8] Maintenance Request Management Queue & Ticket Dispatch    [DONE - COMPLETED]|
|  [Module 9] God Admin Master Team Provisioning & Audit Trail          [DONE - COMPLETED]|
|  [Module 10] Free-Tier Deployment & Live PWA WebAPK OTA Updates       [DONE - READY]    |
+---------------------------------------------------------------------------------------+
```

---

## 7. Operational Portals & Testing Access

The application runs locally on `http://localhost:5173/` and is ready for manual testing or Vercel production deployment:

1. **Client Mobile WebAPK Portal (`http://localhost:5173/`):**
   - **Credentials:** `user@cabix.app` / `user123` or 1-tap **"Browse Services as Guest"**.
   - **Features:** 
     - Live Facility monitoring for **Grand Horizon Tower**.
     - Building Lift Unit cards (`CBX-LIFT-101`, `102`, `103`) with specifications.
     - **Structured Maintenance Question Form Modal**: Select elevator unit, choose issue category (Noise, Door, Leveling, Stoppage, Routine), answer questionnaire (Location, Frequency, Ride Impact), toggle priority dispatch, and submit.
     - **My Inquiries & Tickets**: Live ticket badge (`#CBX-REQ-xxxx`), real-time status pill (`Pending`, `In Review`, `Tech Dispatched`), and technician notes.
     - **Engineering Services Catalog**: Preventative maintenance, modernization, QR lifecycle audit, and emergency entrapment rescue.
     - **Guest Intercept Modal**: Intercepts guest actions when attempting to submit requests or connect with engineers.

2. **Enterprise Engineering Console (`http://localhost:5173/#console` or `/console`):**
   - **God Admin:** `god@cabix.app` / `god1234` (Full authority: Provision/revoke admins, lift management, audit trail).
   - **Tech Lead Admin:** `admin@cabix.app` / `admin123` (Field authority: QR scanner, component inspection, ticket dispatcher).
   - **Features:**
     - Real-time HTML5 Camera QR Scanner & manual unit resolver.
     - Component Lifecycle Inspector tracking active operating time periods (days/months) and replacement warnings.
     - Inquiries Queue managing tickets submitted by users from `/`.
     - God Admin Team Provisioner & Audit Log.
     - Printable SVG Vector QR Badge Generator.

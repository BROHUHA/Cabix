-- ============================================================================
-- CABIX ELEVATOR & LIFT ENGINEERING DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL (100% Free Tier)
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('god_admin', 'admin', 'user');
CREATE TYPE lift_status AS ENUM ('operational', 'maintenance_due', 'under_repair', 'out_of_service');
CREATE TYPE component_status AS ENUM ('good', 'service_soon', 'overdue_replacement');
CREATE TYPE request_priority AS ENUM ('normal', 'urgent', 'emergency');
CREATE TYPE request_status AS ENUM ('pending', 'in_review', 'dispatched', 'resolved', 'cancelled');
CREATE TYPE issue_category AS ENUM (
  'abnormal_noise',
  'door_fault',
  'leveling_error',
  'emergency_stoppage',
  'cabin_lighting_fan',
  'routine_maintenance',
  'general_inquiry'
);

-- 3. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name VARCHAR(10) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  permissions JSONB DEFAULT '{"can_reply_inquiries": true, "can_log_liftwork": true, "can_manage_lifts": false}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LIFT UNITS TABLE
CREATE TABLE IF NOT EXISTS public.lift_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'CBX-LIFT-101'
  building_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  model_type TEXT NOT NULL, -- e.g. 'MRL Gearless Traction 2.5 m/s'
  capacity_kg INT NOT NULL DEFAULT 1000,
  max_persons INT NOT NULL DEFAULT 13,
  floors_served INT NOT NULL DEFAULT 12,
  install_date DATE NOT NULL,
  last_service_date DATE NOT NULL,
  status lift_status NOT NULL DEFAULT 'operational',
  qr_data TEXT NOT NULL, -- Payload URL or deep-link code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LIFT COMPONENTS TABLE (Parts used in liftwork & lifecycle tracking)
CREATE TABLE IF NOT EXISTS public.lift_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lift_id UUID NOT NULL REFERENCES public.lift_units(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL, -- e.g. 'Traction Motor', 'VVVF Inverter Drive', 'Hoist Steel Ropes'
  serial_number TEXT,
  installed_date DATE NOT NULL,
  lifespan_months INT NOT NULL DEFAULT 36,
  status component_status NOT NULL DEFAULT 'good',
  manufacturer TEXT,
  specification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MAINTENANCE REQUESTS TABLE (Client Question Form Submissions)
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(16) NOT NULL UNIQUE, -- e.g. 'CBX-REQ-8491'
  lift_id UUID REFERENCES public.lift_units(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  building_name TEXT NOT NULL,
  issue_category issue_category NOT NULL DEFAULT 'routine_maintenance',
  questionnaire_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT NOT NULL,
  priority request_priority NOT NULL DEFAULT 'normal',
  status request_status NOT NULL DEFAULT 'pending',
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LIFTWORK LOGS TABLE (Technician Maintenance Records & Parts Replacement)
CREATE TABLE IF NOT EXISTS public.liftwork_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lift_id UUID NOT NULL REFERENCES public.lift_units(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  technician_name TEXT NOT NULL,
  service_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_period_hours NUMERIC(4, 1) NOT NULL DEFAULT 2.0,
  components_replaced JSONB DEFAULT '[]'::jsonb,
  inspection_output TEXT NOT NULL, -- Output metrics & adjustments made
  safety_check_passed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SYSTEM AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role user_role NOT NULL,
  action_type TEXT NOT NULL, -- e.g. 'ADMIN_CREATED', 'LIFT_CREATED', 'TICKET_STATUS_CHANGED'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lift_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lift_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liftwork_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get authenticated user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: God Admin can do anything; Users can read own profile
CREATE POLICY "God Admin full access to profiles" ON public.profiles
  FOR ALL USING (public.get_current_role() = 'god_admin');

CREATE POLICY "Admins can view profiles" ON public.profiles
  FOR SELECT USING (public.get_current_role() IN ('admin', 'god_admin'));

CREATE POLICY "Users can view and update own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Lift Units: Public/Users can view; Admins/God Admin can manage
CREATE POLICY "Anyone can view lift units" ON public.lift_units
  FOR SELECT USING (true);

CREATE POLICY "God Admin full control on lifts" ON public.lift_units
  FOR ALL USING (public.get_current_role() = 'god_admin');

CREATE POLICY "Admins can update lift status" ON public.lift_units
  FOR UPDATE USING (public.get_current_role() IN ('admin', 'god_admin'));

-- Lift Components: Public can view; Admins and God Admin can manage
CREATE POLICY "Anyone can read components" ON public.lift_components
  FOR SELECT USING (true);

CREATE POLICY "Admins & God Admin manage components" ON public.lift_components
  FOR ALL USING (public.get_current_role() IN ('admin', 'god_admin'));

-- Maintenance Requests:
-- Users can view their own requests and create new ones.
-- Admins and God Admin can view and update all requests.
CREATE POLICY "Users view own requests" ON public.maintenance_requests
  FOR SELECT USING (auth.uid() = user_id OR public.get_current_role() IN ('admin', 'god_admin'));

CREATE POLICY "Authenticated users can submit requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins and God Admin update requests" ON public.maintenance_requests
  FOR UPDATE USING (public.get_current_role() IN ('admin', 'god_admin'));

-- Liftwork Logs:
CREATE POLICY "Anyone can view liftwork history" ON public.liftwork_logs
  FOR SELECT USING (true);

CREATE POLICY "Admins & God Admin create liftwork logs" ON public.liftwork_logs
  FOR INSERT WITH CHECK (public.get_current_role() IN ('admin', 'god_admin'));

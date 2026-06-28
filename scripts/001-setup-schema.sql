-- TrialBridge AI schema for Amazon Aurora PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE criterion_type AS ENUM ('inclusion', 'exclusion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('likely_eligible', 'possibly_eligible', 'not_eligible');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE criterion_result AS ENUM ('met', 'missing', 'failed', 'triggered_exclusion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('new', 'needs_review', 'contact_pending', 'referred_to_pi', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  condition TEXT NOT NULL,
  phase TEXT NOT NULL,
  location TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trial_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  type criterion_type NOT NULL,
  field TEXT NOT NULL,
  operator TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trial_criteria_trial_id ON trial_criteria(trial_id);

CREATE TABLE IF NOT EXISTS synthetic_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  summary TEXT NOT NULL,
  attributes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES synthetic_patients(id) ON DELETE CASCADE,
  lab_name TEXT NOT NULL,
  lab_value TEXT NOT NULL,
  unit TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_patient_labs_patient_id ON patient_labs(patient_id);

CREATE TABLE IF NOT EXISTS trial_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES synthetic_patients(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  status match_status NOT NULL,
  score REAL NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trial_matches_patient_id ON trial_matches(patient_id);
CREATE INDEX IF NOT EXISTS idx_trial_matches_trial_id ON trial_matches(trial_id);

CREATE TABLE IF NOT EXISTS match_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES trial_matches(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES trial_criteria(id) ON DELETE CASCADE,
  result criterion_result NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_match_explanations_match_id ON match_explanations(match_id);
CREATE INDEX IF NOT EXISTS idx_match_explanations_criterion_id ON match_explanations(criterion_id);

CREATE TABLE IF NOT EXISTS coordinator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES trial_matches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'new',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_match_id ON coordinator_tasks(match_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

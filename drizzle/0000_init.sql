CREATE TYPE "public"."criterion_type" AS ENUM('inclusion', 'exclusion');
CREATE TYPE "public"."match_status" AS ENUM('likely_eligible', 'possibly_eligible', 'not_eligible');
CREATE TYPE "public"."criterion_result" AS ENUM('met', 'missing', 'failed', 'triggered_exclusion');
CREATE TYPE "public"."task_status" AS ENUM('new', 'needs_review', 'contact_pending', 'referred_to_pi', 'closed');
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "condition" text NOT NULL,
  "phase" text NOT NULL,
  "location" text NOT NULL,
  "sponsor" text NOT NULL,
  "status" text NOT NULL,
  "summary" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "trial_criteria" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trial_id" uuid NOT NULL REFERENCES "trials"("id") ON DELETE CASCADE,
  "type" "criterion_type" NOT NULL,
  "field" text NOT NULL,
  "operator" text NOT NULL,
  "value" text NOT NULL,
  "description" text NOT NULL,
  "weight" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "synthetic_patients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_code" text NOT NULL UNIQUE,
  "age" integer NOT NULL,
  "sex" text NOT NULL,
  "condition" text NOT NULL,
  "location" text NOT NULL,
  "summary" text NOT NULL,
  "attributes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "patient_labs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "synthetic_patients"("id") ON DELETE CASCADE,
  "lab_name" text NOT NULL,
  "lab_value" text NOT NULL,
  "unit" text NOT NULL,
  "collected_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "trial_matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "synthetic_patients"("id") ON DELETE CASCADE,
  "trial_id" uuid NOT NULL REFERENCES "trials"("id") ON DELETE CASCADE,
  "status" "match_status" NOT NULL,
  "score" real NOT NULL,
  "explanation" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_explanations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "trial_matches"("id") ON DELETE CASCADE,
  "criterion_id" uuid NOT NULL REFERENCES "trial_criteria"("id") ON DELETE CASCADE,
  "result" "criterion_result" NOT NULL,
  "explanation" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coordinator_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "trial_matches"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "status" "task_status" DEFAULT 'new' NOT NULL,
  "priority" "task_priority" DEFAULT 'medium' NOT NULL,
  "assigned_to" text,
  "due_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor" text NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "details" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

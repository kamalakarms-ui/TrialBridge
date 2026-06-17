import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const criterionTypeEnum = pgEnum("criterion_type", [
  "inclusion",
  "exclusion",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "likely_eligible",
  "possibly_eligible",
  "not_eligible",
]);
export const criterionResultEnum = pgEnum("criterion_result", [
  "met",
  "missing",
  "failed",
  "triggered_exclusion",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "new",
  "needs_review",
  "contact_pending",
  "referred_to_pi",
  "closed",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const trials = pgTable("trials", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  condition: text("condition").notNull(),
  phase: text("phase").notNull(),
  location: text("location").notNull(),
  sponsor: text("sponsor").notNull(),
  status: text("status").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const trialCriteria = pgTable("trial_criteria", {
  id: uuid("id").primaryKey().defaultRandom(),
  trialId: uuid("trial_id")
    .notNull()
    .references(() => trials.id, { onDelete: "cascade" }),
  type: criterionTypeEnum("type").notNull(),
  field: text("field").notNull(),
  operator: text("operator").notNull(),
  value: text("value").notNull(),
  description: text("description").notNull(),
  weight: integer("weight").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const syntheticPatients = pgTable("synthetic_patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientCode: text("patient_code").notNull().unique(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  condition: text("condition").notNull(),
  location: text("location").notNull(),
  summary: text("summary").notNull(),
  attributes: text("attributes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const patientLabs = pgTable("patient_labs", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => syntheticPatients.id, { onDelete: "cascade" }),
  labName: text("lab_name").notNull(),
  labValue: text("lab_value").notNull(),
  unit: text("unit").notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true }).notNull(),
});

export const trialMatches = pgTable("trial_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => syntheticPatients.id, { onDelete: "cascade" }),
  trialId: uuid("trial_id")
    .notNull()
    .references(() => trials.id, { onDelete: "cascade" }),
  status: matchStatusEnum("status").notNull(),
  score: real("score").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const matchExplanations = pgTable("match_explanations", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => trialMatches.id, { onDelete: "cascade" }),
  criterionId: uuid("criterion_id")
    .notNull()
    .references(() => trialCriteria.id, { onDelete: "cascade" }),
  result: criterionResultEnum("result").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const coordinatorTasks = pgTable("coordinator_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => trialMatches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: taskStatusEnum("status").notNull().default("new"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assignedTo: text("assigned_to"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const trialsRelations = relations(trials, ({ many }) => ({
  criteria: many(trialCriteria),
  matches: many(trialMatches),
}));

export const trialCriteriaRelations = relations(trialCriteria, ({ one }) => ({
  trial: one(trials, {
    fields: [trialCriteria.trialId],
    references: [trials.id],
  }),
}));

export const syntheticPatientsRelations = relations(
  syntheticPatients,
  ({ many }) => ({
    labs: many(patientLabs),
    matches: many(trialMatches),
  }),
);

export const patientLabsRelations = relations(patientLabs, ({ one }) => ({
  patient: one(syntheticPatients, {
    fields: [patientLabs.patientId],
    references: [syntheticPatients.id],
  }),
}));

export const trialMatchesRelations = relations(trialMatches, ({ one, many }) => ({
  patient: one(syntheticPatients, {
    fields: [trialMatches.patientId],
    references: [syntheticPatients.id],
  }),
  trial: one(trials, {
    fields: [trialMatches.trialId],
    references: [trials.id],
  }),
  explanations: many(matchExplanations),
  tasks: many(coordinatorTasks),
}));

export const matchExplanationsRelations = relations(
  matchExplanations,
  ({ one }) => ({
    match: one(trialMatches, {
      fields: [matchExplanations.matchId],
      references: [trialMatches.id],
    }),
    criterion: one(trialCriteria, {
      fields: [matchExplanations.criterionId],
      references: [trialCriteria.id],
    }),
  }),
);

export const coordinatorTasksRelations = relations(
  coordinatorTasks,
  ({ one }) => ({
    match: one(trialMatches, {
      fields: [coordinatorTasks.matchId],
      references: [trialMatches.id],
    }),
  }),
);

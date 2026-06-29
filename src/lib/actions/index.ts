"use server";

import { db } from "@/db";
import {
  trials,
  trialCriteria,
  syntheticPatients,
  patientLabs,
  trialMatches,
  matchExplanations,
  coordinatorTasks,
  auditEvents,
  users,
} from "@/db/schema";
import { eq, desc, count, sql, and } from "drizzle-orm";
import {
  runMatchingEngine,
  parsePatientAttributes,
  type PatientProfile,
  type Criterion,
} from "@/lib/matching/engine";
import { revalidatePath as nextRevalidatePath } from "next/cache";

function revalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch {
    // No-op outside Next.js request context (e.g. scripts/tests)
  }
}

const DEMO_ACTOR = "Dr. Sarah Chen (Demo Coordinator)";

async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  details: string,
) {
  await db.insert(auditEvents).values({
    actor: DEMO_ACTOR,
    action,
    entityType,
    entityId,
    details,
  });
}

function buildPatientProfile(
  patient: typeof syntheticPatients.$inferSelect,
  labs: (typeof patientLabs.$inferSelect)[],
): PatientProfile {
  const labMap: Record<string, { value: string; unit: string }> = {};
  for (const lab of labs) {
    labMap[lab.labName] = { value: lab.labValue, unit: lab.unit };
  }

  return {
    id: patient.id,
    patientCode: patient.patientCode,
    age: patient.age,
    sex: patient.sex,
    condition: patient.condition,
    location: patient.location,
    summary: patient.summary,
    attributes: parsePatientAttributes(patient.attributes),
    labs: labMap,
  };
}

export async function listTrials() {
  const allTrials = await db.select().from(trials).orderBy(desc(trials.createdAt));

  const criteriaCounts = await db
    .select({
      trialId: trialCriteria.trialId,
      type: trialCriteria.type,
      count: count(),
    })
    .from(trialCriteria)
    .groupBy(trialCriteria.trialId, trialCriteria.type);

  return allTrials.map((trial) => {
    const inclusion = criteriaCounts.find(
      (c) => c.trialId === trial.id && c.type === "inclusion",
    );
    const exclusion = criteriaCounts.find(
      (c) => c.trialId === trial.id && c.type === "exclusion",
    );
    return {
      ...trial,
      inclusionCount: inclusion?.count ?? 0,
      exclusionCount: exclusion?.count ?? 0,
    };
  });
}

export async function getTrial(id: string) {
  const [trial] = await db.select().from(trials).where(eq(trials.id, id));
  if (!trial) return null;

  const criteria = await db
    .select()
    .from(trialCriteria)
    .where(eq(trialCriteria.trialId, id))
    .orderBy(trialCriteria.type, trialCriteria.field);

  const matches = await db
    .select({
      match: trialMatches,
      patientCode: syntheticPatients.patientCode,
      patientId: syntheticPatients.id,
    })
    .from(trialMatches)
    .innerJoin(
      syntheticPatients,
      eq(trialMatches.patientId, syntheticPatients.id),
    )
    .where(eq(trialMatches.trialId, id))
    .orderBy(desc(trialMatches.score));

  return { trial, criteria, matches };
}

export async function listPatients() {
  const patients = await db
    .select()
    .from(syntheticPatients)
    .orderBy(syntheticPatients.patientCode);

  const allLabs = await db.select().from(patientLabs);
  const allMatches = await db.select().from(trialMatches);

  return patients.map((patient) => {
    const labs = allLabs.filter((l) => l.patientId === patient.id);
    const attrs = parsePatientAttributes(patient.attributes);
    const knownFields = new Set([
      "age",
      "sex",
      "condition",
      "location",
      ...Object.keys(attrs),
      ...labs.map((l) => l.labName.toLowerCase()),
    ]);

    const requiredFields = [
      "age",
      "sex",
      "condition",
      "alt",
      "crp",
      "prior_medication",
      "egfr",
      "hba1c",
    ];
    const missingFields = requiredFields.filter(
      (f) => !knownFields.has(f.toLowerCase()),
    );

    return {
      ...patient,
      keyLabs: labs.slice(0, 3).map((l) => `${l.labName}: ${l.labValue} ${l.unit}`),
      missingFields,
      matchCount: allMatches.filter((m) => m.patientId === patient.id).length,
    };
  });
}

export async function getPatient(id: string) {
  const [patient] = await db
    .select()
    .from(syntheticPatients)
    .where(eq(syntheticPatients.id, id));
  if (!patient) return null;

  const labs = await db
    .select()
    .from(patientLabs)
    .where(eq(patientLabs.patientId, id))
    .orderBy(desc(patientLabs.collectedAt));

  const matches = await db
    .select({
      match: trialMatches,
      trialTitle: trials.title,
      trialCondition: trials.condition,
    })
    .from(trialMatches)
    .innerJoin(trials, eq(trialMatches.trialId, trials.id))
    .where(eq(trialMatches.patientId, id))
    .orderBy(desc(trialMatches.score));

  return {
    patient,
    labs,
    attributes: parsePatientAttributes(patient.attributes),
    matches,
  };
}

export async function runMatchAnalysis(patientId: string) {
  const [patient] = await db
    .select()
    .from(syntheticPatients)
    .where(eq(syntheticPatients.id, patientId));
  if (!patient) throw new Error("Patient not found");

  const labs = await db
    .select()
    .from(patientLabs)
    .where(eq(patientLabs.patientId, patientId));

  const allTrials = await db.select().from(trials);
  const profile = buildPatientProfile(patient, labs);
  const results = [];

  for (const trial of allTrials) {
    const criteria = await db
      .select()
      .from(trialCriteria)
      .where(eq(trialCriteria.trialId, trial.id));

    const criterionInputs: Criterion[] = criteria.map((c) => ({
      id: c.id,
      type: c.type,
      field: c.field,
      operator: c.operator,
      value: c.value,
      description: c.description,
      weight: c.weight,
    }));

    const result = runMatchingEngine(
      profile,
      trial.id,
      trial.title,
      criterionInputs,
    );

    await db
      .delete(trialMatches)
      .where(
        and(
          eq(trialMatches.patientId, patientId),
          eq(trialMatches.trialId, trial.id),
        ),
      );

    const [match] = await db
      .insert(trialMatches)
      .values({
        patientId,
        trialId: trial.id,
        status: result.status,
        score: result.score,
        explanation: result.explanation,
      })
      .returning();

    await db
      .delete(matchExplanations)
      .where(eq(matchExplanations.matchId, match.id));

    if (result.evaluations.length > 0) {
      await db.insert(matchExplanations).values(
        result.evaluations.map((e) => ({
          matchId: match.id,
          criterionId: e.criterionId,
          result: e.result,
          explanation: e.explanation,
        })),
      );
    }

    results.push({ ...result, matchId: match.id, trialTitle: trial.title });
  }

  await logAudit(
    "match_analysis_run",
    "patient",
    patientId,
    `Ran trial match analysis for synthetic patient ${patient.patientCode}. ${results.length} trials evaluated.`,
  );

  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/patients/${patientId}/matches`);
  revalidatePath("/dashboard");

  return results;
}

export async function getMatchDetails(matchId: string) {
  const [match] = await db
    .select({
      match: trialMatches,
      patientCode: syntheticPatients.patientCode,
      trialTitle: trials.title,
      trialId: trials.id,
    })
    .from(trialMatches)
    .innerJoin(
      syntheticPatients,
      eq(trialMatches.patientId, syntheticPatients.id),
    )
    .innerJoin(trials, eq(trialMatches.trialId, trials.id))
    .where(eq(trialMatches.id, matchId));

  if (!match) return null;

  const explanations = await db
    .select({
      explanation: matchExplanations,
      criterion: trialCriteria,
    })
    .from(matchExplanations)
    .innerJoin(
      trialCriteria,
      eq(matchExplanations.criterionId, trialCriteria.id),
    )
    .where(eq(matchExplanations.matchId, matchId));

  return { ...match, explanations };
}

export async function getPatientMatches(patientId: string) {
  const matches = await db
    .select({
      match: trialMatches,
      trialTitle: trials.title,
      trialCondition: trials.condition,
      trialPhase: trials.phase,
    })
    .from(trialMatches)
    .innerJoin(trials, eq(trialMatches.trialId, trials.id))
    .where(eq(trialMatches.patientId, patientId))
    .orderBy(desc(trialMatches.score));

  const withExplanations = await Promise.all(
    matches.map(async (m) => {
      const explanations = await db
        .select({
          explanation: matchExplanations,
          criterion: trialCriteria,
        })
        .from(matchExplanations)
        .innerJoin(
          trialCriteria,
          eq(matchExplanations.criterionId, trialCriteria.id),
        )
        .where(eq(matchExplanations.matchId, m.match.id));

      const inclusionMet = explanations.filter(
        (e) =>
          e.criterion.type === "inclusion" && e.explanation.result === "met",
      ).length;
      const exclusionTriggered = explanations.filter(
        (e) => e.explanation.result === "triggered_exclusion",
      ).length;
      const missingData = explanations.filter(
        (e) => e.explanation.result === "missing",
      ).length;

      return {
        ...m,
        explanations,
        inclusionMet,
        exclusionTriggered,
        missingData,
      };
    }),
  );

  return withExplanations;
}

export async function createTask(
  matchId: string,
  fields: {
    title: string;
    description: string;
    status?: "new" | "needs_review" | "contact_pending" | "referred_to_pi" | "closed";
    priority?: "low" | "medium" | "high";
    assignedTo?: string;
    dueDate?: string;
  },
) {
  const [task] = await db
    .insert(coordinatorTasks)
    .values({
      matchId,
      title: fields.title,
      description: fields.description,
      status: fields.status ?? "new",
      priority: fields.priority ?? "medium",
      assignedTo: fields.assignedTo ?? null,
      dueDate: fields.dueDate ? new Date(fields.dueDate) : null,
    })
    .returning();

  const matchDetails = await getMatchDetails(matchId);

  await logAudit(
    "task_created",
    "task",
    task.id,
    `Created coordinator task "${fields.title}" for match involving patient ${matchDetails?.patientCode ?? "unknown"} and trial ${matchDetails?.trialTitle ?? "unknown"}.`,
  );

  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return task;
}

export async function listTasks() {
  return db
    .select({
      task: coordinatorTasks,
      patientCode: syntheticPatients.patientCode,
      trialTitle: trials.title,
      matchStatus: trialMatches.status,
      matchScore: trialMatches.score,
    })
    .from(coordinatorTasks)
    .innerJoin(trialMatches, eq(coordinatorTasks.matchId, trialMatches.id))
    .innerJoin(
      syntheticPatients,
      eq(trialMatches.patientId, syntheticPatients.id),
    )
    .innerJoin(trials, eq(trialMatches.trialId, trials.id))
    .orderBy(desc(coordinatorTasks.createdAt));
}

export async function updateTask(
  taskId: string,
  fields: {
    title?: string;
    description?: string;
    status?: "new" | "needs_review" | "contact_pending" | "referred_to_pi" | "closed";
    priority?: "low" | "medium" | "high";
    assignedTo?: string;
    dueDate?: string | null;
  },
) {
  const [task] = await db
    .update(coordinatorTasks)
    .set({
      ...fields,
      dueDate:
        fields.dueDate === null
          ? null
          : fields.dueDate
            ? new Date(fields.dueDate)
            : undefined,
    })
    .where(eq(coordinatorTasks.id, taskId))
    .returning();

  await logAudit(
    "task_updated",
    "task",
    taskId,
    `Updated task "${task.title}" to status ${task.status}.`,
  );

  revalidatePath("/tasks");
  return task;
}

export async function createTasksFromMatches(patientId: string) {
  const matches = await getPatientMatches(patientId);
  const eligibleMatches = matches.filter(
    (m) =>
      m.match.status === "likely_eligible" ||
      m.match.status === "possibly_eligible",
  );

  const created = [];
  for (const m of eligibleMatches) {
    const [task] = await db
      .insert(coordinatorTasks)
      .values({
        matchId: m.match.id,
        title: `Review match: ${m.trialTitle}`,
        description: `Coordinator review required for synthetic patient match (score: ${m.match.score}). ${m.match.explanation}`,
        status: m.match.status === "likely_eligible" ? "needs_review" : "new",
        priority: m.match.score >= 80 ? "high" : "medium",
        assignedTo: DEMO_ACTOR,
      })
      .returning();
    created.push(task);
  }

  await logAudit(
    "bulk_tasks_created",
    "patient",
    patientId,
    `Created ${created.length} coordinator tasks from match analysis results.`,
  );

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return created;
}

export async function listAuditEvents() {
  return db
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.createdAt))
    .limit(100);
}

export async function getDashboardMetrics() {
  const [trialCount] = await db.select({ count: count() }).from(trials);
  const [patientCount] = await db
    .select({ count: count() })
    .from(syntheticPatients);
  const [matchCount] = await db
    .select({ count: count() })
    .from(trialMatches)
    .where(
      sql`${trialMatches.status} IN ('likely_eligible', 'possibly_eligible')`,
    );
  const [missingCount] = await db
    .select({ count: count() })
    .from(trialMatches)
    .where(eq(trialMatches.status, "possibly_eligible"));

  const recentMatches = await db
    .select({
      match: trialMatches,
      patientId: syntheticPatients.id,
      patientCode: syntheticPatients.patientCode,
      trialTitle: trials.title,
    })
    .from(trialMatches)
    .innerJoin(
      syntheticPatients,
      eq(trialMatches.patientId, syntheticPatients.id),
    )
    .innerJoin(trials, eq(trialMatches.trialId, trials.id))
    .orderBy(desc(trialMatches.createdAt))
    .limit(5);

  const recentTasks = await listTasks();

  return {
    activeTrials: trialCount.count,
    patientsScreened: patientCount.count,
    potentialMatches: matchCount.count,
    missingDataCases: missingCount.count,
    recentMatches,
    recentTasks: recentTasks.slice(0, 5),
  };
}

export async function getDemoUsers() {
  return db.select().from(users).limit(5);
}

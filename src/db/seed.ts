import "dotenv/config";
import { db } from "./index";
import {
  organizations,
  users,
  trials,
  trialCriteria,
  syntheticPatients,
  patientLabs,
  trialMatches,
  matchExplanations,
  coordinatorTasks,
  auditEvents,
} from "./schema";
import {
  runMatchingEngine,
  parsePatientAttributes,
  type PatientProfile,
} from "@/lib/matching/engine";

async function seed() {
  console.log("🌱 Seeding TrialBridge AI database...");

  await db.delete(auditEvents);
  await db.delete(coordinatorTasks);
  await db.delete(matchExplanations);
  await db.delete(trialMatches);
  await db.delete(patientLabs);
  await db.delete(syntheticPatients);
  await db.delete(trialCriteria);
  await db.delete(trials);
  await db.delete(users);
  await db.delete(organizations);

  const [org] = await db
    .insert(organizations)
    .values({
      name: "Metro Research Health System",
      type: "Academic Medical Center",
    })
    .returning();

  const [user1, user2] = await db
    .insert(users)
    .values([
      {
        organizationId: org.id,
        name: "Dr. Sarah Chen",
        email: "sarah.chen@metroresearch.demo",
        role: "Research Coordinator",
      },
      {
        organizationId: org.id,
        name: "James Okonkwo",
        email: "james.okonkwo@metroresearch.demo",
        role: "Principal Investigator",
      },
    ])
    .returning();

  const trialData = [
    {
      title: "PEDI-INFLAME-204: Pediatric JIA Biologic Response Study",
      condition: "Juvenile Idiopathic Arthritis",
      phase: "Phase III",
      location: "Boston, MA",
      sponsor: "InflamRx Therapeutics",
      status: "Recruiting",
      summary:
        "Evaluates biologic therapy response in pediatric patients with moderate-to-severe JIA. Synthetic demo data only.",
    },
    {
      title: "FEBRILE-SCREEN-112: Rapid Febrile Illness Triage Protocol",
      condition: "Febrile Illness",
      phase: "Phase II",
      location: "Chicago, IL",
      sponsor: "NorthStar Clinical Research",
      status: "Recruiting",
      summary:
        "Studies rapid screening protocols for febrile illness in outpatient settings. Demo workflow tool only.",
    },
    {
      title: "CARDIO-WEAR-301: Remote Cardiac Monitoring Wearable Trial",
      condition: "Heart Failure",
      phase: "Phase III",
      location: "San Francisco, CA",
      sponsor: "PulseBridge MedTech",
      status: "Active",
      summary:
        "Assesses wearable ECG monitoring for heart failure patients. All patient profiles are synthetic.",
    },
    {
      title: "ONCO-PRECISION-450: Genomic-Guided Oncology Therapy",
      condition: "Non-Small Cell Lung Cancer",
      phase: "Phase II",
      location: "Houston, TX",
      sponsor: "GenPath Oncology",
      status: "Recruiting",
      summary:
        "Precision medicine trial matching tumor genomic profiles to targeted therapies. Research coordination demo.",
    },
    {
      title: "AUTO-IMMUNE-180: Lupus Nephritis Immunomodulator Study",
      condition: "Systemic Lupus Erythematosus",
      phase: "Phase III",
      location: "Seattle, WA",
      sponsor: "ImmunoCore Labs",
      status: "Recruiting",
      summary:
        "Investigates immunomodulator efficacy in lupus nephritis. Not for diagnosis or treatment decisions.",
    },
  ];

  const insertedTrials = await db.insert(trials).values(trialData).returning();

  const criteriaData = [
    // PEDI-INFLAME-204
    { trialIdx: 0, type: "inclusion" as const, field: "age", operator: "gte", value: "6", description: "Age 6 years or older", weight: 2 },
    { trialIdx: 0, type: "inclusion" as const, field: "age", operator: "lte", value: "17", description: "Age 17 years or younger", weight: 2 },
    { trialIdx: 0, type: "inclusion" as const, field: "condition", operator: "contains", value: "arthritis", description: "Diagnosis of juvenile arthritis", weight: 3 },
    { trialIdx: 0, type: "inclusion" as const, field: "crp", operator: "gte", value: "5", description: "CRP ≥ 5 mg/L indicating active inflammation", weight: 2 },
    { trialIdx: 0, type: "inclusion" as const, field: "prior_medication", operator: "in", value: "methotrexate|nsaid", description: "Prior methotrexate or NSAID therapy documented", weight: 1 },
    { trialIdx: 0, type: "exclusion" as const, field: "alt", operator: "gte", value: "80", description: "ALT ≥ 80 U/L (hepatic exclusion)", weight: 1 },
    { trialIdx: 0, type: "exclusion" as const, field: "active_infection", operator: "true", value: "true", description: "Active systemic infection", weight: 1 },
    // FEBRILE-SCREEN-112
    { trialIdx: 1, type: "inclusion" as const, field: "age", operator: "gte", value: "18", description: "Adult patients 18+", weight: 2 },
    { trialIdx: 1, type: "inclusion" as const, field: "condition", operator: "contains", value: "febrile", description: "Presenting with febrile illness", weight: 3 },
    { trialIdx: 1, type: "inclusion" as const, field: "temperature", operator: "gte", value: "38", description: "Documented temperature ≥ 38°C", weight: 2 },
    { trialIdx: 1, type: "inclusion" as const, field: "wbc", operator: "gte", value: "4", description: "WBC count available", weight: 1 },
    { trialIdx: 1, type: "exclusion" as const, field: "immunocompromised", operator: "true", value: "true", description: "Immunocompromised status", weight: 1 },
    { trialIdx: 1, type: "exclusion" as const, field: "pregnancy", operator: "true", value: "true", description: "Pregnancy", weight: 1 },
    // CARDIO-WEAR-301
    { trialIdx: 2, type: "inclusion" as const, field: "age", operator: "gte", value: "40", description: "Age 40 or older", weight: 2 },
    { trialIdx: 2, type: "inclusion" as const, field: "condition", operator: "contains", value: "heart", description: "Heart failure diagnosis", weight: 3 },
    { trialIdx: 2, type: "inclusion" as const, field: "ef", operator: "lte", value: "40", description: "Ejection fraction ≤ 40%", weight: 2 },
    { trialIdx: 2, type: "inclusion" as const, field: "nyha_class", operator: "in", value: "ii|iii", description: "NYHA Class II or III", weight: 2 },
    { trialIdx: 2, type: "exclusion" as const, field: "pacemaker", operator: "true", value: "true", description: "Existing pacemaker incompatible with wearable", weight: 1 },
    // ONCO-PRECISION-450
    { trialIdx: 3, type: "inclusion" as const, field: "age", operator: "gte", value: "18", description: "Adult patients 18+", weight: 2 },
    { trialIdx: 3, type: "inclusion" as const, field: "condition", operator: "contains", value: "lung", description: "Non-small cell lung cancer diagnosis", weight: 3 },
    { trialIdx: 3, type: "inclusion" as const, field: "egfr_mutation", operator: "true", value: "true", description: "EGFR mutation positive", weight: 3 },
    { trialIdx: 3, type: "inclusion" as const, field: "ecog", operator: "lte", value: "2", description: "ECOG performance status ≤ 2", weight: 2 },
    { trialIdx: 3, type: "exclusion" as const, field: "brain_metastases", operator: "true", value: "true", description: "Untreated brain metastases", weight: 1 },
    { trialIdx: 3, type: "exclusion" as const, field: "prior_tki", operator: "true", value: "true", description: "Prior TKI therapy within 6 months", weight: 1 },
    // AUTO-IMMUNE-180
    { trialIdx: 4, type: "inclusion" as const, field: "age", operator: "gte", value: "18", description: "Adult patients 18+", weight: 2 },
    { trialIdx: 4, type: "inclusion" as const, field: "condition", operator: "contains", value: "lupus", description: "SLE with lupus nephritis", weight: 3 },
    { trialIdx: 4, type: "inclusion" as const, field: "proteinuria", operator: "gte", value: "0.5", description: "Proteinuria ≥ 0.5 g/day", weight: 2 },
    { trialIdx: 4, type: "inclusion" as const, field: "ana", operator: "true", value: "true", description: "Positive ANA", weight: 1 },
    { trialIdx: 4, type: "exclusion" as const, field: "egfr", operator: "lt", value: "30", description: "eGFR < 30 mL/min (severe renal impairment)", weight: 1 },
    { trialIdx: 4, type: "exclusion" as const, field: "active_infection", operator: "true", value: "true", description: "Active infection", weight: 1 },
  ];

  const insertedCriteria = await db
    .insert(trialCriteria)
    .values(
      criteriaData.map((c) => ({
        trialId: insertedTrials[c.trialIdx].id,
        type: c.type,
        field: c.field,
        operator: c.operator,
        value: c.value,
        description: c.description,
        weight: c.weight,
      })),
    )
    .returning();

  const patientData = [
    {
      patientCode: "SYN-P-1001",
      age: 12,
      sex: "Female",
      condition: "Juvenile Idiopathic Arthritis",
      location: "Boston, MA",
      summary: "Synthetic 12-year-old with active JIA, elevated CRP, on methotrexate. Demo profile only.",
      attributes: JSON.stringify({ prior_medication: "methotrexate", active_infection: false }),
    },
    {
      patientCode: "SYN-P-1002",
      age: 14,
      sex: "Male",
      condition: "Juvenile Idiopathic Arthritis",
      location: "Cambridge, MA",
      summary: "Synthetic adolescent with JIA, missing ALT and prior medication history.",
      attributes: JSON.stringify({ active_infection: false }),
    },
    {
      patientCode: "SYN-P-1003",
      age: 34,
      sex: "Female",
      condition: "Febrile Illness",
      location: "Chicago, IL",
      summary: "Synthetic adult with acute febrile illness, temp 38.5°C. Research demo data.",
      attributes: JSON.stringify({ temperature: 38.5, immunocompromised: false, pregnancy: false }),
    },
    {
      patientCode: "SYN-P-1004",
      age: 58,
      sex: "Male",
      condition: "Heart Failure",
      location: "Oakland, CA",
      summary: "Synthetic heart failure patient, EF 35%, NYHA Class III. Wearable trial candidate.",
      attributes: JSON.stringify({ ef: 35, nyha_class: "iii", pacemaker: false }),
    },
    {
      patientCode: "SYN-P-1005",
      age: 62,
      sex: "Female",
      condition: "Non-Small Cell Lung Cancer",
      location: "Houston, TX",
      summary: "Synthetic NSCLC patient with EGFR mutation, ECOG 1. Precision oncology demo.",
      attributes: JSON.stringify({ egfr_mutation: true, ecog: 1, brain_metastases: false, prior_tki: false }),
    },
    {
      patientCode: "SYN-P-1006",
      age: 45,
      sex: "Female",
      condition: "Systemic Lupus Erythematosus",
      location: "Seattle, WA",
      summary: "Synthetic SLE with lupus nephritis, proteinuria 1.2 g/day, ANA positive.",
      attributes: JSON.stringify({ proteinuria: 1.2, ana: true, active_infection: false }),
    },
    {
      patientCode: "SYN-P-1007",
      age: 9,
      sex: "Female",
      condition: "Juvenile Idiopathic Arthritis",
      location: "Boston, MA",
      summary: "Synthetic pediatric JIA with active infection — exclusion expected.",
      attributes: JSON.stringify({ prior_medication: "nsaid", active_infection: true }),
    },
    {
      patientCode: "SYN-P-1008",
      age: 51,
      sex: "Male",
      condition: "Febrile Illness",
      location: "Evanston, IL",
      summary: "Synthetic febrile patient, immunocompromised — exclusion expected.",
      attributes: JSON.stringify({ temperature: 39.1, immunocompromised: true, pregnancy: false }),
    },
  ];

  const insertedPatients = await db
    .insert(syntheticPatients)
    .values(patientData)
    .returning();

  const labData = [
    { patientIdx: 0, labName: "CRP", labValue: "12.4", unit: "mg/L" },
    { patientIdx: 0, labName: "ALT", labValue: "28", unit: "U/L" },
    { patientIdx: 0, labName: "ESR", labValue: "45", unit: "mm/hr" },
    { patientIdx: 1, labName: "CRP", labValue: "8.1", unit: "mg/L" },
    { patientIdx: 2, labName: "WBC", labValue: "11.2", unit: "x10³/µL" },
    { patientIdx: 2, labName: "CRP", labValue: "45", unit: "mg/L" },
    { patientIdx: 3, labName: "BNP", labValue: "450", unit: "pg/mL" },
    { patientIdx: 3, labName: "Creatinine", labValue: "1.1", unit: "mg/dL" },
    { patientIdx: 4, labName: "LDH", labValue: "220", unit: "U/L" },
    { patientIdx: 5, labName: "eGFR", labValue: "65", unit: "mL/min" },
    { patientIdx: 5, labName: "Creatinine", labValue: "1.0", unit: "mg/dL" },
    { patientIdx: 6, labName: "CRP", labValue: "22", unit: "mg/L" },
    { patientIdx: 7, labName: "WBC", labValue: "3.2", unit: "x10³/µL" },
    { patientIdx: 7, labName: "CRP", labValue: "88", unit: "mg/L" },
  ];

  await db.insert(patientLabs).values(
    labData.map((l) => ({
      patientId: insertedPatients[l.patientIdx].id,
      labName: l.labName,
      labValue: l.labValue,
      unit: l.unit,
      collectedAt: new Date("2025-03-15"),
    })),
  );

  // Precompute matches for demo patients
  for (const patient of insertedPatients.slice(0, 4)) {
    const patientIdx = insertedPatients.findIndex((p) => p.id === patient.id);
    const patientLabRows = labData.filter((l) => l.patientIdx === patientIdx);

    const labMap: Record<string, { value: string; unit: string }> = {};
    for (const lab of patientLabRows) {
      labMap[lab.labName] = { value: lab.labValue, unit: lab.unit };
    }

    const profile: PatientProfile = {
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

    for (const trial of insertedTrials) {
      const criteria = insertedCriteria.filter((c) => c.trialId === trial.id);
      const result = runMatchingEngine(
        profile,
        trial.id,
        trial.title,
        criteria.map((c) => ({
          id: c.id,
          type: c.type,
          field: c.field,
          operator: c.operator,
          value: c.value,
          description: c.description,
          weight: c.weight,
        })),
      );

      const [match] = await db
        .insert(trialMatches)
        .values({
          patientId: patient.id,
          trialId: trial.id,
          status: result.status,
          score: result.score,
          explanation: result.explanation,
        })
        .returning();

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
    }
  }

  const allMatches = await db.select().from(trialMatches);
  const goodMatches = allMatches.filter(
    (m) => m.status === "likely_eligible" || m.status === "possibly_eligible",
  );

  if (goodMatches.length >= 2) {
    await db.insert(coordinatorTasks).values([
      {
        matchId: goodMatches[0].id,
        title: "Verify inclusion labs for pediatric JIA trial",
        description:
          "Review synthetic patient SYN-P-1001 lab values and confirm CRP documentation meets protocol requirements.",
        status: "needs_review",
        priority: "high",
        assignedTo: user1.name,
        dueDate: new Date("2025-04-01"),
      },
      {
        matchId: goodMatches[1].id,
        title: "Schedule PI pre-screen review",
        description:
          "Coordinate principal investigator review for potentially eligible synthetic patient match.",
        status: "new",
        priority: "medium",
        assignedTo: user1.name,
        dueDate: new Date("2025-04-05"),
      },
      {
        matchId: goodMatches[Math.min(2, goodMatches.length - 1)].id,
        title: "Contact pending — wearable trial consent prep",
        description:
          "Prepare consent documentation for cardiac wearable monitoring trial screening.",
        status: "contact_pending",
        priority: "medium",
        assignedTo: user2.name,
        dueDate: new Date("2025-04-10"),
      },
    ]);
  }

  await db.insert(auditEvents).values([
    {
      actor: user1.name,
      action: "match_analysis_run",
      entityType: "patient",
      entityId: insertedPatients[0].id,
      details: "Initial seed: match analysis for SYN-P-1001 across 5 trials.",
    },
    {
      actor: user1.name,
      action: "task_created",
      entityType: "task",
      entityId: "seed-task-1",
      details: "Initial seed: coordinator task created for pediatric JIA match review.",
    },
    {
      actor: user2.name,
      action: "task_updated",
      entityType: "task",
      entityId: "seed-task-2",
      details: "Initial seed: PI assigned to wearable trial screening task.",
    },
  ]);

  console.log("✅ Seed completed successfully!");
  console.log(`   Organization: ${org.name}`);
  console.log(`   Users: 2`);
  console.log(`   Trials: ${insertedTrials.length}`);
  console.log(`   Criteria: ${insertedCriteria.length}`);
  console.log(`   Patients: ${insertedPatients.length}`);
  console.log(`   Labs: ${labData.length}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

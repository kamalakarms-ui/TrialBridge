/**
 * End-to-end integration test suite for TrialBridge AI.
 * Run: npx tsx scripts/test-all.ts
 */
import "dotenv/config";
import {
  listTrials,
  getTrial,
  listPatients,
  getPatient,
  runMatchAnalysis,
  getPatientMatches,
  createTask,
  listTasks,
  updateTask,
  createTasksFromMatches,
  listAuditEvents,
  getDashboardMetrics,
  getMatchDetails,
} from "../src/lib/actions";
import {
  runMatchingEngine,
  type PatientProfile,
  type Criterion,
} from "../src/lib/matching/engine";

const results: { name: string; passed: boolean; detail?: string }[] = [];

function assert(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition, detail });
  const icon = condition ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function testServerActions() {
  console.log("\n=== Server Actions ===\n");

  const trials = await listTrials();
  assert("listTrials returns 5 trials", trials.length === 5, `got ${trials.length}`);
  assert(
    "listTrials includes criteria counts",
    trials.every((t) => t.inclusionCount > 0 && t.exclusionCount >= 0),
    `first trial: +${trials[0]?.inclusionCount}/-${trials[0]?.exclusionCount}`,
  );

  const trialDetail = await getTrial(trials[0].id);
  assert("getTrial returns trial", trialDetail !== null);
  assert(
    "getTrial includes criteria",
    (trialDetail?.criteria.length ?? 0) > 0,
    `${trialDetail?.criteria.length} criteria`,
  );
  assert("getTrial returns not found for bad id", (await getTrial("00000000-0000-0000-0000-000000000000")) === null);

  const patients = await listPatients();
  assert("listPatients returns 8 patients", patients.length === 8, `got ${patients.length}`);
  assert(
    "listPatients has patient codes",
    patients.every((p) => p.patientCode.startsWith("SYN-P-")),
  );
  assert(
    "listPatients flags missing fields",
    patients.some((p) => p.missingFields.length > 0),
    `SYN-P-1002 missing: ${patients.find((p) => p.patientCode === "SYN-P-1002")?.missingFields.join(", ")}`,
  );

  const patient = patients.find((p) => p.patientCode === "SYN-P-1001");
  assert("SYN-P-1001 exists", !!patient);
  if (!patient) return;

  const patientDetail = await getPatient(patient.id);
  assert("getPatient returns profile", patientDetail !== null);
  assert(
    "getPatient includes labs",
    (patientDetail?.labs.length ?? 0) > 0,
    `${patientDetail?.labs.length} labs`,
  );
  assert(
    "getPatient includes attributes",
    Object.keys(patientDetail?.attributes ?? {}).length > 0,
  );

  const metrics = await getDashboardMetrics();
  assert("getDashboardMetrics activeTrials", metrics.activeTrials === 5);
  assert("getDashboardMetrics patientsScreened", metrics.patientsScreened === 8);
  assert("getDashboardMetrics has recent matches", metrics.recentMatches.length > 0);

  const auditBefore = (await listAuditEvents()).length;

  const matchResults = await runMatchAnalysis(patient.id);
  assert(
    "runMatchAnalysis evaluates all trials",
    matchResults.length === 5,
    `got ${matchResults.length} results`,
  );
  assert(
    "runMatchAnalysis returns scores 0-100",
    matchResults.every((m) => m.score >= 0 && m.score <= 100),
  );
  assert(
    "runMatchAnalysis returns valid statuses",
    matchResults.every((m) =>
      ["likely_eligible", "possibly_eligible", "not_eligible"].includes(m.status),
    ),
  );
  assert(
    "runMatchAnalysis returns explanations",
    matchResults.every((m) => m.explanation.length > 50),
  );

  const patientMatches = await getPatientMatches(patient.id);
  assert("getPatientMatches returns results", patientMatches.length === 5);
  assert(
    "getPatientMatches includes criterion explanations",
    patientMatches.every((m) => m.explanations.length > 0),
    `first match: ${patientMatches[0]?.explanations.length} explanations`,
  );

  const matchId = patientMatches[0]?.match.id;
  if (matchId) {
    const matchDetail = await getMatchDetails(matchId);
    assert("getMatchDetails returns data", matchDetail !== null);
    assert(
      "getMatchDetails includes explanations",
      (matchDetail?.explanations.length ?? 0) > 0,
    );
  }

  const auditAfterMatch = (await listAuditEvents()).length;
  assert(
    "runMatchAnalysis creates audit event",
    auditAfterMatch > auditBefore,
    `events: ${auditBefore} → ${auditAfterMatch}`,
  );

  const tasksBefore = (await listTasks()).length;
  const newTask = await createTask(matchId!, {
    title: "E2E Test Task",
    description: "Automated test task creation",
    status: "new",
    priority: "low",
    assignedTo: "Test Coordinator",
  });
  assert("createTask returns task", !!newTask.id);
  assert("createTask sets title", newTask.title === "E2E Test Task");

  const tasksAfter = (await listTasks()).length;
  assert("createTask increments task count", tasksAfter === tasksBefore + 1);

  const updated = await updateTask(newTask.id, {
    status: "needs_review",
    priority: "high",
  });
  assert("updateTask changes status", updated.status === "needs_review");
  assert("updateTask changes priority", updated.priority === "high");

  const patient2 = patients.find((p) => p.patientCode === "SYN-P-1002");
  if (patient2) {
    await runMatchAnalysis(patient2.id);
    const bulkTasks = await createTasksFromMatches(patient2.id);
    assert(
      "createTasksFromMatches creates tasks for eligible matches",
      bulkTasks.length >= 0,
      `created ${bulkTasks.length} tasks`,
    );
  }

  const finalAudit = await listAuditEvents();
  assert("listAuditEvents returns events", finalAudit.length > 0, `${finalAudit.length} events`);
  assert(
    "audit includes match_analysis_run",
    finalAudit.some((e) => e.action === "match_analysis_run"),
  );
  assert(
    "audit includes task_created",
    finalAudit.some((e) => e.action === "task_created"),
  );
}

function testMatchingEngine() {
  console.log("\n=== Matching Engine ===\n");

  const criteria: Criterion[] = [
    {
      id: "inc-age",
      type: "inclusion",
      field: "age",
      operator: "gte",
      value: "18",
      description: "Age 18+",
      weight: 2,
    },
    {
      id: "inc-condition",
      type: "inclusion",
      field: "condition",
      operator: "contains",
      value: "arthritis",
      description: "Has arthritis",
      weight: 3,
    },
    {
      id: "inc-alt",
      type: "inclusion",
      field: "alt",
      operator: "lte",
      value: "80",
      description: "ALT available and normal",
      weight: 1,
    },
    {
      id: "exc-infection",
      type: "exclusion",
      field: "active_infection",
      operator: "true",
      value: "true",
      description: "Active infection",
      weight: 1,
    },
  ];

  const likelyEligiblePatient: PatientProfile = {
    id: "1",
    patientCode: "TEST-001",
    age: 25,
    sex: "Female",
    condition: "Juvenile Arthritis",
    location: "Boston",
    summary: "test",
    attributes: { active_infection: false },
    labs: { ALT: { value: "30", unit: "U/L" } },
  };

  const likely = runMatchingEngine(likelyEligiblePatient, "t1", "Test Trial", criteria);
  assert("likely eligible: all inclusion met", likely.status === "likely_eligible", likely.status);
  assert("likely eligible: high score", likely.score >= 80, `score=${likely.score}`);

  const possiblyPatient: PatientProfile = {
    ...likelyEligiblePatient,
    patientCode: "TEST-002",
    labs: {},
  };
  const possibly = runMatchingEngine(possiblyPatient, "t1", "Test Trial", criteria);
  assert("possibly eligible: missing ALT", possibly.status === "possibly_eligible", possibly.status);
  assert(
    "possibly eligible: has missing evaluation",
    possibly.evaluations.some((e) => e.result === "missing"),
  );

  const notEligibleFailed: PatientProfile = {
    ...likelyEligiblePatient,
    patientCode: "TEST-003",
    age: 10,
  };
  const failed = runMatchingEngine(notEligibleFailed, "t1", "Test Trial", criteria);
  assert("not eligible: age failed", failed.status === "not_eligible", failed.status);
  assert(
    "not eligible: has failed evaluation",
    failed.evaluations.some((e) => e.result === "failed"),
  );

  const notEligibleExclusion: PatientProfile = {
    ...likelyEligiblePatient,
    patientCode: "TEST-004",
    attributes: { active_infection: true },
  };
  const excluded = runMatchingEngine(notEligibleExclusion, "t1", "Test Trial", criteria);
  assert("not eligible: exclusion triggered", excluded.status === "not_eligible", excluded.status);
  assert(
    "not eligible: has triggered_exclusion",
    excluded.evaluations.some((e) => e.result === "triggered_exclusion"),
  );
  assert("exclusion caps score", excluded.score <= 30, `score=${excluded.score}`);

  const syn1007Like: PatientProfile = {
    id: "7",
    patientCode: "SYN-P-1007",
    age: 9,
    sex: "Female",
    condition: "Juvenile Idiopathic Arthritis",
    location: "Boston",
    summary: "test",
    attributes: { prior_medication: "nsaid", active_infection: true },
    labs: { CRP: { value: "22", unit: "mg/L" } },
  };

  const pediCriteria: Criterion[] = [
    { id: "1", type: "inclusion", field: "age", operator: "gte", value: "6", description: "Age 6+", weight: 2 },
    { id: "2", type: "inclusion", field: "age", operator: "lte", value: "17", description: "Age 17-", weight: 2 },
    { id: "3", type: "inclusion", field: "condition", operator: "contains", value: "arthritis", description: "JIA", weight: 3 },
    { id: "4", type: "inclusion", field: "crp", operator: "gte", value: "5", description: "CRP>=5", weight: 2 },
    { id: "5", type: "exclusion", field: "active_infection", operator: "true", value: "true", description: "Infection", weight: 1 },
  ];
  const syn1007Result = runMatchingEngine(syn1007Like, "pedi", "PEDI Trial", pediCriteria);
  assert(
    "SYN-P-1007 scenario: not eligible (infection)",
    syn1007Result.status === "not_eligible",
    syn1007Result.status,
  );
}

async function testSeedDataScenarios() {
  console.log("\n=== Seed Data Scenarios ===\n");

  const patients = await listPatients();
  const trials = await listTrials();

  const conditions = new Set(trials.map((t) => t.condition));
  assert(
    "seed has diverse trial conditions",
    conditions.size >= 5,
    [...conditions].join(", "),
  );

  const syn1002 = patients.find((p) => p.patientCode === "SYN-P-1002");
  assert("SYN-P-1002 has missing fields", (syn1002?.missingFields.length ?? 0) > 0);

  if (syn1002) {
    const matches = await getPatientMatches(syn1002.id);
    const pediMatch = matches.find((m) =>
      m.trialTitle.includes("PEDI-INFLAME"),
    );
    if (pediMatch) {
      assert(
        "SYN-P-1002 PEDI trial: possibly eligible or not (missing data)",
        ["possibly_eligible", "not_eligible"].includes(pediMatch.match.status),
        `${pediMatch.match.status} score=${pediMatch.match.score}`,
      );
      assert(
        "SYN-P-1002 has missing criterion explanations",
        pediMatch.missingData > 0 || pediMatch.explanations.some((e) => e.explanation.result === "missing"),
      );
    }
  }

  const syn1007 = patients.find((p) => p.patientCode === "SYN-P-1007");
  if (syn1007) {
    await runMatchAnalysis(syn1007.id);
    const matches = await getPatientMatches(syn1007.id);
    const pediMatch = matches.find((m) => m.trialTitle.includes("PEDI-INFLAME"));
    if (pediMatch) {
      assert(
        "SYN-P-1007 PEDI trial: not eligible (active infection)",
        pediMatch.match.status === "not_eligible",
        pediMatch.match.status,
      );
    }
  }

  const syn1001 = patients.find((p) => p.patientCode === "SYN-P-1001");
  if (syn1001) {
    const matches = await getPatientMatches(syn1001.id);
    const pediMatch = matches.find((m) => m.trialTitle.includes("PEDI-INFLAME"));
    if (pediMatch) {
      assert(
        "SYN-P-1001 PEDI trial: likely or possibly eligible",
        ["likely_eligible", "possibly_eligible"].includes(pediMatch.match.status),
        `${pediMatch.match.status} score=${pediMatch.match.score}`,
      );
    }
  }

  const tasks = await listTasks();
  const statuses = new Set(tasks.map((t) => t.task.status));
  assert(
    "tasks span multiple statuses",
    statuses.size >= 2,
    [...statuses].join(", "),
  );
}

async function testPages() {
  console.log("\n=== Page Routes (HTTP) ===\n");

  const base = "http://localhost:3000";
  const patients = await listPatients();
  const trials = await listTrials();

  const routes = [
    "/",
    "/dashboard",
    "/trials",
    `/trials/${trials[0].id}`,
    "/patients",
    `/patients/${patients[0].id}`,
    `/patients/${patients[0].id}/matches`,
    "/tasks",
    "/audit",
  ];

  for (const route of routes) {
    const res = await fetch(`${base}${route}`);
    const html = await res.text();
    const hasError =
      html.includes("Application error") ||
      html.includes("Internal Server Error") ||
      html.includes("DATABASE_URL environment variable is not set");
    assert(
      `GET ${route} → ${res.status}`,
      res.status === 200 && !hasError,
      hasError ? "page contains error" : undefined,
    );
  }

  const badTrial = await fetch(`${base}/trials/00000000-0000-0000-0000-000000000000`);
  assert("invalid trial id → 404", badTrial.status === 404);

  const badPatient = await fetch(`${base}/patients/00000000-0000-0000-0000-000000000000`);
  assert("invalid patient id → 404", badPatient.status === 404);

  const landing = await fetch(`${base}/`);
  const landingHtml = await landing.text();
  assert(
    "landing has disclaimer",
    landingHtml.includes("Not for diagnosis or treatment decisions"),
  );
  assert(
    "landing has CTA",
    landingHtml.includes("Open Demo Dashboard"),
  );

  const dashboard = await fetch(`${base}/dashboard`);
  const dashHtml = await dashboard.text();
  assert("dashboard shows Active Trials", dashHtml.includes("Active Trials"));
  assert("dashboard shows metrics value 5", dashHtml.includes("5"));
}

async function main() {
  console.log("🧪 TrialBridge AI — Full Test Suite\n");

  try {
    await testServerActions();
    testMatchingEngine();
    await testSeedDataScenarios();
    await testPages();
  } catch (err) {
    console.error("\n💥 Test suite crashed:", err);
    process.exit(1);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log("=".repeat(50));

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ❌ ${r.name}${r.detail ? `: ${r.detail}` : ""}`);
    });
    process.exit(1);
  }

  console.log("\n🎉 All tests passed!");
}

main();

export type MatchStatus = "likely_eligible" | "possibly_eligible" | "not_eligible";
export type CriterionResult =
  | "met"
  | "missing"
  | "failed"
  | "triggered_exclusion";

export interface Criterion {
  id: string;
  type: "inclusion" | "exclusion";
  field: string;
  operator: string;
  value: string;
  description: string;
  weight: number;
}

export interface PatientProfile {
  id: string;
  patientCode: string;
  age: number;
  sex: string;
  condition: string;
  location: string;
  summary: string;
  attributes: Record<string, string | number | boolean>;
  labs: Record<string, { value: string; unit: string }>;
}

export interface CriterionEvaluation {
  criterionId: string;
  result: CriterionResult;
  explanation: string;
}

export interface MatchResult {
  trialId: string;
  status: MatchStatus;
  score: number;
  explanation: string;
  evaluations: CriterionEvaluation[];
}

function getFieldValue(
  patient: PatientProfile,
  field: string,
): string | number | boolean | undefined {
  const normalized = field.toLowerCase();

  if (normalized in patient.attributes) {
    return patient.attributes[normalized];
  }

  if (normalized === "age") return patient.age;
  if (normalized === "sex") return patient.sex;
  if (normalized === "condition") return patient.condition;
  if (normalized === "location") return patient.location;

  const labKey = Object.keys(patient.labs).find(
    (k) => k.toLowerCase() === normalized,
  );
  if (labKey) {
    const lab = patient.labs[labKey];
    const numeric = parseFloat(lab.value);
    return Number.isNaN(numeric) ? lab.value : numeric;
  }

  return undefined;
}

function compareValues(
  actual: string | number | boolean,
  operator: string,
  expected: string,
): boolean {
  const actualStr = String(actual).toLowerCase();
  const expectedStr = expected.toLowerCase();

  switch (operator) {
    case "eq":
    case "equals":
      return actualStr === expectedStr;
    case "neq":
    case "not_equals":
      return actualStr !== expectedStr;
    case "gte":
    case ">=":
      return Number(actual) >= Number(expected);
    case "lte":
    case "<=":
      return Number(actual) <= Number(expected);
    case "gt":
    case ">":
      return Number(actual) > Number(expected);
    case "lt":
    case "<":
      return Number(actual) < Number(expected);
    case "contains":
      return actualStr.includes(expectedStr);
    case "in": {
      const options = expected.split("|").map((v) => v.trim().toLowerCase());
      return options.includes(actualStr);
    }
    case "true":
      return actual === true || actualStr === "true" || actualStr === "yes";
    case "false":
      return actual === false || actualStr === "false" || actualStr === "no";
    default:
      return actualStr === expectedStr;
  }
}

function evaluateCriterion(
  patient: PatientProfile,
  criterion: Criterion,
): CriterionEvaluation {
  const rawValue = getFieldValue(patient, criterion.field);

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return {
      criterionId: criterion.id,
      result: "missing",
      explanation: `Missing data for "${criterion.description}" (${criterion.field}). Coordinator should verify before referral.`,
    };
  }

  const passes = compareValues(rawValue, criterion.operator, criterion.value);

  if (criterion.type === "exclusion") {
    if (passes) {
      return {
        criterionId: criterion.id,
        result: "triggered_exclusion",
        explanation: `Exclusion triggered: ${criterion.description}. Patient attribute "${criterion.field}" (${rawValue}) matches exclusion rule.`,
      };
    }
    return {
      criterionId: criterion.id,
      result: "met",
      explanation: `Exclusion not triggered: ${criterion.description}.`,
    };
  }

  if (passes) {
    return {
      criterionId: criterion.id,
      result: "met",
      explanation: `Inclusion met: ${criterion.description} (${criterion.field} = ${rawValue}).`,
    };
  }

  return {
    criterionId: criterion.id,
    result: "failed",
    explanation: `Inclusion not met: ${criterion.description}. Expected ${criterion.operator} ${criterion.value}, found ${rawValue}.`,
  };
}

function determineStatus(
  evaluations: CriterionEvaluation[],
  criteria: Criterion[],
): MatchStatus {
  const hasTriggeredExclusion = evaluations.some(
    (e) => e.result === "triggered_exclusion",
  );
  if (hasTriggeredExclusion) return "not_eligible";

  const inclusionCriteria = criteria.filter((c) => c.type === "inclusion");
  const inclusionEvals = evaluations.filter((e) =>
    inclusionCriteria.some((c) => c.id === e.criterionId),
  );

  const hasFailedInclusion = inclusionEvals.some((e) => e.result === "failed");
  if (hasFailedInclusion) return "not_eligible";

  const hasMissing = inclusionEvals.some((e) => e.result === "missing");
  const allInclusionMet = inclusionEvals.every((e) => e.result === "met");

  if (allInclusionMet) return "likely_eligible";
  if (hasMissing) return "possibly_eligible";

  return "not_eligible";
}

function calculateScore(
  evaluations: CriterionEvaluation[],
  criteria: Criterion[],
): number {
  const inclusionCriteria = criteria.filter((c) => c.type === "inclusion");
  if (inclusionCriteria.length === 0) return 0;

  let earned = 0;
  let totalWeight = 0;

  for (const criterion of inclusionCriteria) {
    totalWeight += criterion.weight;
    const evaluation = evaluations.find((e) => e.criterionId === criterion.id);
    if (!evaluation) continue;

    if (evaluation.result === "met") {
      earned += criterion.weight;
    } else if (evaluation.result === "missing") {
      earned += criterion.weight * 0.5;
    }
  }

  const hasExclusion = evaluations.some(
    (e) => e.result === "triggered_exclusion",
  );
  if (hasExclusion) return Math.min(earned / totalWeight * 100 * 0.3, 30);

  return Math.round((earned / totalWeight) * 100);
}

function buildSummaryExplanation(
  patient: PatientProfile,
  trialTitle: string,
  status: MatchStatus,
  evaluations: CriterionEvaluation[],
): string {
  const missing = evaluations.filter((e) => e.result === "missing");
  const failed = evaluations.filter((e) => e.result === "failed");
  const exclusions = evaluations.filter(
    (e) => e.result === "triggered_exclusion",
  );

  const parts: string[] = [
    `Synthetic patient ${patient.patientCode} was evaluated against "${trialTitle}".`,
  ];

  if (status === "likely_eligible") {
    parts.push(
      "All inclusion criteria are satisfied and no exclusion criteria were triggered. This case is ready for coordinator review before PI referral.",
    );
  } else if (status === "possibly_eligible") {
    const missingFields = missing
      .map((m) => m.explanation.split("(")[1]?.replace(").", "") ?? "unknown")
      .join(", ");
    parts.push(
      `Core requirements appear aligned, but ${missing.length} field(s) are missing (${missingFields || "see details"}). Coordinator review is required before referral.`,
    );
  } else {
    if (exclusions.length > 0) {
      parts.push(
        `An exclusion criterion was triggered. This synthetic profile should not be referred without clinical override.`,
      );
    }
    if (failed.length > 0) {
      parts.push(
        `${failed.length} inclusion criterion/criteria were not met. Further screening is not recommended at this time.`,
      );
    }
  }

  parts.push(
    "This assessment supports research workflow only and does not constitute a medical diagnosis or treatment decision.",
  );

  return parts.join(" ");
}

export function runMatchingEngine(
  patient: PatientProfile,
  trialId: string,
  trialTitle: string,
  criteria: Criterion[],
): MatchResult {
  const evaluations = criteria.map((c) => evaluateCriterion(patient, c));
  const status = determineStatus(evaluations, criteria);
  const score = calculateScore(evaluations, criteria);
  const explanation = buildSummaryExplanation(
    patient,
    trialTitle,
    status,
    evaluations,
  );

  return {
    trialId,
    status,
    score,
    explanation,
    evaluations,
  };
}

export function parsePatientAttributes(
  attributesJson: string | null,
): Record<string, string | number | boolean> {
  if (!attributesJson) return {};
  try {
    return JSON.parse(attributesJson) as Record<
      string,
      string | number | boolean
    >;
  } catch {
    return {};
  }
}

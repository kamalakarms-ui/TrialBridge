export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, matchStatusBadge, matchStatusLabel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientActions } from "@/components/patient-actions";
import { getPatient, getPatientMatches } from "@/lib/actions";

function resultLabel(result: string) {
  switch (result) {
    case "met":
      return { label: "Met", variant: "success" as const };
    case "missing":
      return { label: "Missing", variant: "warning" as const };
    case "failed":
      return { label: "Failed", variant: "danger" as const };
    case "triggered_exclusion":
      return { label: "Exclusion Triggered", variant: "danger" as const };
    default:
      return { label: result, variant: "secondary" as const };
  }
}

export default async function PatientMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patientData = await getPatient(id);
  if (!patientData) notFound();

  const matches = await getPatientMatches(id);

  return (
    <DashboardLayout>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href={`/patients/${id}`}>← Back to Patient</Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
          Match Results — {patientData.patient.patientCode}
        </h1>
        <p className="mt-1 text-slate-500">
          Explainable trial eligibility assessment for coordinator review
        </p>
      </div>

      <PatientActions patientId={id} hasMatches={matches.length > 0} />

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No match results available.</p>
            <p className="mt-2 text-sm text-slate-400">
              Run trial match analysis from the patient profile page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {matches.map((m) => (
            <Card key={m.match.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{m.trialTitle}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {m.trialCondition} · {m.trialPhase}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={matchStatusBadge(m.match.status)}>
                      {matchStatusLabel(m.match.status)}
                    </Badge>
                    <span className="text-2xl font-bold text-slate-900">
                      {Math.round(m.match.score)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Plain-English Explanation
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {m.match.explanation}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-emerald-100 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">
                      {m.inclusionMet}
                    </p>
                    <p className="text-xs text-slate-500">Inclusion Met</p>
                  </div>
                  <div className="rounded-lg border border-red-100 p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">
                      {m.exclusionTriggered}
                    </p>
                    <p className="text-xs text-slate-500">Exclusions Triggered</p>
                  </div>
                  <div className="rounded-lg border border-amber-100 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {m.missingData}
                    </p>
                    <p className="text-xs text-slate-500">Missing Data</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Criterion-Level Detail
                  </p>
                  {m.explanations.map((e) => {
                    const { label, variant } = resultLabel(e.explanation.result);
                    return (
                      <div
                        key={e.explanation.id}
                        className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                      >
                        <Badge variant={variant}>{label}</Badge>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {e.criterion.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {e.criterion.type === "inclusion" ? "Inclusion" : "Exclusion"} ·{" "}
                            {e.explanation.explanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

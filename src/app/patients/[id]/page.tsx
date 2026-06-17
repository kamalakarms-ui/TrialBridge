export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, matchStatusBadge, matchStatusLabel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientActions } from "@/components/patient-actions";
import { getPatient } from "@/lib/actions";
import { formatDate } from "@/lib/utils";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPatient(id);
  if (!data) notFound();

  const { patient, labs, attributes, matches } = data;

  return (
    <DashboardLayout>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/patients">← Back to Patients</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl font-bold text-slate-900">
              {patient.patientCode}
            </h1>
            <p className="mt-1 text-slate-500">{patient.summary}</p>
          </div>
          <Badge variant="secondary">Synthetic Demo Data</Badge>
        </div>
      </div>

      <PatientActions patientId={id} hasMatches={matches.length > 0} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Age", value: patient.age },
          { label: "Sex", value: patient.sex },
          { label: "Condition", value: patient.condition },
          { label: "Location", value: patient.location },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 font-medium text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Laboratory Values</CardTitle>
          </CardHeader>
          <CardContent>
            {labs.length === 0 ? (
              <p className="text-sm text-slate-400">No lab values recorded.</p>
            ) : (
              <div className="space-y-2">
                {labs.map((lab) => (
                  <div
                    key={lab.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <span className="font-medium text-slate-900">
                      {lab.labName}
                    </span>
                    <span className="text-slate-600">
                      {lab.labValue} {lab.unit}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(lab.collectedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Structured Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(attributes).length === 0 ? (
              <p className="text-sm text-slate-400">No additional attributes.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {key}
                    </span>
                    <span className="text-sm text-slate-600">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ranked Trial Matches</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={`/patients/${id}/matches`}>Full Match Report</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No matches yet. Click &quot;Run Trial Match Analysis&quot; to evaluate
              this synthetic patient against all active trials.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div
                  key={m.match.id}
                  className="rounded-lg border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/trials/${m.match.trialId}`}
                        className="font-medium text-teal-700 hover:underline"
                      >
                        {m.trialTitle}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {m.trialCondition}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={matchStatusBadge(m.match.status)}>
                        {matchStatusLabel(m.match.status)}
                      </Badge>
                      <span className="text-lg font-bold text-slate-900">
                        {Math.round(m.match.score)}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {m.match.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

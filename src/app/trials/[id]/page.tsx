export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, matchStatusBadge, matchStatusLabel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTrial } from "@/lib/actions";

export default async function TrialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTrial(id);
  if (!data) notFound();

  const { trial, criteria, matches } = data;
  const inclusion = criteria.filter((c) => c.type === "inclusion");
  const exclusion = criteria.filter((c) => c.type === "exclusion");

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/trials">← Back to Trials</Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{trial.title}</h1>
          <p className="mt-1 text-slate-500">{trial.summary}</p>
        </div>
        <Badge variant="success">{trial.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Condition", value: trial.condition },
          { label: "Phase", value: trial.phase },
          { label: "Location", value: trial.location },
          { label: "Sponsor", value: trial.sponsor },
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
            <CardTitle className="text-emerald-700">
              Inclusion Criteria ({inclusion.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inclusion.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3"
              >
                <p className="text-sm font-medium text-slate-900">
                  {c.description}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.field} {c.operator} {c.value} · weight {c.weight}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">
              Exclusion Criteria ({exclusion.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exclusion.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-red-100 bg-red-50/50 p-3"
              >
                <p className="text-sm font-medium text-slate-900">
                  {c.description}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.field} {c.operator} {c.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Related Synthetic Patient Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No matches computed yet. Run match analysis on synthetic patients.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div
                  key={m.match.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <Link
                      href={`/patients/${m.patientId}`}
                      className="text-sm font-medium text-teal-700 hover:underline"
                    >
                      {m.patientCode}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Score: {Math.round(m.match.score)}%
                    </p>
                  </div>
                  <Badge variant={matchStatusBadge(m.match.status)}>
                    {matchStatusLabel(m.match.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  FlaskConical,
  Users,
  Target,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, matchStatusBadge, matchStatusLabel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { getDashboardMetrics } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  const statCards = [
    {
      label: "Active Trials",
      value: metrics.activeTrials,
      icon: FlaskConical,
      color: "text-teal-700",
      bg: "bg-teal-50",
    },
    {
      label: "Synthetic Patients Screened",
      value: metrics.patientsScreened,
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Potential Matches",
      value: metrics.potentialMatches,
      icon: Target,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Missing-Data Cases",
      value: metrics.missingDataCases,
      icon: AlertCircle,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Research coordination overview — synthetic demo data
        </p>
      </div>

      <Disclaimer />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Match Activity</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/patients">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {metrics.recentMatches.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No match activity yet. Run analysis on a synthetic patient to get
                started.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentMatches.map((item) => (
                  <Link
                    key={item.match.id}
                    href={`/patients/${item.patientId}/matches`}
                    aria-label={`View match breakdown for ${item.patientCode} — ${item.trialTitle}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:border-teal-200 hover:bg-teal-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.patientCode}
                      </p>
                      <p className="text-xs text-slate-500">{item.trialTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={matchStatusBadge(item.match.status)}>
                        {matchStatusLabel(item.match.status)}
                      </Badge>
                      <span className="text-sm font-semibold text-slate-700">
                        {Math.round(item.match.score)}%
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-teal-700">
                        View breakdown
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Coordinator Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {metrics.recentTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No tasks yet. Create tasks from match results after coordinator
                review.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentTasks.map((item) => (
                  <div
                    key={item.task.id}
                    className="rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        {item.task.title}
                      </p>
                      <Badge variant="secondary">{item.task.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.patientCode} · {item.trialTitle}
                    </p>
                    {item.task.dueDate && (
                      <p className="mt-1 text-xs text-slate-400">
                        Due {formatDateTime(item.task.dueDate)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

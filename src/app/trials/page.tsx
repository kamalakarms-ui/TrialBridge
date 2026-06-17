export const dynamic = "force-dynamic";

import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTrials } from "@/lib/actions";

export default async function TrialsPage() {
  const trials = await listTrials();

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clinical Trials</h1>
        <p className="mt-1 text-slate-500">
          Active trial portfolio with structured inclusion/exclusion criteria
        </p>
      </div>

      {trials.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No trials found.</p>
            <p className="mt-2 text-sm text-slate-400">
              Run <code className="rounded bg-slate-100 px-1">npm run db:seed</code> to
              load demo data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden lg:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trial</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trials.map((trial) => (
                    <TableRow key={trial.id}>
                      <TableCell className="max-w-xs font-medium">
                        {trial.title}
                      </TableCell>
                      <TableCell>{trial.condition}</TableCell>
                      <TableCell>{trial.phase}</TableCell>
                      <TableCell>{trial.location}</TableCell>
                      <TableCell>{trial.sponsor}</TableCell>
                      <TableCell>
                        <Badge variant="success">{trial.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-600">
                          +{trial.inclusionCount}
                        </span>
                        {" / "}
                        <span className="text-red-600">
                          −{trial.exclusionCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/trials/${trial.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="grid gap-4 lg:hidden">
            {trials.map((trial) => (
              <Card key={trial.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{trial.title}</CardTitle>
                    <Badge variant="success">{trial.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>
                    <strong>Condition:</strong> {trial.condition}
                  </p>
                  <p>
                    <strong>Phase:</strong> {trial.phase} · {trial.location}
                  </p>
                  <p>
                    <strong>Sponsor:</strong> {trial.sponsor}
                  </p>
                  <p>
                    Criteria:{" "}
                    <span className="text-emerald-600">
                      +{trial.inclusionCount}
                    </span>{" "}
                    /{" "}
                    <span className="text-red-600">−{trial.exclusionCount}</span>
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href={`/trials/${trial.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

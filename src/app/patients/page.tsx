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
import { listPatients } from "@/lib/actions";

export default async function PatientsPage() {
  const patients = await listPatients();

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Synthetic Patients</h1>
        <p className="mt-1 text-slate-500">
          Demo patient profiles for research workflow — not real individuals
        </p>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No synthetic patients found.</p>
            <p className="mt-2 text-sm text-slate-400">
              Run <code className="rounded bg-slate-100 px-1">npm run db:seed</code> to
              load demo data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Code</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Key Labs</TableHead>
                    <TableHead>Missing Fields</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono font-medium">
                        {patient.patientCode}
                      </TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.condition}</TableCell>
                      <TableCell>{patient.location}</TableCell>
                      <TableCell>
                        {patient.keyLabs.length > 0 ? (
                          <div className="space-y-0.5 text-xs">
                            {patient.keyLabs.map((lab) => (
                              <div key={lab}>{lab}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.missingFields.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {patient.missingFields.slice(0, 3).map((f) => (
                              <Badge key={f} variant="warning">
                                {f}
                              </Badge>
                            ))}
                            {patient.missingFields.length > 3 && (
                              <Badge variant="secondary">
                                +{patient.missingFields.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="success">Complete</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/patients/${patient.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="grid gap-4 md:hidden">
            {patients.map((patient) => (
              <Card key={patient.id}>
                <CardHeader>
                  <CardTitle className="font-mono text-base">
                    {patient.patientCode}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>
                    Age {patient.age} · {patient.condition}
                  </p>
                  <p>{patient.location}</p>
                  {patient.missingFields.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {patient.missingFields.slice(0, 3).map((f) => (
                        <Badge key={f} variant="warning">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/patients/${patient.id}`}>View Profile</Link>
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

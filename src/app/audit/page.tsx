export const dynamic = "force-dynamic";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAuditEvents } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  const events = await listAuditEvents();

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
        <p className="mt-1 text-slate-500">
          Complete log of match analyses and coordinator actions
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No audit events recorded yet.</p>
            <p className="mt-2 text-sm text-slate-400">
              Events are logged when match analyses run and tasks are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(event.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{event.actor}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {event.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {event.entityType}
                    <br />
                    <span className="font-mono text-slate-400">
                      {event.entityId.slice(0, 8)}…
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md text-sm text-slate-600">
                    {event.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}

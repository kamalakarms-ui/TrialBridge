export const dynamic = "force-dynamic";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TasksClient } from "@/components/tasks-client";
import { listTasks } from "@/lib/actions";

export default async function TasksPage() {
  const tasks = await listTasks();

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coordinator Tasks</h1>
        <p className="mt-1 text-slate-500">
          Track screening workflows from initial review through PI referral
        </p>
      </div>

      <TasksClient tasks={tasks} />
    </DashboardLayout>
  );
}

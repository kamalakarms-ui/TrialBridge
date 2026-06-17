"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createTask, updateTask } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

const STATUSES = [
  "new",
  "needs_review",
  "contact_pending",
  "referred_to_pi",
  "closed",
] as const;

const PRIORITIES = ["low", "medium", "high"] as const;

type TaskItem = {
  task: {
    id: string;
    matchId: string;
    title: string;
    description: string;
    status: (typeof STATUSES)[number];
    priority: (typeof PRIORITIES)[number];
    assignedTo: string | null;
    dueDate: Date | null;
    createdAt: Date;
  };
  patientCode: string;
  trialTitle: string;
  matchStatus: string;
  matchScore: number;
};

interface TasksClientProps {
  tasks: TaskItem[];
}

export function TasksClient({ tasks }: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    matchId: "",
    title: "",
    description: "",
    status: "new" as (typeof STATUSES)[number],
    priority: "medium" as (typeof PRIORITIES)[number],
    assignedTo: "",
    dueDate: "",
  });

  const grouped = STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.task.status === status);
      return acc;
    },
    {} as Record<string, TaskItem[]>,
  );

  function resetForm() {
    setForm({
      matchId: "",
      title: "",
      description: "",
      status: "new",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
    });
    setShowForm(false);
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (editingId) {
        await updateTask(editingId, {
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          assignedTo: form.assignedTo || undefined,
          dueDate: form.dueDate || null,
        });
      } else {
        if (!form.matchId) return;
        await createTask(form.matchId, {
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          assignedTo: form.assignedTo || undefined,
          dueDate: form.dueDate || undefined,
        });
      }
      resetForm();
      router.refresh();
    });
  }

  function startEdit(item: TaskItem) {
    setEditingId(item.task.id);
    setForm({
      matchId: item.task.matchId,
      title: item.task.title,
      description: item.task.description,
      status: item.task.status,
      priority: item.task.priority,
      assignedTo: item.task.assignedTo ?? "",
      dueDate: item.task.dueDate
        ? new Date(item.task.dueDate).toISOString().split("T")[0]
        : "",
    });
    setShowForm(true);
  }

  const uniqueMatches = Array.from(
    new Map(
      tasks.map((t) => [
        t.task.matchId,
        { id: t.task.matchId, label: `${t.patientCode} · ${t.trialTitle}` },
      ]),
    ).values(),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Task" : "Create Task"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <Label htmlFor="matchId">Related Match</Label>
                  <select
                    id="matchId"
                    required
                    value={form.matchId}
                    onChange={(e) =>
                      setForm({ ...form, matchId: e.target.value })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Select a match...</option>
                    {uniqueMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as (typeof STATUSES)[number],
                      })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as (typeof PRIORITIES)[number],
                      })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update Task" : "Create Task"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {STATUSES.map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <div key={status}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {status.replace(/_/g, " ")} ({items.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item) => (
                <Card key={item.task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-900">
                        {item.task.title}
                      </p>
                      <Badge
                        variant={
                          item.task.priority === "high"
                            ? "danger"
                            : item.task.priority === "medium"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {item.task.priority}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.task.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.patientCode} · {item.trialTitle} · Score{" "}
                      {Math.round(item.matchScore)}%
                    </p>
                    {item.task.assignedTo && (
                      <p className="mt-1 text-xs text-slate-400">
                        Assigned: {item.task.assignedTo}
                      </p>
                    )}
                    {item.task.dueDate && (
                      <p className="mt-1 text-xs text-slate-400">
                        Due: {formatDateTime(item.task.dueDate)}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No coordinator tasks yet.</p>
            <p className="mt-2 text-sm text-slate-400">
              Create tasks from match results or add one manually.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

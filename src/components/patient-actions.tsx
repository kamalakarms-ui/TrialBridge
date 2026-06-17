"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runMatchAnalysis, createTasksFromMatches } from "@/lib/actions";

interface PatientActionsProps {
  patientId: string;
  hasMatches: boolean;
}

export function PatientActions({ patientId, hasMatches }: PatientActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleRunAnalysis() {
    setMessage(null);
    startTransition(async () => {
      try {
        await runMatchAnalysis(patientId);
        setMessage("Match analysis complete. View results below.");
        router.refresh();
      } catch {
        setMessage("Analysis failed. Check database connection.");
      }
    });
  }

  function handleCreateTasks() {
    setMessage(null);
    startTransition(async () => {
      try {
        const tasks = await createTasksFromMatches(patientId);
        setMessage(`Created ${tasks.length} coordinator task(s).`);
        router.refresh();
      } catch {
        setMessage("Task creation failed.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={handleRunAnalysis} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Run Trial Match Analysis
      </Button>
      {hasMatches && (
        <Button
          variant="outline"
          onClick={handleCreateTasks}
          disabled={isPending}
        >
          <ListChecks className="h-4 w-4" />
          Create Coordinator Tasks
        </Button>
      )}
      {message && (
        <p className="text-sm text-teal-700">{message}</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-teal-700" />
          <span className="text-lg font-bold text-slate-900">TrialBridge AI</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/#problem" className="text-sm text-slate-600 hover:text-slate-900">
            Problem
          </Link>
          <Link href="/#solution" className="text-sm text-slate-600 hover:text-slate-900">
            Solution
          </Link>
          <Link href="/#value" className="text-sm text-slate-600 hover:text-slate-900">
            For Teams
          </Link>
        </nav>
        <Button asChild>
          <Link href="/dashboard">Open Demo Dashboard</Link>
        </Button>
      </div>
    </header>
  );
}

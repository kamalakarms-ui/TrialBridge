"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  CheckSquare,
  ScrollText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trials", label: "Trials", icon: FlaskConical },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/audit", label: "Audit Trail", icon: ScrollText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <Activity className="h-6 w-6 text-teal-700" />
        <div>
          <p className="text-sm font-bold text-slate-900">TrialBridge AI</p>
          <p className="text-[10px] text-slate-500">Research Coordination</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <p className="text-[10px] leading-relaxed text-slate-400">
          Synthetic demo data only. For research workflow support — not clinical
          decision-making.
        </p>
      </div>
    </aside>
  );
}

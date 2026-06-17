import { AppSidebar } from "@/components/layout/app-sidebar";
import { Disclaimer } from "@/components/disclaimer";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
        <footer className="border-t border-slate-200 bg-white p-4">
          <Disclaimer compact />
        </footer>
      </div>
    </div>
  );
}

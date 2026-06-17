import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  Zap,
  BarChart3,
  FileSearch,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 to-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-700">
              B2B Clinical Research Platform
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              TrialBridge AI
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              Clinical trial matching and research coordination for faster, safer
              human review.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              Help research coordinators organize synthetic patient information,
              compare it against trial inclusion and exclusion criteria, identify
              missing data, and prepare cases for principal investigator review —
              with full explainability at every step.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open Demo Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/patients">View Synthetic Patients</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-slate-900">
            Trial screening is manual, slow, and inconsistent
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Research coordinators at hospitals and academic medical centers spend
            hours manually cross-referencing patient charts against complex trial
            protocols. Criteria are buried in PDFs, lab values are scattered across
            systems, and eligibility decisions lack audit trails.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Hours per screen",
                desc: "Manual chart review for a single patient-trial pair can take 30–60 minutes.",
              },
              {
                icon: FileSearch,
                title: "Inconsistent criteria",
                desc: "Different coordinators interpret inclusion/exclusion rules differently.",
              },
              {
                icon: Shield,
                title: "Compliance gaps",
                desc: "Without audit trails, research teams struggle to document screening decisions.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <item.icon className="h-8 w-8 text-teal-700" />
                  <CardTitle className="mt-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-slate-900">
            Explainable matching for research coordinators
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            TrialBridge AI uses a deterministic, rules-based matching engine to
            compare synthetic patient profiles against structured trial criteria.
            Every match includes a score, status, and plain-English explanation —
            always routed to human review.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Instant screening", desc: "Evaluate patients against all active trials in seconds." },
              { icon: CheckCircle2, title: "Criterion-level detail", desc: "See exactly which inclusion/exclusion rules passed or failed." },
              { icon: BarChart3, title: "Missing data flags", desc: "Identify gaps before coordinator outreach." },
              { icon: Users, title: "Task workflows", desc: "Create and track coordinator tasks through PI referral." },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <item.icon className="h-6 w-6 text-teal-700" />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Value */}
      <section id="value" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-slate-900">
            Built for research teams and hospital innovation
          </h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              {[
                "Accelerate pre-screening for multi-site trial portfolios",
                "Standardize eligibility assessment across coordinators",
                "Full audit trail for regulatory and IRB documentation",
                "Deploy on Vercel with Aurora PostgreSQL for enterprise scale",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  <p className="text-slate-700">{point}</p>
                </div>
              ))}
            </div>
            <Card className="bg-teal-700 text-white">
              <CardHeader>
                <CardTitle className="text-white">Ready to explore?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-teal-100">
                  Open the demo dashboard with 5 clinical trials, 8 synthetic
                  patients, and precomputed match results across pediatric,
                  cardiology, oncology, and autoimmune research areas.
                </p>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/dashboard">
                    Open Demo Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <Disclaimer />
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-500">
          © {new Date().getFullYear()} TrialBridge AI — Research workflow
          demonstration. All patient data is synthetic.
        </div>
      </footer>
    </div>
  );
}

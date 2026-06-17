# Devpost Submission — TrialBridge AI

## Project Name

**TrialBridge AI**

## Track

**Track 2: Monetizable B2B App**

## Short Description

TrialBridge AI is a clinical trial matching and research coordination platform for hospitals, clinics, and research labs. It helps research coordinators screen synthetic patient profiles against trial inclusion/exclusion criteria, identify missing data, and prepare cases for principal investigator review — with full explainability and audit trails.

## Features

- **Landing page** with problem/solution narrative and B2B value proposition
- **Research coordinator dashboard** with metrics, recent activity, and task overview
- **Clinical trial portfolio** with structured inclusion/exclusion criteria (5 demo trials)
- **Synthetic patient profiles** with labs and structured attributes (8 demo patients)
- **Deterministic matching engine** — rules-based eligibility assessment with 0–100 scores
- **Explainable match results** — per-criterion detail with plain-English summaries
- **Coordinator task management** — grouped by workflow status (New → PI Referral → Closed)
- **Audit trail** — immutable log of all match analyses and task actions
- **Safety disclaimers** throughout — clearly positioned as research workflow support, not diagnosis

## AWS Database Used

**Amazon Aurora PostgreSQL**

- Production database hosted on Aurora PostgreSQL
- Connected via `DATABASE_URL` environment variable on Vercel
- Local development uses standard PostgreSQL with the same schema and Drizzle ORM adapter
- Schema includes 10 tables: organizations, users, trials, trial_criteria, synthetic_patients, patient_labs, trial_matches, match_explanations, coordinator_tasks, audit_events

## Vercel Deployment

- Frontend and server actions deployed on **Vercel**
- Next.js 16 App Router with React Server Components
- Server Actions handle all backend operations (no separate API server)
- `DATABASE_URL` configured in Vercel environment variables pointing to Aurora
- All data pages use dynamic rendering for database connectivity at request time

**Deploy steps:**
1. Connect GitHub repo to Vercel
2. Set `DATABASE_URL` to Aurora connection string
3. Deploy
4. Run `npm run db:migrate` and `npm run db:seed` against Aurora

## What Makes It Original

1. **Explainability-first design** — Unlike black-box matching tools, every result shows exactly which criteria passed, failed, or are missing data
2. **Coordinator workflow integration** — Match results flow directly into task creation and PI referral tracking
3. **Deterministic rules engine** — Transparent, auditable eligibility logic instead of opaque AI classification
4. **B2B healthcare positioning** — Built for research teams at hospitals and academic medical centers, not consumer-facing
5. **Compliance-ready audit trail** — Every action logged for IRB and regulatory documentation

## Real-World Impact

Clinical trial recruitment is a major bottleneck — 80% of trials fail to meet enrollment timelines, costing sponsors billions annually. Research coordinators spend 30–60 minutes manually screening each patient against complex protocol criteria.

TrialBridge AI demonstrates how structured data + explainable matching can:

- **Reduce pre-screening time** from hours to seconds per patient-trial pair
- **Standardize eligibility assessment** across coordinators and sites
- **Surface missing data early** before coordinator outreach
- **Document screening decisions** with full audit trails for compliance

Target customers: hospital innovation teams, academic medical center research offices, CROs, and multi-site trial sponsors.

## Safety & Privacy Notes

- **No real patient data** — All profiles use synthetic `SYN-P-` codes with fabricated demographics and labs
- **Not a medical device** — The app supports research workflow organization only
- **No diagnosis or treatment claims** — Eligibility statuses are recommendations for human review
- **Visible disclaimers** on every page: "For research workflow demonstration only. Not for diagnosis or treatment decisions."
- **Human-in-the-loop** — All matches require coordinator review before PI referral
- **No PHI storage** — Demo deployment uses only synthetic seed data

## Demo Video Script Outline

### Scene 1: Problem (30 sec)
- Show research coordinator manually reviewing patient charts against trial PDFs
- Narrate: "Trial screening is manual, slow, and inconsistent"

### Scene 2: Landing Page (15 sec)
- Show TrialBridge AI landing page
- Highlight tagline and "Open Demo Dashboard" CTA

### Scene 3: Dashboard (20 sec)
- Walk through metrics: 5 active trials, 8 patients screened, potential matches
- Show recent match activity and coordinator tasks

### Scene 4: Synthetic Patients (20 sec)
- Browse patient list with missing data flags
- Open SYN-P-1002 (missing ALT and prior medication)

### Scene 5: Match Analysis (45 sec)
- Click "Run Trial Match Analysis"
- Show ranked results: Likely Eligible, Possibly Eligible, Not Eligible
- Drill into criterion-level explanations
- Highlight plain-English summary

### Scene 6: Tasks & Audit (20 sec)
- Create coordinator tasks from match results
- Show task board grouped by status
- Show audit trail with logged actions

### Scene 7: Safety & Close (10 sec)
- Show disclaimer banner
- "TrialBridge AI — faster, safer human review for clinical research teams"

**Total: ~2.5 minutes**

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions |
| Database | Amazon Aurora PostgreSQL |
| ORM | Drizzle ORM |
| Deployment | Vercel |
| Matching | Deterministic rules engine (TypeScript) |

# TrialBridge AI

**Clinical trial matching and research coordination for faster, safer human review.**

TrialBridge AI is a B2B healthcare research workflow tool that helps research coordinators organize synthetic patient information, compare it against trial inclusion/exclusion criteria, identify missing data, and prepare cases for human review.

> **Important:** This application is for research workflow demonstration only. It does not diagnose, treat, prescribe, or make final medical decisions. All patient data is synthetic.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn-style UI components
- **Backend:** Next.js Server Actions
- **Database:** PostgreSQL (local dev) / Amazon Aurora PostgreSQL (production)
- **ORM:** Drizzle ORM
- **Deployment:** Vercel

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local) or Amazon Aurora PostgreSQL (production)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trialbridge
```

Create the database if it doesn't exist:

```bash
createdb trialbridge
```

### 3. Run migrations

```bash
npm run db:migrate
```

### 4. Seed demo data

```bash
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or go directly to [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed synthetic demo data |

## Features

- **Landing page** — Problem/solution narrative with B2B value proposition
- **Dashboard** — Metrics, recent matches, coordinator tasks
- **Trials** — Browse 5 demo clinical trials with structured criteria
- **Synthetic Patients** — 8 demo patient profiles with labs and attributes
- **Match Analysis** — Deterministic rules-based eligibility engine with explainability
- **Coordinator Tasks** — Task management grouped by workflow status
- **Audit Trail** — Full log of match analyses and task actions

## Demo Data

The seed script loads:

- 1 organization (Metro Research Health System)
- 2 demo users (Research Coordinator + PI)
- 5 clinical trials (pediatric JIA, febrile illness, cardiology wearable, oncology precision, autoimmune lupus)
- 8 synthetic patients with 14+ lab records
- 30+ trial criteria
- Precomputed matches and coordinator tasks

## Vercel Deployment

1. Push the repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variable:
   - `DATABASE_URL` — your Amazon Aurora PostgreSQL connection string
4. Deploy
5. After first deploy, run migrations and seed against your Aurora instance:

```bash
DATABASE_URL="your-aurora-url" npm run db:migrate
DATABASE_URL="your-aurora-url" npm run db:seed
```

## Safety & Compliance

- All patient data is **synthetic** and clearly labeled
- Visible disclaimers on every dashboard page
- Matching engine produces **recommendations for human review**, not medical decisions
- Full audit trail for research workflow documentation

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and architecture diagram
- [DEVPOST_SUBMISSION.md](./DEVPOST_SUBMISSION.md) — Hackathon submission draft

## License

Copyright (c) 2025 TrialBridge AI
# TrialBridge
# TrialBridge

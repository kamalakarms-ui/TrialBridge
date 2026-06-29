# TrialBridge AI

## Inspiration

Clinical trials fail for a frustratingly mundane reason: they cannot find the right patients. Roughly **80% of trials miss their enrollment timelines**, and a huge share of that delay comes from the manual, error-prone work of reading dense eligibility criteria and cross-referencing them against scattered patient records. Coordinators spend hours per patient flipping between a protocol PDF and an EHR, mentally checking "Is the HbA1c in range? Is the eGFR above the cutoff? Are they on an excluded medication?"

We wanted to take that mechanical matching work off the coordinator's plate — not to *replace* their judgment, but to give them a prioritized, explainable shortlist so they can spend their time on the patients who actually have a chance of qualifying.

## What it does

TrialBridge AI is a clinical-trial matching dashboard for research coordinators. It:

- Ingests **trials** and their structured **eligibility criteria** (inclusion and exclusion), each with a measurable field, operator, and threshold.
- Ingests **patients** along with their **conditions, medications, and lab results**.
- Runs a deterministic matching engine that evaluates every patient against every active trial and produces a **match score**, a **status**, and — critically — a **per-criterion explanation** of why each rule was met, not met, or missing data.
- Surfaces the results in a dashboard: active trials, patients screened, high-confidence matches, and a queue of coordinator tasks (e.g. "missing lab needed to confirm eligibility").

Every screen carries a clear disclaimer that the output is **decision support, not a medical determination** — a human coordinator confirms every match.

## How we built it

The stack is a single **Next.js 16 (App Router)** application written in TypeScript:

- **Database:** Amazon Aurora PostgreSQL, accessed through **Drizzle ORM** with the `pg` driver.
- **Schema:** a normalized model of `organizations`, `users`, `trials`, `eligibility_criteria`, `patients`, `patient_conditions`, `patient_medications`, `lab_results`, `matches`, and `match_criteria_results`.
- **Auth to the DB:** AWS IAM authentication via Vercel OIDC — no static database password anywhere.
- **UI:** Server Components for data-heavy pages, with the matching results rendered as prioritized cards and tables.

### The matching engine

The core is a deterministic, explainable scoring function — not a black box. For a patient $p$ and trial $t$ with criteria set $C_t$, each criterion $c$ is evaluated to one of three states:

$$
\text{eval}(p, c) =
\begin{cases}
1 & \text{met} \\
0.5 & \text{missing data} \\
0 & \text{not met}
\end{cases}
$$

The match score is the weighted average across all criteria, scaled to a percentage:

$$
\text{score}(p, t) = \frac{\sum_{c \in C_t} w_c \cdot \text{eval}(p, c)}{\sum_{c \in C_t} w_c} \times 100
$$

The half-credit term for *missing* data is the key design decision: a patient who is missing a single lab value is not the same as a patient who clearly fails a hard exclusion. The first becomes a **task** ("order this lab"); the second is filtered out. A hard exclusion criterion being met forces the status to ineligible regardless of the numeric score, so the engine never "averages away" a disqualifier.

Each evaluation is persisted to `match_criteria_results`, so the dashboard can show the coordinator *exactly* which rules drove the score.

## Challenges we ran into

The biggest challenge wasn't the application logic — it was **database connectivity**. The app initially expected a `DATABASE_URL` connection string, but our database was Amazon Aurora PostgreSQL using **IAM token authentication**, which provides no static URL or password. The page crashed on every database call.

Getting IAM auth working end-to-end was a multi-step battle:

1. Rewiring the Drizzle connection to use `@aws-sdk/rds-signer` + `awsCredentialsProvider`, generating a short-lived auth token as the password at connection time.
2. Hitting `AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity` — a **trust-policy mismatch** between the Vercel OIDC identity and the AWS IAM role.
3. Standing up a clean AWS environment from scratch: creating the OIDC identity provider, an IAM role with the correct `aud`/`sub` conditions, an Aurora Serverless v2 cluster (which required a scaling configuration before the instance would create), security-group ingress, and an `rds_iam`-mapped database user.

Each layer failed in its own way — a one-slash `file:/` typo, a region mismatch (`us-east-2` vs `us-east-1`), and the Serverless v2 scaling prerequisite all cost us time. The lesson: with IAM auth, a "connection refused" is almost never the code.

## Accomplishments that we're proud of

- A matching engine that is **explainable by construction** — every score traces back to individual criteria, which is non-negotiable in a clinical context.
- **Zero static database credentials.** Authentication is entirely IAM + OIDC, with rotating short-lived tokens.
- A **safety-first UX** that consistently frames the tool as decision support and keeps a human in the loop.
- A fully **normalized schema** that cleanly separates trials, criteria, patients, and the clinical facts (conditions, meds, labs) needed to evaluate them.

## What we learned

- **Cloud auth is the hard part of "serverless Postgres."** OIDC → STS → RDS token signing has many places to misconfigure, and the error messages point at the database when the real fault is in IAM trust policies.
- **Determinism beats cleverness in healthcare.** A transparent weighted-scoring model that a coordinator can audit is far more valuable than an opaque model with a marginally better hit rate.
- **Modeling "unknown" explicitly matters.** Treating missing data as a distinct state — rather than a pass or a fail — is what turns the tool from a filter into a workflow that tells coordinators what to do next.

## What's next for TrialBridge AI

- **LLM-assisted criteria ingestion:** parse free-text protocol documents into structured `eligibility_criteria` rows automatically.
- **FHIR / EHR integration** to pull patient conditions, medications, and labs directly instead of seeding them.
- **Confidence intervals and recency weighting** on lab-based criteria, so a stale value counts for less than a fresh one.
- **Coordinator collaboration features:** assignment, audit trails, and status tracking as patients move from "potential match" to "screened" to "enrolled."
- **Multi-tenant hardening** so multiple research organizations can run on the same platform with strict data isolation.

# TrialBridge AI — 3-Minute Presentation Script

> Target length: ~3 minutes (~430 words at a calm speaking pace).
> Timings are cumulative. Bracketed notes are stage directions, not spoken.

---

## [0:00 – 0:25] Hook & Problem

"Every year, thousands of clinical trials are delayed or shut down for one reason: they can't find the right patients. Coordinators spend hours manually reading charts against pages of eligibility criteria. It's slow, it's error-prone, and patients who could benefit get missed.

That's the problem **TrialBridge AI** solves."

## [0:25 – 0:50] What It Is

"TrialBridge AI is a clinical-trial patient-matching platform. It takes a hospital's patient data and a trial's eligibility criteria, and it surfaces the patients most likely to qualify — ranked, scored, and explained.

The key word is *explained*. This isn't a black box. Every match shows exactly which criteria a patient meets, which they don't, and which are missing data."

## [0:50 – 1:30] The Dashboard — Live Demo

[Open the dashboard.]

"This is the coordinator's home base. At a glance they see active trials, synthetic patients screened, potential matches, and cases with missing data.

[Point to the match activity feed.]

Here's the live match activity — each row is a patient evaluated against a trial. And over here are the coordinator's prioritized tasks, so nothing falls through the cracks.

[Click into a trial or match.]

When I open a match, I get the full breakdown: a match score, and a criterion-by-criterion view — green for met, red for not met, amber for missing data. The coordinator stays in control; the system just does the heavy lifting."

## [1:30 – 2:10] How the Matching Works

"Under the hood, the matching engine is **deterministic** — not a guess from a language model. For each patient-trial pair, it evaluates every eligibility criterion and assigns a status: *met*, *not met*, or *missing*.

It then computes a weighted score. Critical criteria carry more weight, and missing data earns partial credit rather than a hard fail — because a missing lab value isn't a disqualification, it's a follow-up task.

This determinism matters in healthcare. The same inputs always produce the same result, so every recommendation is auditable and reproducible."

## [2:10 – 2:40] Architecture & Data

"It's built on Next.js with a Drizzle-typed schema over **Amazon Aurora PostgreSQL**. The data model captures the real domain — organizations, trials, eligibility criteria, patients, lab results, and the matches between them.

Authentication to the database uses AWS IAM with short-lived OIDC tokens — no long-lived passwords sitting in environment variables. It's secure by design."

## [2:40 – 3:00] Safety & Close

"And critically, TrialBridge AI is a **decision-support tool, not a decision-maker**. Every screen reminds clinicians that final eligibility is always confirmed by a qualified professional, and the demo runs on synthetic data — no real patient information.

TrialBridge AI turns hours of manual chart review into minutes of guided, explainable matching — getting the right patients to the right trials, faster. Thank you."

---

## Quick-reference talking points (if you go off-script)

- **Problem:** patient recruitment is the #1 cause of trial delays.
- **Value:** ranked, *explainable* matches — met / not met / missing per criterion.
- **Engine:** deterministic + weighted scoring; missing data = partial credit, not a fail.
- **Stack:** Next.js, Drizzle, Aurora PostgreSQL, AWS IAM/OIDC auth.
- **Safety:** decision-support only; clinician confirms; synthetic data in demo.

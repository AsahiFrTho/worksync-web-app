# KaushalSetu 

A minimal, presentation-ready web app for a **government skilling ecosystem** to track learner outcomes over time — in a **consent-first, privacy-conscious, low-effort** way.

> Built for hackathon / innovation-demo use. Sample data loads automatically; everything runs locally in the browser. No backend, no setup.

---

## Quick start

```bash
npm install
npm run dev        # opens at http://localhost:5173
```

Production build: `npm run build && npm run preview`

**Demo login:** pick any role on the login screen (Admin, Provider Staff, Field Coordinator, Employer Verifier). No passwords — this is a demo. Switch roles anytime from the top-right menu.

---

## What's inside

| Module | What it does |
| --- | --- |
| **Dashboard** | 10 KPI cards + outcome distribution, placement trend, wage progression, retention (1/3/6/12 mo), skill gaps, non-placement reasons, provider/course/district comparison — all filterable |
| **Learners** | Searchable, sortable table (consent, course, batch, outcome, follow-up, verification) with per-row actions: view profile, add outcome, schedule follow-up, update consent, mark contacted |
| **Learner profile** | Basic profile, consent record, enrolment, **longitudinal timeline** (enrolment → certification → placement → job changes → wage updates → follow-ups → verification → consent events), employment & income history, skill-gap tags, reason codes, notes |
| **Consent management** | First-class consent record (given / date / method / purpose / status). **If consent is not active, names, phones and emails are masked everywhere** and the profile shows a privacy banner |
| **Outcome tracking** | 2-step "Add outcome" form (< 1 min): wage job, self-employment, apprenticeship, higher education, job change, wage update, unemployed, not placed, dropout — with reason codes, custom tags and follow-up scheduling |
| **Follow-ups** | Task queue: overdue / today / upcoming / completed. Log contact, update employment status in the same step, mark unreachable, reschedule, change phone/location. Simulated automated reminders (SMS / WhatsApp / email / IVR) |
| **Employer verification** | Approve, reject, partially verify, request evidence, flag duplicate/suspicious — with methods, remarks and confidence scores that feed placement-quality metrics |
| **Skill gaps** | Gaps by skill / course / district, employer-reported vs learner-reported, training↔job mismatch table, auto-generated recommendations |
| **Analytics & impact** | 12 headline metrics, cohort (batch) analysis, course/provider/district performance, demographics, wage & retention progression, reasons, and an **auto-generated Insights panel** |
| **Provider scorecard** | Composite performance badge (Strong / Improving / Needs attention) across placement, verification, retention, wage growth, data quality, follow-ups |
| **Data quality** | Actionable list of what to fix next: missing consent, no outcome, stale records, unverified employers, missing wages, unreachable phones |
| **Settings** | Editable programme name, districts, reason codes, skill tags, consent policy, retention period, notification rules |

## Sample data (auto-generated, deterministic)

35 learners · 3 providers · 4 courses · 3 districts (Nashik, Nagpur, Pune) · 9 batches — with placed / self-employed / apprentice / unemployed / dropout mixes, employer verifications in all states, follow-ups overdue & completed, 18 months of wage progression, skill-gap reports, reason codes, 2 learners with changed phone/location, and 5 learners whose consent is missing / expired / revoked.

## Privacy model (demo-relevant)

- Consent is per-learner with status, method, purpose and dates
- Non-active consent ⇒ learner name/phone/email hidden in tables, search, follow-up queue and verification; profile shows a red banner instead
- Analytics always aggregate; person-level detail requires active consent
- “Reset demo data” in the sidebar restores the original dataset

## Tech

React 18 + Vite · Tailwind CSS · Recharts · Zustand (localStorage persistence) · lucide-react icons. No server required.

## 3-minute demo flow

1. **Login as Admin** → dashboard KPIs (consent, placement, follow-ups, verification, wage growth)
2. Outcome distribution + wage progression charts (filters work live)
3. Open learner **Snehal Jadhav** → consent record + 18-month timeline
4. **Add outcome** (Wage Update, ~30 seconds)
5. **Follow-ups** → mark an overdue call *Contacted* (updates employment status too)
6. **Employer Verification** → approve a pending employer with a confidence score
7. **Skill gaps** → top gaps + recommendations; **Scorecard** → provider comparison
8. **Data Quality** → what to fix next + Insights panel

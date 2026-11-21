# PROJECT_MASTER — CitiSOLVE

**Project Name:** CitiSOLVE — AI-Powered Citizen Civic Issue Reporting and Resolution Platform  
**Tagline:** Your City. Your Voice. Your Impact.  
**Current Stage:** Dual-Role Connected Web Application (Citizen Portal + Government Official Dashboard in Demonstration Mode + Server-Side Gemini Proxy)  
**Target Scope (Active):** Dual-role Citizen (`/home`, `/report`, `/issues/:id`, `/status`, `/rewards`, `/history`, `/profile`) and Government Official (`/official`, `/official/complaints`, `/official/complaints/:id`, `/official/map`, `/official/departments`, `/official/escalations`, `/official/analytics`, `/official/notifications`, `/official/profile`) experiences sharing a unified local complaint data store.

---

## 1. Project Vision & Problem Statement

### Vision
CitiSOLVE empowers residents across Indian municipal wards to report local civic infrastructure hazards, support nearby issues, track transparent 7-stage municipal progress, earn participation recognition, and confirm or dispute completed work—while equipping municipal Ward Officers, Department Officers, and Municipal Admins with an operational command portal for verification, AI override auditing, multi-department assignment, SLA enforcement, and 4-state escalation tracking.

### Problem Statement
Indian municipal corporations receive high volumes of civic complaints that are often incomplete, duplicated by multiple neighbors, routed to the wrong department, prioritized by loudness rather than physical danger, and opaque to the reporting citizen. CitiSOLVE unifies citizen intake (live camera, regional voice-to-text, Gemini AI triage) with an accountable Government Official workflow that prioritizes physical safety and SLA deadlines over vote counts, logs every AI override and internal note separately from public views, and requires citizen confirmation before closing tickets.

---

## 2. Confirmed Decisions, Demonstration Scope & Real Integrations

### Implemented Architecture
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 (`Plus Jakarta Sans`, `Public Sans`, `JetBrains Mono`) with shared `CitiSolveContext` persisted in `localStorage` (`citisolve_demo_state_v1`) and `sessionStorage` (`citisolve_session_submitted_v1`), OpenStreetMap + Leaflet (`leaflet`) ward maps, and strict role-based routing guards (`ProtectedCitizenRoute` & `ProtectedOfficialRoute`).
- **Compact Dual-Role Authentication (`/`):** Clean centered `#F8FAFC` / `#FFFFFF` / `#0F766E` login interface with Citizen and Government Official role selector, Citizen Login / Registration / Google Sign-In (Demo) / Forgot Password, and Government Official Login (Employee ID or Official Email + Password, Forgot Password notice, zero citizen registration options).
- **Permissions:** `metadata.json` enables `camera`, `geolocation`, and `microphone` frame permissions, wired to explicit live GPS and camera controls.
- **Backend (`server.ts`):** Node.js + Express server on port `3000` hosting Vite middleware in dev and static `dist/` in production, exposing `/api/health`, `/api/ai/analyze-complaint`, and `/api/official/verify-access` (role + municipality + ward guard returning `403` on unauthorized access).
- **AI Integration:** Server-side `@google/genai` SDK calling `gemini-4-hydrogen` with structured JSON `responseSchema` when `GEMINI_API_KEY` is configured in server secrets. When `GEMINI_API_KEY` is absent, `/api/ai/analyze-complaint` returns HTTP `503` (`GEMINI_NOT_CONFIGURED`) and the frontend transparently executes clearly-labelled **Sample Demonstration Triage** rules.
- **Database Strategy:** MySQL remains the planned production relational database. Currently, citizen and official workflows share browser `localStorage` (`citisolve_demo_state_v1`).

### Unresolved Decisions Requiring Production Configuration
1. **External MySQL Hosting:** Provision external MySQL credentials (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) and migrate `CitiSolveContext` mutations to authenticated Express `/api/*` SQL endpoints.
2. **Production Government SSO & Credential Verification:** Replace demonstration official accounts (`BBMP-W80-01`, `BBMP-ELEC-04`, `BBMP-ADM-01`) with municipal SSO / OAuth / RBAC JWT verification.
3. **Official Ward Boundary Polygons & Map Provider:** Connect official ULB GIS GeoJSON polygons for exact ward boundary enforcement.
4. **Authorised Reward Programme:** Link Bronze (50), Silver (75), and Gold (100) recognition certificates to an authorised municipal civic programme if launched with an urban local body.

---

## 3. Complete Feature Scope

### Citizen Experience (Implemented)
- **Welcome & Authentication (`/`):** Minimal dual-role login card (`Citizen` / `Government Official`), Citizen Login, Create Account, Google Sign-In (Demo), language & ward selection, age/guardian consent, and GPS/camera permission checks.
- **Citizen Home (`/home`):** Mobile-first greeting header, 2×2 Quick Action tiles, OpenStreetMap + Leaflet map (`2 km` / `5 km` / `All`), current-session submitted strip, and `"Near you"` feed.
- **Guided Report Issue & Duplicate Check (`/report`):** 8 categories, live camera capture, GPS metadata, regional voice-to-text, Gemini/Demo AI triage, and non-auto-merging duplicate check.
- **Issue Detail & Citizen Confirmation/Dispute (`/issues/:id`):** Complete complaint dossier, AI triage explanation, single-vote-per-account toggle, 7-stage timeline, Resolution Evidence display, **Confirm Issue Is Resolved (+10 pts)**, and **Dispute Resolution (Issue Persists)** returning disputed issues to `Under Process` for official review.
- **Status & Escalation Dashboard (`/status`):** Current-session tracking + 4-tile summary + 7-stage progress bars.
- **My Points & Rewards (`/rewards`):** Earned/pending points, golden-token Reward Bucket, certificates, and leaderboards.
- **Personal & Community History (`/history`):** Personal stats + multi-level Community Explorer.
- **Profile & Settings (`/profile`):** Profile editing, privacy display alias, permissions, logout, and two-step `DELETE` account removal.

### Government Official Experience (Implemented)
- **Official Layout (`OfficialLayout`):** Collapsible left sidebar with 8 modules, top jurisdiction scope header, unread official notifications popover, official profile link, and sign-out.
- **1. Official Dashboard (`/official`):** 7 KPI cards, Critical & Overdue SLA alert banners, safety+SLA priority-sorted queue, recent activity feed, category & status summaries, ward overview, and department performance.
- **2. Complaint Management (`/official/complaints`):** 10-column operational table with search, 10 filter tabs (`All`, `Submitted / Pending Review`, `Assigned`, `In Progress`, `Critical`, `Overdue SLA`, `Escalated`, `Awaiting Citizen Confirmation`, `Resolved`, `Rejected`), safety+SLA sorting, and pagination.
- **3. Complaint Details & Action Console (`/official/complaints/:id`):** Citizen evidence, AI reasoning, potential duplicate ward links, Verify/Reject with mandatory rejection reason, Category/Severity AI Override with mandatory reason & audit trail, Multi-Department & Staff assignment + Assignment History, Target Resolution Date, Private Internal Remarks (strictly hidden from citizen views), Public Progress Updates, and Resolution Workflow (`Resolved – Awaiting Citizen Confirmation` with mandatory note & optional after-work photo upload).
- **4. Ward Map (`/official/map`):** Leaflet + OpenStreetMap map scoped to authorized jurisdiction with severity-colored pins, clustering, approximate ward overlay, category/status filters, and marker detail panel.
- **5. Department & Staff (`/official/departments`):** Standard category-to-department routing table, cross-department assignment console, field officer directory with live active workload, and assignment audit trail.
- **6. Escalations (`/official/escalations`):** Configurable SLA targets per severity, Overdue/Approaching/Critical queue, and explicit 4-state escalation verification (`Initiated` -> `Transmitted` -> `Receipt Confirmed` -> `Authority Acknowledged`).
- **7. Reports & Analytics (`/official/analytics`):** Date range, ward, category, and department filters; KPI cards; time, category, and severity charts; repeated issue areas; and department/ward performance tables.
- **8. Notifications (`/official/notifications`):** Jurisdiction alerts across all 8 required trigger types (`new_complaint`, `critical_issue`, `assignment`, `approaching_deadline`, `overdue`, `reassignment`, `citizen_feedback`, `escalation`).
- **9. Official Profile & Audit (`/official/profile`):** Jurisdiction credentials, live backend `/api/official/verify-access` check, full `officialAuditLog`, demonstration role switcher, sign-out, and data reset.

---

## 4. Feature Implementation Status

| Feature / Layer | Status | Mode / Notes |
| :--- | :--- | :--- |
| **Compact Dual-Role Login (`/`)** | Implemented (Demo Auth) | Strict Citizen vs. Government Official UI & route isolation. |
| **Citizen Portal (`/home`, `/report`, etc.)** | Implemented | Connected React Router pages + citizen confirm/dispute resolution loop. |
| **Government Official Portal (`/official/*`)** | Implemented | All 8 sidebar modules + Complaint Detail & Action Console sharing `CitiSolveContext`. |
| **Express Server + Gemini API + Role Guard** | Implemented | `/api/health`, `/api/ai/analyze-complaint`, and `/api/official/verify-access`. |
| **MySQL Database & Municipal SSO** | Not Implemented | Deferred to external MySQL & ULB SSO integration phase. |

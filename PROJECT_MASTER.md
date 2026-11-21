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
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 (`Plus Jakarta Sans`, `Public Sans`, `JetBrains Mono`) with shared `CitiSolveContext` persisted in `localStorage` (`citisolve_demo_state_v1`) and `sessionStorage` (`citisolve_session_submitted_v1`), OpenStreetMap + Leaflet (`leaflet`) ward maps, full 7-language dynamic i18n (`en`, `hi`, `kn`, `mr`, `ta`, `te`, `bn` via `useTranslation` and `LanguageSelector` across all Citizen, Municipal Officer, and Ward Officer screens), and strict role-based routing guards (`ProtectedCitizenRoute` & `ProtectedOfficialRoute`).
- **Compact Dual-Role Authentication (`/`):** Clean centered `#F8FAFC` / `#FFFFFF` / `#0F766E` login interface with Citizen and Government Official role selector, Citizen Login / Registration / Google Sign-In (Demo) / Forgot Password, and Government Official Login (`Municipal Officer` `BBMP-MUN-01` and `Ward Officer` `BBMP-W80-01`, Forgot Password notice, zero citizen registration options).
- **Permissions:** `metadata.json` enables `camera`, `geolocation`, and `microphone` frame permissions, wired to explicit live GPS and camera controls.
- **Backend (`server.ts`):** Node.js + Express server on port `3000` hosting Vite middleware in dev and static `dist/` in production, exposing `/api/health`, `/api/ai/analyze-complaint`, and `/api/official/verify-access` (role + municipality + ward guard returning `403` on unauthorized access).
- **AI Integration:** Server-side `@google/genai` SDK calling `gemini-4-hydrogen` with structured JSON `responseSchema` when `GEMINI_API_KEY` is configured in server secrets. When `GEMINI_API_KEY` is absent, `/api/ai/analyze-complaint` returns HTTP `503` (`GEMINI_NOT_CONFIGURED`) and the frontend transparently executes clearly-labelled **Sample Demonstration Triage** rules.
- **Database Strategy:** MySQL remains the planned production relational database. Currently, citizen and official workflows share browser `localStorage` (`citisolve_demo_state_v1`).

### Unresolved Decisions Requiring Production Configuration
1. **External MySQL Hosting:** Provision external MySQL credentials (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) and migrate `CitiSolveContext` mutations to authenticated Express `/api/*` SQL endpoints.
2. **Production Government SSO & Credential Verification:** Replace demonstration official accounts (`BBMP-MUN-01`, `BBMP-W80-01`) with municipal SSO / OAuth / RBAC JWT verification.
3. **Official Ward Boundary Polygons & Map Provider:** Connect official ULB GIS GeoJSON polygons for exact ward boundary enforcement.
4. **Authorised Reward Programme:** Link Bronze (50), Silver (75), and Gold (100) recognition certificates to an authorised municipal civic programme if launched with an urban local body.

---

## 3. Complete Feature Scope

### Citizen Experience (Implemented)
- **Welcome & Authentication (`/`):** Minimal dual-role login card (`Citizen` / `Government Official`), Citizen Login, Create Account, Google Sign-In (Demo), 7-language switcher, ward selection, age/guardian consent, and GPS/camera permission checks.
- **Citizen Home (`/home`):** Mobile-first greeting header, 2×2 Quick Action tiles, OpenStreetMap + Leaflet map (`2 km` / `5 km` / `All`), current-session submitted strip, and `"Near you"` feed.
- **Guided Report Issue & Duplicate Check (`/report`):** 8 categories, live camera capture, GPS metadata, regional voice-to-text, auto-assigned department routing, Gemini/Demo AI triage, and non-auto-merging duplicate check.
- **Issue Detail & Citizen Confirmation/Dispute (`/issues/:id`):** Complete complaint dossier, AI triage explanation, single-vote-per-account toggle, 7-stage timeline, Resolution Evidence display, **Confirm Issue Is Resolved (+10 pts)**, and **Dispute Resolution (Issue Persists)** returning disputed issues to `Under Process` for official review.
- **Status & Escalation Dashboard (`/status`):** Current-session tracking + 4-tile summary + 7-stage progress bars.
- **My Points & Rewards (`/rewards`):** Earned/pending points, golden-token Reward Bucket, certificates, and leaderboards.
- **Personal & Community History (`/history`):** Personal stats + multi-level Community Explorer.
- **Profile & Settings (`/profile`):** Profile editing, global language switching, privacy display alias, permissions, logout, and two-step `DELETE` account removal.

### Government Official Experience (Implemented)
- **Official Layout (`OfficialLayout`):** Role-scoped sidebar (`Municipal Officer` vs. 3-dashboard `Ward Officer`), top jurisdiction scope header, live language selector, unread official notifications popover, official profile link, and sign-out.
- **Municipal Officer Portal (`/official/*`):** Operational Dashboard, Complaint Management Queue, Complaint Details & Action Console, Ward Map, read-only Auto-Assigned Departments & Complaint Status Track, Escalation & SLA Controls, Analytics, Notifications, and Official Profile & Audit Log.
- **Ward Officer 3-Dashboard Workspace (`/official/ward-map`, `/official/ward-track`, `/official/ward-solved`):** Focused 3-view portal featuring Ward Map & Severity triage, Department & Complaint Report Track, Solved Complaints Status synced to Citizen & Municipal portals, and GPay-style green `SolvedSuccessModal`.

---

## 4. Feature Implementation Status

| Feature / Layer | Status | Mode / Notes |
| :--- | :--- | :--- |
| **Compact Dual-Role Login (`/`)** | Implemented (Demo Auth) | Strict Citizen vs. Government Official (Municipal / Ward Officer) UI & route isolation. |
| **Citizen Portal (`/home`, `/report`, etc.)** | Implemented | Connected React Router pages + auto-department routing + confirm/dispute loop. |
| **Municipal & Ward Official Portals (`/official/*`)** | Implemented | Municipal full modules + Ward Officer 3 dashboards + GPay-style solved confirmation modal. |
| **Full 7-Language Localization (`en/hi/kn/mr/ta/te/bn`)** | Implemented | Reactive global language switcher across Login, Citizen, Municipal Officer, and Ward Officer screens. |
| **Express Server + Gemini API + Role Guard** | Implemented | `/api/health`, `/api/ai/analyze-complaint`, and `/api/official/verify-access`. |
| **MySQL Database & Municipal SSO** | Not Implemented | Deferred to external MySQL & ULB SSO integration phase. |


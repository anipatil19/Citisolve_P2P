# CitiSOLVE — AI-Powered Citizen Civic Issue Reporting and Resolution Platform

> **Tagline:** Your City. Your Voice. Your Impact.

CitiSOLVE is a responsive, dual-role civic-technology web application built for Indian municipal corporations and citizens. Citizens can capture and report local civic infrastructure hazards using live camera capture, GPS coordinates, regional voice-to-text, and Gemini AI triage, while Municipal Officers and Ward Officers track auto-assigned complaints, monitor OpenStreetMap severity clusters, enforce SLAs, and close tickets with transparent citizen verification.

---

## Key Features

### 1. Compact Dual-Role Authentication (`/`)
- **Citizen Portal Login & Registration:** Phone/email login, Google Sign-In (demonstration), account registration with preferred Indian language, age/guardian eligibility check, ward selection, and live GPS/camera permission prompts.
- **Government Official Login:** Strict 2-role selector with **Municipal Officer** (`BBMP-MUN-01`) and **Ward Officer** (`BBMP-W80-01`) sign-in options and zero citizen registration clutter.
- **Strict Role & Jurisdiction Isolation:** Separate route guards (`ProtectedCitizenRoute`, `ProtectedOfficialRoute`) prevent cross-portal navigation, and server-side `/api/official/verify-access` checks official role, municipality, and ward headers.

### 2. Citizen Experience
- **Home & OpenStreetMap Ward View (`/home`):** Mobile-first dashboard with quick-action tiles, interactive Leaflet + OpenStreetMap severity pins (`2 km`, `5 km`, `All` radius rings), zoom clustering, current-session submitted tracker strip, and `"Near you"` community feed with single-vote-per-account upvotes.
- **5-Step Guided Issue Reporting (`/report`):**
  - 8 civic categories (*Potholes & roads, Garbage dumps, Drainage, Electricity, Water issues, Defective streetlights, Fallen trees & road obstructions, Other civic issues*).
  - Live `getUserMedia` camera capture (with explicit no-webcam testing fallback) and browser geolocation metadata.
  - Multilingual voice-to-text (`en`, `hi`, `kn`, `mr`, `ta`, `te`, `bn`) with mandatory citizen transcript verification.
  - Server-side Gemini AI triage (`/api/ai/analyze-complaint`) with transparent rule-based demonstration fallback when `GEMINI_API_KEY` is absent, automatic primary department assignment, safety-first severity grading, and non-auto-merging duplicate detection.
- **Status & 7-Stage Lifecycle Tracking (`/status`, `/issues/:id`):** Track reports across all 7 stages (`Submitted -> AI Analysed -> Assigned -> Received by Department -> Under Process -> Resolved Awaiting Confirmation -> Resolution Confirmed`), confirm resolved issues (`+10 pts`), or **dispute resolution** to return unresolved issues for official review.
- **Rewards, Leaderboards & Community History (`/rewards`, `/history`, `/profile`):** Transparent reward ledger (`+5` report, `+2` upvote, `+10` confirmed resolution), Bronze/Silver/Gold certificates, privacy-respecting leaderboards, hierarchical ward-to-country community history, and two-step `DELETE` account removal.

### 3. Government Official Experience
- **Municipal Officer Portal (`/official/*`):**
  - **Operations Dashboard (`/official`):** 7 KPI cards, critical & overdue SLA alerts, safety-and-SLA priority queue, category/status charts, and ward/department summaries.
  - **Complaint Management (`/official/complaints`) & Action Console (`/official/complaints/:id`):** Searchable, filterable 10-column queue; verify/reject with mandatory reason; AI category/severity override with audit trail; private internal remarks (strictly hidden from citizens); progress updates; and resolution evidence upload.
  - **Departments & Track Status (`/official/departments`):** Read-only operational tracking grouped by municipal department showing auto-assigned complaints and live 7-stage progress bars.
  - **Ward Map (`/official/map`), Escalations (`/official/escalations`), Analytics (`/official/analytics`), Notifications (`/official/notifications`), and Profile & Audit (`/official/profile`):** Configurable SLAs by severity, 4-state escalation verification (`Initiated -> Transmitted -> Receipt Confirmed -> Authority Acknowledged`), filtered analytics, and immutable audit log.
- **Ward Officer Portal (3 Focused Dashboards):**
  1. **Map View & Complaint Severity (`/official`):** Severity filter cards + interactive OpenStreetMap pins + quick **Mark as Solved** action.
  2. **Department & Report Track (`/official/ward-track`):** Department-grouped complaints with 7-stage progress bars and field update/solve buttons.
  3. **Solved Complaints Status (`/official/ward-solved`):** Live view of solved complaints synchronized with Citizen and Municipal Officer dashboards.
  - Marking any complaint as solved triggers a **GPay-style green confirmation window** with a checkmark and immediately updates Citizen and Municipal Officer views.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router DOM, Lucide React, Leaflet + OpenStreetMap
- **Backend:** Node.js, Express (`server.ts`)
- **AI Integration:** Google Gemini API via `@google/genai` (`gemini-4-hydrogen`) on `/api/ai/analyze-complaint`
- **Current Persistence Mode:** Shared browser `localStorage` (`citisolve_demo_state_v1`) and `sessionStorage` (`citisolve_session_submitted_v1`) for demonstration mode (MySQL planned for production persistence; see `PROJECT_MASTER.md` and `AUDIT_REPORT.md`)

---

## Project Structure

```text
├── server.ts                          # Express server + Vite middleware + Gemini & Official guard APIs
├── metadata.json                      # App metadata & browser permissions (camera, geolocation, microphone)
├── index.html                         # HTML entry point
├── src/
│   ├── App.tsx                        # Dual-role React Router setup & route isolation guards
│   ├── constants/civicDomain.ts       # Categories, departments, SLA defaults, languages, reward rules
│   ├── context/CitiSolveContext.tsx   # Shared Citizen & Official state store
│   ├── data/
│   │   ├── demoData.ts                # Seeded demonstration ward issues, rewards, leaderboard
│   │   └── officialDemoData.ts        # Demo Municipal & Ward Officer accounts, notifications, audit log
│   ├── services/civicAiService.ts     # Client wrapper for /api/ai/analyze-complaint + demo fallback
│   ├── components/
│   │   ├── common/                    # Shared badges, icons, safe civic image component
│   │   ├── layout/AppLayout.tsx       # Citizen mobile-first shell + desktop navigation
│   │   ├── map/LeafletWardMap.tsx     # Citizen OpenStreetMap + Leaflet ward map
│   │   └── official/                  # OfficialLayout, OfficialWardMap, SolvedSuccessModal
│   └── pages/
│       ├── WelcomeAuthPage.tsx        # Minimal dual-role login & citizen registration
│       ├── CitizenHomePage.tsx        # Citizen home dashboard & map
│       ├── ReportIssuePage.tsx        # 5-step guided issue reporting & duplicate check
│       ├── IssueDetailPage.tsx        # Dossier, upvotes, confirm/dispute resolution
│       ├── StatusDashboardPage.tsx    # Current-session & 7-stage complaint tracking
│       ├── RewardsDashboardPage.tsx   # Points, reward bucket, certificates, leaderboard
│       ├── HistoryDashboardPage.tsx   # Personal & hierarchical community history
│       ├── ProfileSettingsPage.tsx    # Profile, privacy alias, permissions, account delete
│       └── official/                  # Municipal Officer & Ward Officer dashboards
├── PROJECT_MASTER.md                  # Architecture & feature scope documentation
├── AUDIT_REPORT.md                    # Security boundaries, demo vs real audit, test matrix
└── PROMPT_LOG.md                      # Chronological development & verification log
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your server-side Gemini API key (optional; demonstration rule-based triage activates automatically when omitted):

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

### 3. Run Development Server
Starts Express + Vite middleware on port `3000`:
```bash
npm run dev
```

### 4. Type-Check & Build for Production
```bash
npm run lint
npm run build
npm start
```

---

## Backend API Endpoints

- `GET /api/health` — Returns server status, Gemini configuration flag, and persistence mode.
- `POST /api/ai/analyze-complaint` — Server-side multimodal Gemini triage (returns `503 GEMINI_NOT_CONFIGURED` if `GEMINI_API_KEY` is unset).
- `POST /api/official/verify-access` — Demonstration role & jurisdiction guard verifying `government_official` role, municipality, and authorized ward headers.

---

## Demonstration Accounts

- **Citizen Demo:** Any login or `"Continue with Google (Demo)"` on the Citizen tab (`Ward 80 — Hoysala Nagar`)
- **Municipal Officer:** `BBMP-MUN-01` (`municipal.officer@bbmp.gov.in`, password >= 4 chars)
- **Ward Officer:** `BBMP-W80-01` (`ward.officer@bbmp.gov.in`, password >= 4 chars)

> **Note:** Authentication, seeded ward records, and local storage persistence run in demonstration mode. See `AUDIT_REPORT.md` for production migration requirements (external MySQL and municipal SSO).

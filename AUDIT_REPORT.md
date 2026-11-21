# AUDIT_REPORT — CitiSOLVE

**Audit Scope:** Dual-Role Authentication, Citizen Portal, Government Official Dashboard, Express + Gemini + Role Guard, Privacy & Verification  
**Last Updated:** 2026-11-21

---

## 1. Demonstration Mode vs. Real Integration Boundaries

1. **Real Implemented Integrations:**
   - **Express Server (`server.ts`):** Serves `/api/health`, `/api/ai/analyze-complaint`, and `/api/official/verify-access` on port `3000`.
   - **Server-Side Google Gemini API:** When `GEMINI_API_KEY` is configured in environment secrets, `/api/ai/analyze-complaint` executes `ai.models.generateContent` (`gemini-4-hydrogen`) with multimodal image + text + candidate comparison and structured JSON schema output.
   - **Backend Role & Jurisdiction Guard:** `POST /api/official/verify-access` validates `x-citisolve-role: government_official`, `x-citisolve-municipality`, and `x-citisolve-wards`, returning HTTP `403` for citizens or out-of-jurisdiction municipality/ward requests.
   - **Browser Capabilities:** Real `navigator.mediaDevices.getUserMedia` live camera capture, `navigator.geolocation` coordinates/accuracy, `SpeechRecognition` voice-to-text where supported, Leaflet + OpenStreetMap rendering, and `localStorage` / `sessionStorage` persistence.
2. **Clearly Labelled Demonstration Features:**
   - **Database Persistence:** Uses browser `localStorage` (`citisolve_demo_state_v1`) seeded with 9 realistic Indian municipal complaints (8 in `BBMP Bengaluru East` + 1 out-of-jurisdiction complaint `CS-BLR-2026-1052` in `BBMP Bengaluru South` to demonstrate strict jurisdiction scoping). MySQL is not yet connected.
   - **Authentication & Official Roster:** Citizen login, Google Sign-In, and Government Official accounts (`BBMP-W80-01` Ward 80 Officer, `BBMP-ELEC-04` Electrical Dept Officer, `BBMP-ADM-01` Municipal Admin) are explicitly labelled demonstration credentials with no live municipal SSO directory.
   - **AI Fallback:** When `GEMINI_API_KEY` is absent (`503 GEMINI_NOT_CONFIGURED`), the client transparently displays `"Demonstration Sample Analysis Used"` and executes local rule-based triage.
   - **Ward Boundaries & Escalation Transmission:** Approximate ward radius circles and escalation state transitions operate on demonstration data without external municipal SMS/email gateway integration.

---

## 2. Requirement Loopholes & Known Limitations

1. **External MySQL & Server-Side Auth Pending:** Currently, role isolation between Citizen (`/home`) and Government Official (`/official`) is enforced by React route guards (`ProtectedCitizenRoute`, `ProtectedOfficialRoute`), mutually exclusive state in `CitiSolveContext`, and the demonstration `/api/official/verify-access` endpoint. Production deployment requires signed HTTP-only session cookies/JWTs and server-enforced SQL queries filtering complaints and stripping `internalRemarks` before payload serialization.
2. **Browser Speech Recognition & Webcam Hardware:** Non-Chromium browsers receive a clear notice + sample regional transcript helper; devices without a webcam receive an explicit diagnostic fallback frame for testing.
3. **Age/Guardian Verification:** Legal guardian verification awaits real Aadhaar/OTP/DPDP compliance workflows.

---

## 3. Privacy & Security Controls Implemented

- **No Frontend Secrets:** `GEMINI_API_KEY` is accessed strictly inside `server.ts`.
- **Private Internal Remarks Isolation:** `internalRemarks` and `officialAuditLog` are rendered exclusively inside `/official/*` components and never exposed in Citizen Issue Details, Status, or Home views.
- **Strict Role & Jurisdiction Scoping:**
  - Logging in as Citizen clears `currentOfficial`; logging in as Official clears `currentUser`.
  - Citizens are redirected away from `/official/*`; Government Officials are redirected away from citizen routes.
  - `isIssueInOfficialJurisdiction` restricts officials to their authorized `municipality`, `authorizedWards`, and (for `department_officer`) `assignedDepartments`.
  - Out-of-jurisdiction complaint `CS-BLR-2026-1052` (`BBMP Bengaluru South`) is blocked from `BBMP Bengaluru East` officials both in UI lists and direct URL inspection.
- **Safety-First Queue Ranking:** Official priority queues sort by physical safety severity (`Critical -> High -> Medium -> Low`), overdue SLA status, and earliest SLA deadline (`sortIssuesBySafetyAndSla`), never solely by upvote popularity.
- **Accountable AI Overrides & Rejections:** Overriding AI category/severity or rejecting a complaint requires a mandatory reason and writes an immutable entry to `aiOverrideHistory` and `officialAuditLog`.
- **Honest Escalation States & Resolution Loop:** Escalations distinguish `Initiated`, `Transmitted`, `Receipt Confirmed`, and `Authority Acknowledged` without claiming receipt before confirmation. Official resolution moves complaints to `Resolved – Awaiting Citizen Confirmation`, allowing citizens to confirm closure or submit a dispute returning the ticket to `Under Process`.

---

## 4. Testing Results & Verification Log

| Check | Scope | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Stage 0–3 Citizen Releases** | Initial shell, 9 citizen pages, mobile-first OSM/Leaflet, session report tracking | **Passed** | Verified via `compile_applet`, `lint_applet`, and live Express checks. |
| **Dual-Role Login & Official Dashboard Build** | Minimal login UI, 8 official sidebar pages + complaint detail, citizen dispute loop, `/api/official/verify-access` | **Pending Final Verification Below** | Will be verified via co-executed `compile_applet` + `lint_applet`, server restart, and endpoint `curl` checks. |

---

## 5. Unresolved Risks
- **Client-Side Storage Tamper Boundary:** `localStorage` can be edited in browser DevTools until external MySQL + signed JWT backend APIs replace local persistence.
- **ULB Boundary GeoJSON Accuracy:** Accurate ward polygon geofencing requires official municipal GIS integration.

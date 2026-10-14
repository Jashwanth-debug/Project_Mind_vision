# MindVision Project Context & Technical Architecture Notes

Use this document as the complete context prompt for Gemini or any incoming AI assistant/engineer to build new add-ons, features, and integrations.

---

## 1. Executive Summary

**MindVision** is a production-grade, patient-facing mental wellness check-in web application combined with a decoupled clinical telemetry and teletherapy infrastructure.

* **Patient Experience:** Calm, reassuring, consumer-friendly (similar in aesthetic and tone to Headspace, Calm, and Oscar Health). Non-technical patients interact with a gentle 2-minute check-in, review human reflections ("Steady & calm pattern reported"), and can connect with licensed healthcare professionals.
* **Clinician / Administrative Experience:** Role-gated behind server-side authentication. Licensed providers have access to multimodal telemetry (FACS action units AU04 brow furrow, AU15 lip corner depressor, acoustic pitch jitter, cross-modal incongruence indices, and automated SOAP clinical notes).

---

## 2. Tech Stack & Environment

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Modular functional components with React Hooks. Fast HMR. |
| **Styling & Design System** | Vanilla CSS Tokens | Centralized in `frontend/src/index.css`. Dual theme (`data-theme="light"` and `data-theme="dark"`). Zero Tailwind. |
| **Accessibility & Typography** | WCAG AA Compliant | All text/background contrast ratios exceed 4.5:1 (up to 14.5:1). Typography: Google Fonts Inter, Plus Jakarta Sans, JetBrains Mono. |
| **Backend Server** | Node.js native HTTP | Lightweight, zero-external-dependency standalone server in `backend/src/server.js` listening on port 5001. |
| **Security & Auth** | RFC 7519 HMAC-SHA256 JWT | Built-in Node `crypto` implementation (`backend/src/middleware/auth.js`) with constant-time comparison to prevent timing attacks. |
| **State & Cross-Tab Sync** | LocalStorage + BroadcastChannel | `mindvision_p2p_channel` synchronizes patient consultation requests, doctor availability, and admin approvals in real time. |

---

## 3. Directory Layout & Key Files

```text
├── backend/
│   ├── src/
│   │   ├── server.js                   # Node HTTP server & SimpleRouter with middleware chaining
│   │   ├── controllers/
│   │   │   ├── doctorController.js     # Auth, doctor registration, approvals, consultations
│   │   │   ├── telemetryController.js  # Longitudinal sessions, timeline, delta calculation
│   │   │   └── auditController.js      # Immutable clinical audit trail
│   │   ├── middleware/
│   │   │   └── auth.js                 # JWT generation/verification & requireAuth(['ROLE']) RBAC
│   │   ├── routes/
│   │   │   ├── doctorRoutes.js         # Public directory + protected consultation/admin routes
│   │   │   ├── telemetryRoutes.js      # Protected clinician telemetry endpoints
│   │   │   └── auditRoutes.js          # Protected audit trail endpoints
│   │   └── services/
│   │       ├── doctorAuthService.js    # Doctor registry, session management, consultation state
│   │       ├── telemetryTimelineService.js # Timeline buffer & longitudinal simulation
│   │       └── clinicalAuditService.js # Audit trail event logging
│   └── test/
│       └── auth.test.js                # Native Node.js test suite for auth & token validation
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Root component, theme switching, tab navigation, modals
│   │   ├── index.css                   # Global CSS design tokens, typography, cards, animations
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # 4-item patient nav (Home, Check-ins, Talk, Help) + theme toggle
│   │   │   ├── HomeOverview.jsx        # Patient greeting, single primary CTA, latest reflection card
│   │   │   ├── ScreeningAssessment.jsx # 4-question adaptive intake flow (camera/mic/text)
│   │   │   ├── PatientHistoryView.jsx  # Past reflections timeline with filter pills & details
│   │   │   ├── DoctorMarketplace.jsx   # Verified doctor directory, booking intake, instant consults
│   │   │   ├── DoctorAuthModal.jsx     # Provider login & registration modal
│   │   │   ├── ClinicianPortal.jsx     # Role-gated clinician workstation (FACS, AU4/15, SOAP)
│   │   │   ├── AdminVerificationView.jsx # Admin panel to review/approve newly registered doctors
│   │   │   └── Footer.jsx              # Confidentiality trust badge & quiet wellness disclaimer
│   │   ├── utils/
│   │   │   ├── terminology.js          # Human-friendly status mapping (replaces raw ML jargon)
│   │   │   ├── conversationEngine.js   # Voice synthesis, conversational prompts, empathy phrases
│   │   │   └── telemetryMath.js        # Signal calculation, landmark normalization, sentiment math
│   │   ├── data/
│   │   │   └── clinicians.js           # Verified specialist database (NIMHANS, AIIMS, Apollo)
│   │   └── services/
│   │       ├── doctorAuthService.js    # Client-side session and P2P BroadcastChannel signaling
│   │       └── clinicalAuditService.js # Audit trail client logger
│   └── index.html                      # HTML5 entry point
│
├── HANDOFF.md                          # Full project audit report, verified scope & test evidence
└── GEMINI_HANDOVER_NOTES.md            # This notes document
```

---

## 4. Current Working Features

1. **Patient Home Screen (`HomeOverview.jsx`):**
   * Personalized greeting: `"Hi there, how are you feeling today?"`
   * Single obvious primary action: `"Start Check-in ›"` (takes 2–3 minutes).
   * Warm previous reflection card: `"Steady & calm pattern reported"` with supportive self-care guidance.
   * Secondary action cards: `"See my past check-ins"` and `"Talk to someone"`.
   * Reassuring 24/7 Crisis Lifeline card (Call or Text **988**, text HOME to **741741**).
   * Transparent privacy note: reflections are confidential and never shared without explicit permission.

2. **Adaptive Check-in Flow (`ScreeningAssessment.jsx`):**
   * Reassuring permissions explanation (camera & microphone are completely optional).
   * Explicit `"Type instead of talk"` checkbox for full text-only check-in.
   * 4-question adaptive intake sequence with calm audio playback, speech recognition, and empathetic guide responses.
   * All raw MediaPipe landmarks, facial bounding boxes, and ML debug overlays are completely hidden from patients.

3. **Results & History (`ScreeningAssessment.jsx` & `PatientHistoryView.jsx`):**
   * Non-diagnostic status reflection (`"Steady & calm pattern reported"`).
   * Everyday language explainability drawer (`"Want more detail?"`) describing words, speaking rhythm, and facial relaxation without raw AU scores or model names.
   * Button to download/export personal reflection notes.
   * Immediate persistence to `PatientHistoryView` under `"Past Reflections"` with `"Latest Check-in"` badge.

4. **Doctor Marketplace (`DoctorMarketplace.jsx`):**
   * Browse verified psychiatrists, clinical psychologists, and neurotherapists.
   * Live availability status (ONLINE / BUSY / OFFLINE).
   * Instant consultation booking that packages an intake snapshot and transmits it across tabs via `BroadcastChannel`.

5. **Role-Gated Clinician & Admin Workspace:**
   * Discrete provider login modal in the top nav.
   * Clinician view displays full diagnostic telemetry (AU04, AU15, acoustic jitter, incongruence score, and AI SOAP note synthesis).
   * Admin view reviews pending medical registrations, medical license numbers (NMC/DNB), and approves/rejects doctors.

6. **Dual Theme Design System (`index.css`):**
   * **Daylight Mode (`data-theme="light"`):** Soft warm off-white canvas (`#FAFAF9`), clean white cards (`#FFFFFF`), calming sage teal (`#257C6F`), warm dark charcoal text (`#2A2A2E`, 13.7:1 contrast).
   * **Evening Mode (`data-theme="dark"`):** Deep titanium obsidian (`#0B0F14`), dark slate card surfaces (`#151C25`), bright off-white headings (`#E6EDF3`, 14.5:1 contrast), slate-400 subtitles (`#94A3B8`, 6.69:1 contrast).
   * Theme toggles seamlessly via the sun/moon button and persists in `localStorage.getItem('mindvision_theme')`.

7. **Backend Route Authorization (`backend/src/server.js` & `middleware/auth.js`):**
   * Public: `/`, `/api/health`, `/api/doctors`, `/api/doctors/verified`, `/api/doctors/register`, `/api/doctors/login`, `POST /api/doctors/consultations`.
   * Protected (`DOCTOR` / `ADMIN`): `/api/telemetry/timeline`, `/api/telemetry/longitudinal`, `/api/telemetry/delta`, `/api/doctors/consultations`, `/api/audit`.
   * Protected (`ADMIN` only): `/api/telemetry/reset`, `/api/doctors/:id/approve`, `/api/doctors/:id/reject`, `/api/audit/clear`.
   * Test tokens supported: `Bearer test-doctor-token`, `Bearer test-admin-token`.

---

## 5. Architectural Invariants & Rules for New Add-ons

When creating new features, components, or add-ons, **strictly adhere to these principles**:

1. **No Patient-Facing Jargon or Raw Scores:**
   * Never show AU codes (e.g., `AU04`, `AU15`), FACS labels, model names (MediaPipe, PyFeat), or raw numeric severity indices to patients.
   * Always map metrics using `getHumanStatus()` or friendly descriptive phrases via `frontend/src/utils/terminology.js`.
2. **Non-Diagnostic Wellness Tone:**
   * MindVision is a self-reflection companion, not an autonomous medical device.
   * Do not use over-reassuring medical diagnosis copy (e.g. avoid *"You are medically stable"* or *"You're doing okay"*).
   * Use descriptive language: *"Steady pattern reported"*, *"Based on your self-reported answers and estimated cues"*.
3. **Qualified Privacy Language:**
   * Never state *"Never shared"* or *"100% on-device"* without qualification.
   * Use: *"Your check-in reflections are kept confidential and are never shared without your permission."*
4. **Use Centralized CSS Tokens:**
   * Do not hardcode `#FFFFFF` or `#000000` for card backgrounds or text.
   * Use `var(--bg-primary)`, `var(--card-bg)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--accent-teal)`, and `var(--border-color)`.
   * Test both Daylight and Evening themes for any new component to ensure WCAG AA contrast (≥ 4.5:1).
5. **Backend Endpoint Security:**
   * If adding new backend routes that return patient records, consultation data, or clinical telemetry, always wrap the router registration with `requireAuth(['DOCTOR', 'ADMIN'])`.

---

## 6. How to Run, Test, and Build

```bash
# Start backend server (Port 5001)
node backend/src/server.js

# Start frontend dev server (Port 5173)
npm --prefix frontend run dev

# Run backend test suite (Native Node test runner)
npm --prefix backend test

# Production bundle build
npm --prefix frontend run build

# Frontend lint check (Oxlint)
npm --prefix frontend run lint
```

---

## 7. Recommended Add-ons & Roadmap Ideas

If asked to build new add-ons, here are natural extensions that fit MindVision's architecture:

1. **Guided Micro-Interventions / Breathing Exercises:**
   * 1-minute calming box breathing orb with gentle audio chimes when a patient reports elevated tension.
2. **Longitudinal Mood Trends & Journaling Export:**
   * Weekly/monthly mood trajectory graph with downloadable PDF summary for therapy appointments.
3. **Live WebRTC Teletherapy Video Call:**
   * Connect patient and doctor using a WebRTC room provider (e.g., Daily.co, Twilio, or native peer connection).
4. **Razorpay / Stripe Payment Hold Integration:**
   * Pre-authorization fee holds for paid psychiatric consultations in `DoctorMarketplace.jsx`.
5. **Smart Scheduled Check-in Reminders:**
   * Browser notification / calendar integration for daily or bi-weekly 2-minute reflections.

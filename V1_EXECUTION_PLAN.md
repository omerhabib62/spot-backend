# Spot — V1 Demo Shell: Backend Execution Plan

**Document Version:** 1.0
**Date:** 3 March 2026
**Author:** Backend Engineering
**Scope:** V1 Demo Shell — 12 UI Screens, 34 API Endpoints, 5 Modules
**Stack:** NestJS 11 · TypeScript · PostgreSQL 15 · TypeORM · Passport JWT

---

## Executive Summary

This document outlines the backend execution roadmap for the **Spot V1 Demo Shell** — a preventative mental health monitoring platform for enterprises. The V1 scope delivers a fully functional end-to-end flow: user registration → onboarding wizard → contact management → daily check-in submission, all backed by a passwordless magic-link authentication system.

The backend is structured into five feature modules (**Auth, Onboarding, Dashboard, Check-in, Notifications**) mapped directly to the 12 UI screens defined in the V1 contract. Development follows a strict module-by-module cadence, enabling the frontend team to begin integration as each module is delivered.

---

## Phase A: Architecture & Scaffolding

> **Status: ✅ Completed — 3 March 2026**

All foundational infrastructure and boilerplate is in place. The application compiles, connects to the database, and exposes a health-check endpoint.

### Deliverables

| Area | Detail |
|------|--------|
| **Project Bootstrap** | NestJS 11 application initialised with global `ValidationPipe` (whitelist + transform), `HttpExceptionFilter`, CORS configuration, and `/api` prefix |
| **Database** | Docker Compose with PostgreSQL 15-alpine on port 5433; TypeORM async configuration with `autoLoadEntities` and dev-mode `synchronize` |
| **Entity Layer** | 9 TypeORM entities scaffolded across 5 modules — `User`, `MagicLink`, `OnboardingSession`, `Contact`, `CheckIn`, `CheckInToken`, `NotificationRecipient`, `NotificationLog` |
| **Module Structure** | 5 feature modules registered in `AppModule` — Auth, Onboarding, Dashboard, Check-in, Notifications |
| **Controllers** | All 34 API endpoints defined with correct HTTP methods, route paths, parameter decorators, and response status codes matching the V1 contract |
| **DTOs** | Full request validation DTOs for every endpoint using `class-validator` — 18 DTOs total |
| **Guards & Decorators** | `JwtAuthGuard`, `RolesGuard`, `SessionOwnerGuard`, `@CurrentUser()`, `@Roles()` — all implemented |
| **Common Module** | 6 shared enums (`UserRole`, `UserStatus`, `MagicLinkType`, `OnboardingStatus`, `QuickOption`, `SubscriptionStatus`), pagination DTO, paginated response interface |
| **Environment** | `.env` / `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT` |

### Screen Mapping

All 12 V1 UI screens have corresponding controller endpoints scaffolded:

| Screen | Module | Endpoint(s) |
|--------|--------|-------------|
| Registration Form | Auth | `POST /api/auth/register` |
| Magic Link Sent | Auth | `POST /api/auth/resend` |
| Onboarding Step 1 — Security Affirmation | Onboarding | `POST /start`, `PATCH /step`, `POST /notification-email` |
| Onboarding Step 2A — CSV Upload | Onboarding | `POST /contacts/upload`, `POST /contacts/individual` |
| Onboarding Step 2D — Validation & Pricing | Onboarding | `GET /session/:id` |
| Onboarding Step 3A — Payment | Onboarding | `POST /complete` |
| Onboarding Step 3C — Confirmation | Onboarding | `GET /session/:id` |
| Dashboard — Contacts Tab | Dashboard | `GET/POST/PATCH/DELETE /contacts`, bulk operations |
| Dashboard — Billing Tab | Dashboard | `GET /billing` |
| Dashboard — Settings Tab | Dashboard | `GET/PATCH /settings` |
| Check-in Form | Check-in | `GET /form/:token`, `POST /save-draft` |
| Post-Submission Feedback | Check-in | `POST /submit` |

---

## Phase B: Core Business Logic

> **Status: ⏳ In Progress — Target: This Week (3–6 March 2026)**

Each module's service layer is being implemented in sequence. Controllers, DTOs, and guards are already wired — this phase fills in the business logic behind every endpoint.

---

### B1. Auth Module

> **Status: ✅ Completed — Tuesday, 3 March 2026**

The authentication module is fully implemented with all 7 endpoints operational.

#### Implemented Features

- **Passwordless Magic Links** — Registration and login flows generate single-use, time-limited tokens (15-minute TTL). Tokens are stored in the `magic_links` table with `usedAt` / `invalidatedAt` tracking
- **`_dev_token` Bypass** — During development, the magic link token is returned directly in the API response body, eliminating the need for email infrastructure while testing
- **JWT Authentication** — Stateless Bearer tokens with 15-minute expiry. Payload includes `sub` (user ID), `email`, and `role`. Passport JWT strategy validates and extracts user context
- **User State Machine** — Automatic status transitions: `LEAD_UNCONFIRMED` → `LEAD_CONFIRMED` upon first magic link verification (registration type)
- **Session Management** — `keep-alive` endpoint updates `lastActivityAt` for inactivity tracking; `logout` clears the activity timestamp
- **Employee Login** — Dedicated `/employee/login` endpoint filtered to `EMPLOYEE` role for the Flutter mobile app
- **Resend Flow** — Invalidates all prior active magic links for the user before issuing a new one; link type inferred from current user status

#### Endpoints

```
POST  /api/auth/register       → 202  MagicLinkSentResponse
POST  /api/auth/login           → 202  MagicLinkSentResponse
POST  /api/auth/employee/login  → 202  MagicLinkSentResponse
POST  /api/auth/verify          → 200  { accessToken, user }
POST  /api/auth/resend          → 202  MagicLinkSentResponse
POST  /api/auth/logout          → 204  (requires Bearer token)
POST  /api/auth/keep-alive      → 204  (requires Bearer token)
```

---

### B2. Onboarding Module

> **Target: Wednesday, 4 March 2026**

#### Scope

The onboarding module implements a **multi-step, non-skippable wizard** that transitions a confirmed lead into a paying customer. It manages session state, contact ingestion, and account activation.

#### Features to Implement

| Feature | Detail |
|---------|--------|
| **Session State Machine** | Create/resume onboarding session tied to authenticated user; track `currentStep` (1 → 2A → 2D → 3A → 3C) and `status` (IN_PROGRESS → COMPLETED) |
| **Step Progression** | Validate step transitions are sequential and forward-only; persist `stepData` (JSONB) for each step's form state |
| **Notification Email** | Capture and store the alert recipient email during Step 1 — this becomes the `NotificationRecipient` for the organisation |
| **CSV Contact Upload** | Parse uploaded CSV file against a fixed schema (`firstName`, `lastName`, `email`, `phone?`, `department?`); validate rows; create `Contact` records linked to the session |
| **Individual Contact Add** | Add contacts one at a time as an alternative to CSV upload |
| **Contact Management** | Edit (`PATCH`) and remove (`DELETE`) contacts within the session before finalising |
| **Onboarding Completion** | Finalise the session: transition user status to `CUSTOMER`, set `hasCompletedOnboarding = true`, persist contacts to the Dashboard module's `contacts` table |
| **Session Retrieval** | Return full session state including step data and contact list for frontend hydration |
| **Session Ownership** | `SessionOwnerGuard` (already implemented) ensures users can only access their own sessions |

#### Endpoints (9)

```
POST    /api/onboarding/start
PATCH   /api/onboarding/session/:sessionId/step
POST    /api/onboarding/session/:sessionId/notification-email
POST    /api/onboarding/session/:sessionId/contacts/upload
POST    /api/onboarding/session/:sessionId/contacts/individual
PATCH   /api/onboarding/session/:sessionId/contacts/:contactId
DELETE  /api/onboarding/session/:sessionId/contacts/:contactId
POST    /api/onboarding/session/:sessionId/complete
GET     /api/onboarding/session/:sessionId
```

---

### B3. Dashboard Module

> **Target: Thursday, 5 March 2026**

#### Scope

The dashboard module is the **ongoing admin workspace** for managing contacts, viewing billing, and configuring notification settings. It serves three tabs in the UI.

#### Features to Implement

| Feature | Detail |
|---------|--------|
| **Contact CRUD** | Single-contact create, read, update, and soft-delete with `active` flag |
| **Bulk Operations** | Bulk-create up to 500 contacts per request; bulk-delete by ID array |
| **CSV Import** | Parse CSV against fixed schema (same as onboarding), validate, and persist contacts to the organisation |
| **Paginated Listing** | Return contacts with pagination (`page`, `limit` with max 100) and total count |
| **Organisation Settings** | Get/update the notification recipient email for the organisation |
| **Billing Stub** | Return hardcoded subscription summary (Pro plan, active status, seat count) — Stripe integration is deferred to V2 |
| **Role-Based Access** | All endpoints restricted to `ORG_ADMIN` and `MANAGER` roles via `RolesGuard` |

#### Endpoints (10)

```
GET     /api/dashboard/contacts
POST    /api/dashboard/contacts
GET     /api/dashboard/contacts/:id
PATCH   /api/dashboard/contacts/:id
DELETE  /api/dashboard/contacts/:id
POST    /api/dashboard/contacts/bulk-delete
POST    /api/dashboard/contacts/csv
GET     /api/dashboard/settings
PATCH   /api/dashboard/settings
GET     /api/dashboard/billing
```

---

### B4. Notifications Module

> **Target: Thursday, 5 March 2026 (alongside Dashboard)**

#### Scope

A lightweight module for managing the single notification recipient per organisation and logging alert delivery history. Actual email dispatch via Postmark is deferred — V1 logs the intent.

#### Features to Implement

| Feature | Detail |
|---------|--------|
| **Recipient CRUD** | Create, read, and update the notification recipient (name + email) for an organisation |
| **Notification History** | Return paginated log of past notification events with delivery status |
| **Role-Based Access** | Restricted to `ORG_ADMIN` and `MANAGER` roles |

#### Endpoints (4)

```
POST    /api/notifications/recipient
PUT     /api/notifications/recipient/:id
GET     /api/notifications/recipient
GET     /api/notifications/history
```

---

### B5. Check-in Module

> **Target: Friday, 6 March 2026**

#### Scope

The check-in module handles the **core product interaction** — a daily 10-second form where employees select a mood option and optionally provide a text response. It supports token-based anonymous access (web) and authenticated access (mobile app).

#### Features to Implement

| Feature | Detail |
|---------|--------|
| **Token-Based Form Access** | Validate check-in token (exists, not expired, not used); return form data and any saved draft for pre-population |
| **Three Quick Options** | Accept one of `GOOD`, `OKAY`, or `NOT_GREAT` as the primary response |
| **Optional Text Response** | Accept free-text elaboration alongside the quick option |
| **Draft Auto-Save** | Save partial form state (quick option and/or text) to the `CheckInToken` record; support multiple save calls per session |
| **Form Submission** | Validate token, create `CheckIn` record with `severity: 'stable'` (V1 default), mark token as used |
| **App Today Endpoint** | Return today's check-in status for the authenticated mobile user |
| **Crisis Keyword Detection** | Scan `responseText` against a hardcoded crisis phrase list; set `isCrisisFlagged` on the check-in record if matched |

#### Endpoints (4)

```
GET     /api/checkin/form/:token
POST    /api/checkin/submit
POST    /api/checkin/save-draft
GET     /api/checkin/app/today      (requires Bearer token)
```

---

## Phase C: UI Integration (Frontend Handoff)

> **Status: 🔜 Scheduled — Week of 9 March 2026**

With the full V1 backend delivered by end of week (6 March), frontend integration begins the following week. The frontend team receives all modules, API contracts, and endpoint documentation on **Monday 9 March** and can wire screens in parallel.

### Handoff Schedule

| Date | Backend Module Available | Frontend Wires |
|------|--------------------------|----------------|
| **Mon 9 Mar** | Auth | Screen 1 — Registration Form |
| | | Screen 2 — Magic Link Sent / Resend |
| | | Login flow + JWT token storage |
| **Tue 10 Mar** | Onboarding | Screen 3 — Security Affirmation (Step 1) |
| | | Screen 4 — CSV Upload (Step 2A) |
| | | Screen 5 — Validation & Pricing (Step 2D) |
| | | Screen 6 — Payment (Step 3A) |
| | | Screen 7 — Confirmation (Step 3C) |
| **Wed 11 Mar** | Dashboard + Notifications | Screen 8 — Contacts Tab |
| | | Screen 9 — Billing Tab |
| | | Screen 10 — Settings Tab |
| **Thu 12 Mar** | Check-in | Screen 11 — Check-in Form |
| | | Screen 12 — Post-Submission Feedback |
| **Fri 13 Mar** | — | Integration testing + bug fixes |

### Integration Notes

- **Base URL:** `http://localhost:3000/api` (configurable via `PORT` env)
- **Auth Header:** `Authorization: Bearer <jwt>` on all protected endpoints
- **Error Format:** All errors return `{ statusCode, error, message }` via the global `HttpExceptionFilter`
- **Validation:** Request bodies are validated and sanitised server-side; malformed requests return `400` with field-level error messages
- **CORS:** Configured to accept requests from `FRONTEND_URL` (default `http://localhost:3001`) with credentials

---

## V1 Scope Boundaries

The following items are **explicitly excluded** from the V1 Demo Shell to maintain delivery focus:

| Excluded | Rationale |
|----------|-----------|
| Alerts Module (AI classification) | All check-ins return `severity: 'stable'`; AI integration is V2 |
| Stripe Payment Processing | Billing endpoint returns a hardcoded stub; payment flow is V2 |
| Postmark Email Delivery | Magic link tokens returned in `_dev_token`; email dispatch is V2 |
| AES-256 Encryption | Response text stored in plaintext for demo; encryption is V2 |
| CSV Column Mapping | Fixed schema only (`firstName`, `lastName`, `email`); dynamic mapping is V2 |
| Cron Jobs (daily email cadence) | Token generation and email scheduling are V2 |
| GDPR Export / Erasure | Data extraction and deletion workflows are V2 |
| Rate Limiting | `ThrottlerModule` not included in V1 |
| Multi-recipient Alerts | Single notification recipient per org in V1 |
| Push Notifications / In-app Badges | V2 scope |

---

## Delivery Summary

```
Week 1 — Backend (3–6 March 2026)
─────────────────────────────────────────────────────────────

  Tue   ██████████████████████████████  Auth ✅ + Scaffolding ✅
  Wed   ██████████████████████████████  Onboarding
  Thu   ██████████████████████████████  Dashboard + Notifications
  Fri   ██████████████████████████████  Check-in

─────────────────────────────────────────────────────────────
  Result: Full V1 backend delivered — all 34 endpoints operational

Week 2 — Frontend Integration (9–13 March 2026)
─────────────────────────────────────────────────────────────

  Mon   ██████████████████████████████  Auth screens (1–2)
  Tue   ██████████████████████████████  Onboarding screens (3–7)
  Wed   ██████████████████████████████  Dashboard screens (8–10)
  Thu   ██████████████████████████████  Check-in screens (11–12)
  Fri   ██████████████████████████████  Integration testing + fixes

─────────────────────────────────────────────────────────────
  Result: Full V1 demo shell — end-to-end flow operational
```

---

*This document covers the V1 Demo Shell scope only. Features marked as V2 will be scoped in a separate planning document following V1 delivery and stakeholder review.*

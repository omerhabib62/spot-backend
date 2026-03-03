# Spot Backend Scaffolding Plan — V1 Demo Shell

## Context

The spot-backend project is a fresh NestJS 11 starter (Hello World only). This plan scaffolds a **V1 Demo-Ready MVP** — real CRUD, real auth, but with third-party integrations stubbed and AI/encryption features removed. The goal is to unblock the frontend and demonstrate the core flow: **Auth → Onboarding → Check-ins → Dashboard**.

**You are working in:** `D:\projects\office\spot-backend`
**V1 contract source of truth:** `D:\projects\office\spot\spot-backend-unified-spec-plan.md`

### V1 De-Scoping Summary

| Removed / Simplified | Rationale |
|---|---|
| Alerts module (entire) | AI classification deferred to V2 |
| Stripe integration | Stubbed — always returns hardcoded success |
| Postmark integration | Stubbed — magic-link token returned in response |
| AES-256 encryption | Plaintext storage for demo |
| CSV column-mapping | Fixed-schema CSV only |
| GDPR export/erasure | Deferred to V2 |
| Rate limiting | Removed for demo simplicity |
| Cron jobs / scheduled tasks | Deferred to V2 |
| Postmark webhooks | Deferred to V2 |
| Internal HTTP trigger endpoints | Deferred to V2 |
| `rawBody: true` | Not needed — no webhook signature verification |

---

## Phase 1: Install Dependencies

### Step 1.1 — Production deps
```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/passport passport passport-jwt @nestjs/jwt multer
```

> **V1 Note:** Removed `@nestjs/schedule` (no cron), `@nestjs/throttler` (no rate limiting), `raw-body` (no webhooks), `cookie-parser` (V1 uses BearerAuth only).

### Step 1.2 — Dev deps (types)
```bash
npm install -D @types/passport-jwt @types/multer
```

### Step 1.3 — Create `.env.example`
V1-scoped env vars only:
```
DATABASE_URL=postgres://user:pass@localhost:5432/spot
JWT_SECRET=your-jwt-secret-here
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

> **V1 Note:** Removed `ENCRYPTION_KEY`, `POSTMARK_*`, `STRIPE_*`, `AI_ENDPOINT_API_KEY`, `INTERNAL_API_KEY`, `INTERNAL_API_BASE_URL`, `INTERNAL_CRON_SECRET`. These are V2 concerns.

---

## Phase 2: Update Existing Files

### Step 2.1 — `src/main.ts`
- Use `NestFactory.create(AppModule)` — NO `rawBody: true` (no webhooks in V1)
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
- Global `HttpExceptionFilter`
- `app.setGlobalPrefix('api')`
- CORS with `credentials: true`, origin from `FRONTEND_URL`

> **V1 Note:** No `cookieParser()` — V1 uses BearerAuth only per spec. No `rawBody` — no Stripe/Postmark webhooks.

### Step 2.2 — `src/app.module.ts`
Import infrastructure + **5** feature modules (no AlertsModule):
- `ConfigModule.forRoot({ isGlobal: true })`
- `TypeOrmModule.forRootAsync(...)` with `autoLoadEntities: true`, `synchronize` only in dev
- `CommonModule`, `AuthModule`, `OnboardingModule`, `DashboardModule`, `CheckinModule`, `NotificationsModule`

> **V1 Note:** No `ScheduleModule` (no cron). No `ThrottlerModule` (no rate limiting). No `AlertsModule` (deferred to V2).

### Step 2.3 — `src/app.controller.ts`
Convert from Hello World to health-check endpoint: `GET /api/health → { status: 'ok' }`

### Step 2.4 — Delete `src/app.service.ts` (no longer needed)

### Step 2.5 — Update `src/app.controller.spec.ts` + `test/app.e2e-spec.ts` for health-check

---

## Phase 3: Common Module

Create `src/common/` with shared infrastructure:

| File | Purpose |
|------|---------|
| `common.module.ts` | Shared module (no global guards for V1 — no rate limiting) |
| `enums/user-role.enum.ts` | `LEAD`, `ORG_ADMIN`, `EMPLOYEE`, `MANAGER` |
| `enums/user-status.enum.ts` | `LEAD_UNCONFIRMED`, `LEAD_CONFIRMED`, `CUSTOMER` |
| `enums/magic-link-type.enum.ts` | `LOGIN`, `REGISTRATION` |
| `enums/quick-option.enum.ts` | `GOOD`, `OKAY`, `NOT_GREAT` |
| `enums/onboarding-status.enum.ts` | `IN_PROGRESS`, `COMPLETED` |
| `enums/subscription-status.enum.ts` | `ACTIVE`, `PAST_DUE`, `CANCELED` |
| `guards/jwt-auth.guard.ts` | Extends `AuthGuard('jwt')` |
| `guards/roles.guard.ts` | Reads `@Roles()` metadata, checks `user.role` |
| `decorators/roles.decorator.ts` | `SetMetadata` for role-based access |
| `decorators/current-user.decorator.ts` | Extract `request.user` param decorator |
| `filters/http-exception.filter.ts` | Standardized `{ statusCode, error, message }` (V1 error schema) |
| `dto/pagination-query.dto.ts` | Shared `page` + `limit` query params |
| `interfaces/paginated-response.interface.ts` | `{ data: T[], meta: PaginationMeta }` |

> **V1 Note:** Removed `raw-body.middleware.ts` (no webhooks). Removed `ThrottlerGuard` registration. Added shared pagination DTO/interface per V1 contract.

---

## Phase 4: Auth Module (`src/auth/`)

**Entities:** `User`, `MagicLink`
**DTOs:** `RegisterDto`, `LoginDto`, `VerifyMagicLinkDto`, `ResendMagicLinkDto`
**Strategy:** `JwtStrategy` — extracts JWT from Bearer header, 15-min TTL
**Service stubs:** `register()`, `login()`, `employeeLogin()`, `verify()`, `resend()`, `logout()`, `keepAlive()`, `validateUser()`, `signToken()`
**Controller routes (7 endpoints):**
- `POST auth/register` — public, returns `_dev_token` in non-prod
- `POST auth/login` — public, returns `_dev_token` in non-prod
- `POST auth/employee/login` — public, returns `_dev_token` in non-prod
- `POST auth/verify` — public, verify magic link & return JWT
- `POST auth/resend` — public, resend magic link
- `POST auth/logout` — JWT required, returns 204
- `POST auth/keep-alive` — JWT required, returns 204

**Module config:** `TypeOrmModule.forFeature([User, MagicLink])`, `PassportModule`, `JwtModule.registerAsync()`. Exports `AuthService`.

> **V1 Note:** Route paths match V1 spec exactly (`/verify` not `/verify-magic-link`, `/resend` not `/resend-magic-link`). Added `employee/login` and `keep-alive` per spec. Email sending is stubbed — `_dev_token` returned in response.

---

## Phase 5: Onboarding Module (`src/onboarding/`)

**Entities:** `OnboardingSession`
**DTOs:** `UpdateStepDto`, `NotificationEmailDto`, `AddContactDto`, `PatchContactDto`, `CompleteOnboardingDto`
**Guards:** `SessionOwnerGuard` — verifies requesting user owns the session
**Service stubs:** `start()`, `updateStep()`, `setNotificationEmail()`, `uploadContacts()`, `addContact()`, `removeContact()`, `patchContact()`, `complete()`, `getSession()`
**Controller routes (9 endpoints):**
- `POST onboarding/start`
- `PATCH onboarding/session/:sessionId/step`
- `POST onboarding/session/:sessionId/notification-email`
- `POST onboarding/session/:sessionId/contacts/upload` — multipart/form-data or JSON
- `POST onboarding/session/:sessionId/contacts/individual`
- `DELETE onboarding/session/:sessionId/contacts/:contactId`
- `PATCH onboarding/session/:sessionId/contacts/:contactId`
- `POST onboarding/session/:sessionId/complete`
- `GET onboarding/session/:sessionId`

**Module config:** `TypeOrmModule.forFeature([OnboardingSession])`, imports `Contact` entity from Dashboard. Exports `OnboardingService`.

> **V1 Note:** Removed `BillingSubscription` entity (billing stubbed). Removed `retry-failed-batch`. Route structure matches V1 spec exactly with session-scoped paths. No Stripe checkout endpoint.

---

## Phase 6: Dashboard Module (`src/dashboard/`)

**Entities:** `Contact`
**DTOs:** `CreateContactDto`, `BulkCreateContactsDto`, `BulkDeleteContactsDto`, `UpdateContactDto`, `UpdateSettingsDto`
**Service stubs:** Contact CRUD, CSV import (single-step), bulk create, bulk delete, settings get/update, billing stub
**Controller routes (10 endpoints across 3 sub-tags):**

**Dashboard-Contacts (7):**
- `GET dashboard/contacts` — paginated list
- `POST dashboard/contacts` — bulk create (1-500)
- `POST dashboard/contacts/csv` — single-step CSV import
- `POST dashboard/contacts/bulk-delete` — bulk delete by IDs
- `PATCH dashboard/contacts/:id` — update single contact
- `GET dashboard/contacts/:id` — get single contact
- `DELETE dashboard/contacts/:id` — delete single contact

**Dashboard-Settings (2):**
- `GET dashboard/settings`
- `PATCH dashboard/settings`

**Dashboard-Billing (1):**
- `GET dashboard/billing` — returns hardcoded stub data

**Module config:** `TypeOrmModule.forFeature([Contact])`. Exports `DashboardService`.

> **V1 Note:** Removed `StripeSubscription`, `CsvParseSession`, `FailedContactBatch`, `ContactDataExportLog` entities. Removed billing sync/webhook controllers, GDPR erasure, CSV session endpoints. Billing GET returns hardcoded stub. CSV import is single synchronous step.

---

## Phase 7: Check-in Module (`src/checkin/`)

**Entities:** `CheckIn`, `CheckInToken`
**DTOs:** `SubmitCheckInDto`, `SaveDraftDto`
**Service stubs:** `getForm()`, `submit()`, `saveDraft()`, `getTodayCheckIn()`
**Controller routes (4 endpoints):**
- `GET checkin/form/:token` — public, retrieve form with draft if any
- `POST checkin/submit` — public, token in body, severity always `"stable"`
- `POST checkin/save-draft` — public, token in body
- `GET checkin/app/today` — JWT required, today's check-in status

**Module config:** `TypeOrmModule.forFeature([CheckIn, CheckInToken])`. Exports `CheckinService`.

> **V1 Note:** Removed `generateDailyTokens()` cron, `POST cron/generate-tokens`, `POST webhook/postmark`. No encryption — `responseText` stored as plaintext. All check-ins default to `severity: "stable"`. Draft save kept; recovery email stubbed.

---

## Phase 8: Notifications Module (`src/notifications/`)

**Entities:** `NotificationRecipient`, `NotificationLog`
**DTOs:** `ConfigureRecipientDto`, `UpdateRecipientDto`
**Service stubs:** `createRecipient()`, `updateRecipient()`, `getRecipient()`, `getHistory()`
**Controller routes (4 endpoints):**
- `POST notifications/recipient` — create/configure recipient
- `PUT notifications/recipient/:id` — update recipient
- `GET notifications/recipient` — get current recipient (or null)
- `GET notifications/history` — paginated notification log

**Module config:** `TypeOrmModule.forFeature([NotificationRecipient, NotificationLog])`. Exports `NotificationsService`.

> **V1 Note:** Removed `POST notifications/trigger` internal HTTP endpoint. Removed `TriggerNotificationDto`. Standard CRUD only. Email delivery is stubbed.

---

## Final File Tree (~45 new files)

```
src/
├── main.ts                                    (modified)
├── app.module.ts                              (modified)
├── app.controller.ts                          (modified)
├── app.controller.spec.ts                     (modified)
├── common/
│   ├── common.module.ts
│   ├── enums/
│   │   ├── user-role.enum.ts
│   │   ├── user-status.enum.ts
│   │   ├── magic-link-type.enum.ts
│   │   ├── quick-option.enum.ts
│   │   ├── onboarding-status.enum.ts
│   │   └── subscription-status.enum.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── dto/
│   │   └── pagination-query.dto.ts
│   └── interfaces/
│       └── paginated-response.interface.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── magic-link.entity.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── verify-magic-link.dto.ts
│   │   └── resend-magic-link.dto.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── onboarding/
│   ├── onboarding.module.ts
│   ├── onboarding.controller.ts
│   ├── onboarding.service.ts
│   ├── entities/
│   │   └── onboarding-session.entity.ts
│   ├── guards/
│   │   └── session-owner.guard.ts
│   └── dto/
│       ├── update-step.dto.ts
│       ├── notification-email.dto.ts
│       ├── add-contact.dto.ts
│       ├── patch-contact.dto.ts
│       └── complete-onboarding.dto.ts
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   ├── entities/
│   │   └── contact.entity.ts
│   └── dto/
│       ├── create-contact.dto.ts
│       ├── bulk-create-contacts.dto.ts
│       ├── bulk-delete-contacts.dto.ts
│       ├── update-contact.dto.ts
│       └── update-settings.dto.ts
├── checkin/
│   ├── checkin.module.ts
│   ├── checkin.controller.ts
│   ├── checkin.service.ts
│   ├── entities/
│   │   ├── check-in.entity.ts
│   │   └── check-in-token.entity.ts
│   └── dto/
│       ├── submit-checkin.dto.ts
│       └── save-draft.dto.ts
└── notifications/
    ├── notifications.module.ts
    ├── notifications.controller.ts
    ├── notifications.service.ts
    ├── entities/
    │   ├── notification-recipient.entity.ts
    │   └── notification-log.entity.ts
    └── dto/
        ├── configure-recipient.dto.ts
        └── update-recipient.dto.ts
```

---

## Key Conventions

- **Pattern:** Controller → Service → Repository (direct `@InjectRepository(Entity)`, NO use-case classes)
- **American English:** `organization`, `organizationId`
- **Roles:** `lead`, `org_admin`, `employee`, `manager` (V1 spec includes `manager` in type union)
- **Enum values:** kebab-case in DB, SCREAMING_SNAKE_CASE in TypeScript
- **Cross-module entities:** Import entity files directly, register in consuming module's `TypeOrmModule.forFeature([])`
- **Guards order:** `@UseGuards(JwtAuthGuard, RolesGuard)` — always in this order
- **Global API prefix:** `/api/` set in `main.ts` — controllers must NOT include `/api/`
- **Auth:** BearerAuth only for V1 (no cookie auth, no internal API keys)
- **Pagination:** All list endpoints use `{ data: T[], meta: { total, page, limit, totalPages } }`
- **Error schema:** `{ statusCode, error, message }` — consistent across all endpoints

---

## Verification

1. **Build:** `npx nest build` — should compile with zero errors
2. **Start:** `npm run start:dev` — modules should initialize (DB connection will fail without Postgres, that's OK)
3. **Test:** `npm test` — updated unit test should pass
4. **Lint:** `npm run lint` — should pass with no errors

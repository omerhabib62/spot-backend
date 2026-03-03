# Spot Backend Scaffolding Plan

## Context

The spot-backend project is a fresh NestJS 11 starter (Hello World only). The Spot documentation repo (`D:\projects\office\spot`) defines a complete B2B SaaS backend for employee mental health check-ins. This plan scaffolds the full project structure: 6 feature modules with entities, DTOs, controllers, services, guards, and middleware — all as compilable stubs (TODO bodies) that match the documented architecture.

**You are working in:** `D:\projects\office\spot-backend`
**Docs source of truth:** `D:\projects\office\spot\Modules\{module}\output\backend-spec.md`

---

## Phase 1: Install Dependencies

### Step 1.1 — Production deps
```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg @nestjs/schedule @nestjs/throttler class-validator class-transformer cookie-parser @nestjs/passport passport passport-jwt @nestjs/jwt raw-body
```

### Step 1.2 — Dev deps (types)
```bash
npm install -D @types/cookie-parser @types/passport-jwt
```

### Step 1.3 — Create `.env.example` and `.env`
All required env vars from the docs: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `POSTMARK_API_KEY`, `POSTMARK_WEBHOOK_SECRET`, `EMAIL_FROM_ADDRESS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `AI_ENDPOINT_API_KEY`, `INTERNAL_API_KEY`, `INTERNAL_API_BASE_URL`, `INTERNAL_CRON_SECRET`, `FRONTEND_URL`, `DASHBOARD_URL`, plus optional `NODE_ENV`, `PORT`, `APP_URL`.

---

## Phase 2: Update Existing Files

### Step 2.1 — `src/main.ts`
- Use `NestFactory.create(AppModule, { rawBody: true })` (NestJS 11 built-in raw body capture for Stripe/Postmark webhooks)
- Add `cookieParser()` for `spot_session` JWT cookie
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
- Global `HttpExceptionFilter`
- `app.setGlobalPrefix('api')`
- CORS with `credentials: true` from `FRONTEND_URL`

### Step 2.2 — `src/app.module.ts`
Import all infrastructure + 6 feature modules:
- `ConfigModule.forRoot({ isGlobal: true })`
- `TypeOrmModule.forRootAsync(...)` with `autoLoadEntities: true`, `synchronize` only in dev
- `ScheduleModule.forRoot()`
- `ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }])`  (docs say 20 req/60s default)
- `CommonModule`, `AuthModule`, `OnboardingModule`, `DashboardModule`, `CheckinModule`, `AlertsModule`, `NotificationsModule`

### Step 2.3 — `src/app.controller.ts`
Convert from Hello World to health-check endpoint: `GET /api/health → { status: 'ok' }`

### Step 2.4 — Delete `src/app.service.ts` (no longer needed)

### Step 2.5 — Update `src/app.controller.spec.ts` + `test/app.e2e-spec.ts` for health-check

---

## Phase 3: Common Module

Create `src/common/` with shared infrastructure:

| File | Purpose |
|------|---------|
| `common.module.ts` | Register global `ThrottlerGuard` via `APP_GUARD` |
| `enums/user-role.enum.ts` | `LEAD`, `ORG_ADMIN`, `EMPLOYEE` (docs specify these 3 roles) |
| `enums/user-status.enum.ts` | `LEAD_UNCONFIRMED`, `LEAD_CONFIRMED`, `CUSTOMER` |
| `enums/magic-link-type.enum.ts` | `LOGIN`, `REGISTRATION` |
| `guards/jwt-auth.guard.ts` | Extends `AuthGuard('jwt')` |
| `guards/roles.guard.ts` | Reads `@Roles()` metadata, checks `user.role` |
| `decorators/roles.decorator.ts` | `SetMetadata` for role-based access |
| `decorators/current-user.decorator.ts` | Extract `request.user` param decorator |
| `filters/http-exception.filter.ts` | Standardized `{ statusCode, message, error, timestamp, path }` |
| `middleware/raw-body.middleware.ts` | Placeholder (may not be needed with `rawBody: true`) |

---

## Phase 4: Auth Module (`src/auth/`)

**Entities:** `User`, `MagicLink` (from docs — see `Modules/Auth/output/backend-spec.md`)
**DTOs:** `RegisterDto`, `VerifyMagicLinkDto`, `LoginDto`, `ResendMagicLinkDto`
**Strategy:** `JwtStrategy` — extracts JWT from `spot_session` cookie OR Bearer header, 15-min TTL
**Service stubs:** `register()`, `sendMagicLink()`, `verifyMagicLink()`, `resendMagicLink()`, `validateUser()`, `signToken()`
**Controller routes:**
- `POST auth/register` — send registration magic link
- `POST auth/verify-magic-link` — verify & get JWT
- `POST auth/login` — send login magic link
- `POST auth/resend-magic-link` — resend expired link
- `GET auth/me` — get current user (protected)

**Module config:** `TypeOrmModule.forFeature([User, MagicLink])`, `PassportModule`, `JwtModule.registerAsync()`. Exports `AuthService`.

---

## Phase 5: Onboarding Module (`src/onboarding/`)

**Entities:** `OnboardingSession`, `BillingSubscription`
**DTOs:** `StartOnboardingDto`, `OnboardingStepDto`
**Service stubs:** `startOnboarding()`, `updateStep()`, `completeOnboarding()`, `createStripeSubscription()`
**Controller routes:**
- `POST onboarding/start`
- `POST onboarding/step`
- `GET onboarding/status`
- `POST onboarding/retry-failed-batch`

---

## Phase 6: Dashboard Module (`src/dashboard/`)

**Entities:** `Contact`, `StripeSubscription`, `CsvParseSession`, `FailedContactBatch`, `ContactDataExportLog`
**DTOs:** `CreateContactDto`, `UpdateContactDto`, `CsvImportDto`
**Service stubs:** Contact CRUD, CSV import, billing sync, GDPR export/deletion, `deleteByContactId()` (GDPR contract)
**Controller routes:**
- `GET/POST/PUT/DELETE dashboard/contacts[/:id]`
- `DELETE dashboard/contacts/:id/data` — GDPR erasure
- `POST dashboard/csv-import` + `GET dashboard/csv-import/:sessionId`
- `POST dashboard/billing/sync` + `POST dashboard/billing/customer-portal`

---

## Phase 7: Check-in Module (`src/checkin/`)

**Entities:** `CheckIn`, `CheckInToken`
**DTOs:** `SubmitCheckinDto`, `SaveDraftDto`
**Service stubs:** `generateDailyTokens()` (cron), `submitCheckIn()`, `saveDraft()`, `recoverDraft()`, `getCheckInStatus()`
**Controller routes:**
- `POST checkin/submit` — public (token-auth, no JWT)
- `POST checkin/save-draft` — public
- `POST checkin/recover/:token` — public
- `POST checkin/cron/generate-tokens` — internal cron
- `POST checkin/webhook/postmark` — Postmark delivery webhook
- `GET checkin/status/:token` — public

---

## Phase 8: Alerts Module (`src/alerts/`)

**Entities:** `Alert`
**DTOs:** `ProcessAlertDto`
**Service stubs:** `processCheckIn()`, `classifyWithAI()`, `getAlertHistory()`, `retrySoftBounces()`, `deleteByContactId()` (GDPR), `anonymize()`
**Controller routes:**
- `POST alerts/process` — internal (from Checkin)
- `GET alerts/history/:organizationId` — internal
- `POST alerts/webhook/postmark` — Postmark bounce webhook
- `POST alerts/retry-soft-bounces` — cron

---

## Phase 9: Notifications Module (`src/notifications/`)

**Entities:** `NotificationRecipient`, `NotificationLog`
**DTOs:** `CreateRecipientDto`, `UpdateRecipientDto`, `TriggerNotificationDto`
**Service stubs:** recipient CRUD, `triggerAlert()`, `getNotificationLogs()`
**Controller routes:**
- `POST/GET/PUT/DELETE notifications/recipients[/:id]`
- `POST notifications/trigger` — internal (from Alerts via HTTP)

---

## Final File Tree (~54 new files)

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
│   │   └── magic-link-type.enum.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── middleware/
│       └── raw-body.middleware.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── magic-link.entity.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── verify-magic-link.dto.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── onboarding/
│   ├── onboarding.module.ts
│   ├── onboarding.controller.ts
│   ├── onboarding.service.ts
│   ├── entities/
│   │   ├── onboarding-session.entity.ts
│   │   └── billing-subscription.entity.ts
│   └── dto/
│       ├── start-onboarding.dto.ts
│       └── onboarding-step.dto.ts
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   ├── entities/
│   │   ├── contact.entity.ts
│   │   ├── stripe-subscription.entity.ts
│   │   ├── csv-parse-session.entity.ts
│   │   ├── failed-contact-batch.entity.ts
│   │   └── contact-data-export-log.entity.ts
│   └── dto/
│       ├── create-contact.dto.ts
│       ├── update-contact.dto.ts
│       └── csv-import.dto.ts
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
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── alerts.service.ts
│   ├── entities/
│   │   └── alert.entity.ts
│   └── dto/
│       └── process-alert.dto.ts
└── notifications/
    ├── notifications.module.ts
    ├── notifications.controller.ts
    ├── notifications.service.ts
    ├── entities/
    │   ├── notification-recipient.entity.ts
    │   └── notification-log.entity.ts
    └── dto/
        ├── create-recipient.dto.ts
        ├── update-recipient.dto.ts
        └── trigger-notification.dto.ts
```

---

## Key Conventions (from docs)

- **Pattern:** Controller → Service → Repository (direct `@InjectRepository(Entity)`, NO use-case classes)
- **American English:** `organization`, `organizationId`
- **Roles:** `lead`, `org_admin`, `employee` (NO `manager`)
- **Enum values:** kebab-case in DB, SCREAMING_SNAKE_CASE in TypeScript
- **Cross-module entities:** Import entity files directly (e.g., `import { Contact } from '../dashboard/entities/contact.entity'`), register in consuming module's `TypeOrmModule.forFeature([])`
- **Guards order:** `@UseGuards(JwtAuthGuard, RolesGuard)` — always in this order
- **Global API prefix:** `/api/` set in `main.ts` — controllers must NOT include `/api/`
- **GDPR contract:** Every module owning contact-related records exports `deleteByContactId(contactId): Promise<{ deleted: number }>`

---

## Verification

1. **Build:** `npx nest build` — should compile with zero errors
2. **Start:** `npm run start:dev` — modules should initialize (DB connection will fail without Postgres, that's OK)
3. **Test:** `npm test` — updated unit test should pass
4. **Lint:** `npm run lint` — should pass with no errors

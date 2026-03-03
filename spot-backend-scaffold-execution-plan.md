# V1 Demo Shell — Backend Scaffolding Execution Plan

## Context

The spot-backend is a fresh NestJS 11 starter (Hello World only). The user finalized a V1 Demo Shell OpenAPI contract (`spot-backend-unified-spec-plan.md`) that defines 34 endpoints across 5 modules. This plan scaffolds the full V1 project structure — entities, DTOs, controllers, services, guards — as compilable stubs with TODO bodies. The scaffold plan markdown has already been rewritten to match V1 scope.

**Key V1 constraints applied:**
- Alerts module removed entirely (AI classification deferred)
- Dashboard simplified: no Stripe sync, no CsvParseSession, no FailedContactBatch
- Check-in simplified: no cron jobs, no Postmark webhooks — only form/submit/draft/today
- Notifications simplified: no internal trigger endpoint — CRUD + history only
- App module: no AlertsModule, no ScheduleModule, no ThrottlerModule, no rawBody

---

## Execution Steps

### Step 1: Install Dependencies

```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/passport passport passport-jwt @nestjs/jwt multer
npm install -D @types/passport-jwt @types/multer
```

### Step 2: Create `.env.example`

File: `src/../.env.example` — V1-scoped vars only: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `FRONTEND_URL`

### Step 3: Update Bootstrap Files

**`src/main.ts`** — Add ValidationPipe, HttpExceptionFilter, global prefix `api`, CORS
**`src/app.module.ts`** — ConfigModule, TypeOrmModule, 5 feature modules (NO AlertsModule, NO ScheduleModule, NO ThrottlerModule)
**`src/app.controller.ts`** — Health check `GET /api/health → { status: 'ok' }`
**Delete** `src/app.service.ts`
**Update** `src/app.controller.spec.ts` + `test/app.e2e-spec.ts` for health-check

### Step 4: Common Module (~14 files)

`src/common/` — enums (UserRole, UserStatus, MagicLinkType, QuickOption, OnboardingStatus, SubscriptionStatus), guards (JwtAuth, Roles), decorators (Roles, CurrentUser), filters (HttpException), shared DTO (PaginationQuery), interface (PaginatedResponse)

### Step 5: Auth Module (~10 files)

`src/auth/` — Entities: User, MagicLink. DTOs: Register, Login, VerifyMagicLink, ResendMagicLink. Strategy: JWT (Bearer only). Controller: 7 endpoints matching V1 spec exactly (`/register`, `/login`, `/employee/login`, `/verify`, `/resend`, `/logout`, `/keep-alive`).

### Step 6: Onboarding Module (~10 files)

`src/onboarding/` — Entity: OnboardingSession. DTOs: UpdateStep, NotificationEmail, AddContact, PatchContact, CompleteOnboarding. Guard: SessionOwnerGuard. Controller: 9 endpoints with session-scoped paths.

### Step 7: Dashboard Module (~9 files)

`src/dashboard/` — Entity: Contact (only). DTOs: CreateContact, BulkCreateContacts, BulkDeleteContacts, UpdateContact, UpdateSettings. Controller: 10 endpoints (7 contacts + 2 settings + 1 billing stub).

### Step 8: Check-in Module (~7 files)

`src/checkin/` — Entities: CheckIn, CheckInToken. DTOs: SubmitCheckIn, SaveDraft. Controller: 4 endpoints (GET form, POST submit, POST save-draft, GET today).

### Step 9: Notifications Module (~7 files)

`src/notifications/` — Entities: NotificationRecipient, NotificationLog. DTOs: ConfigureRecipient, UpdateRecipient. Controller: 4 endpoints (POST/PUT/GET recipient, GET history).

### Step 10: Verify

- `npx nest build` — zero compilation errors
- `npm test` — updated unit test passes
- `npm run lint` — no lint errors

---

## Files Modified/Created (~48 total)

**Modified (5):** main.ts, app.module.ts, app.controller.ts, app.controller.spec.ts, test/app.e2e-spec.ts
**Deleted (1):** app.service.ts
**Created (~43):** See file tree in `spot-backend-scaffold-plan.md`

## Verification

1. `npx nest build` compiles with zero errors
2. `npm test` passes (health-check unit test)
3. `npm run lint` passes

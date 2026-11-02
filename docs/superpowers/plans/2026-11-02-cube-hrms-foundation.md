# CUBE HRMS — Foundation Implementation Plan (Wave 0 + Wave 1)

Date: 2026-11-02 · Approver: Hari Siddesh M · Status: approved (chat)

## Intent

Build the runnable foundation of **CUBE**, a multi-tenant HRMS SaaS for Indian
SMEs (20–500 employees), per the approved architecture: React+TS+Vite+Tailwind
frontend, FastAPI+SQLAlchemy backend, PostgreSQL(+pgvector)+Redis+MinIO,
row-level-security tenancy, JWT/RBAC, Stripe billing and AI deferred.

## Structure (feature-based)

```
backend/app/
  core/                 config, db, security, deps, errors, pagination
  modules/
    auth/               router, schemas, service
    tenants/            tenant registry + provisioning
    org/                departments, designations
    employees/          employee directory + profiles
    attendance/         clock in/out, monthly views
    leave/              types, balances, requests, approvals
    dashboard/          role-aware summary
  seed.py               demo data (super admin + 2 tenants)
  celery_app.py, workers/tasks.py

frontend/src/
  features/
    auth/  dashboard/  tenants/  employees/  attendance/  leave/  profile/
      (page, api, types, components — colocated per feature)
  components/ui/        design system primitives
  components/layout/    app shell, sidebar, topbar
  lib/                  api client, auth context, formatters
  app/                  router, providers
```

## Scope (Wave 0 + Wave 1)

- Wave 0: auth + RBAC + RLS tenancy + audit log foundation + CI.
- Wave 1: org units, designations, employees, attendance (clock in/out +
  monthly views), leave (types/balances/requests/approvals), super-admin
  tenant registry with approve→provision, role-aware dashboard.
- OUT: payroll, recruitment, CRM/PM/Finance (cut per Option A), OpenSearch,
  Cube BI, file uploads (MinIO scaffolded), AI copilot (Wave 4), K8s.

## Locked decisions

1. Tenancy: `tenant_id` on all business tables; Postgres RLS with
   `app.current_tenant_id` + `app.is_platform_admin` GUCs; FORCE RLS;
   policies OR'd (tenant isolation OR platform bypass).
2. Auth: JWT HS256, argon2 hashing, access 30m / refresh 14d with rotation.
   Roles: super_admin (platform), hr_admin, manager, employee.
3. Dates (attendance/leave) are IST business dates; datetimes stored UTC.
4. Leave approve locks balance row `FOR UPDATE` then increments `used_days`.
5. Attendance: one row per employee per day, idempotent repeat clock-in/out.
6. Design language: warm ivory + deep pine + restrained gold; liquid/glass
   surfaces; no neon, no cyan, no floating decorative elements.
7. Security gates in order: code → CodeRabbit-style review → insecure-defaults
   audit → Cloudflare security-audit → strix/shannon dynamic tests → tests.

## Tasks

### T1 Backend skeleton — core + module scaffolding
Prove: `uv pip install -e backend` resolves; imports clean.

### T2 Migration + RLS (alembic 0001)
Prove: `alembic upgrade head`; `\d+ employees` shows RLS enabled + forced.

### T3 Auth, tenants, org, employees, attendance, leave, dashboard APIs + seed
Prove: all endpoints registered; seed creates super admin + 2 tenants.

### T4 Backend tests (pytest)
Prove: auth, RBAC, RLS isolation (API + raw SQL), attendance, leave balance
lifecycle (approve/deny/cancel), tenant provisioning.

### T5 Frontend (feature-based)
Prove: `npm run build` clean; `npm test` green; manual flows verified.

### T6 Infra + docs
Prove: `docker compose config` valid; README quickstart works.

### T7 Git commit + private GitHub repo "HR Management System" + push
Prove: `gh repo view` shows main with pushed tree.

### T8 CodeRabbit review + insecure-defaults audit + fixes
Prove: findings list with file:line, fixes applied, tests re-run green.

### T9 Cloudflare-style security audit + strix/shannon dynamic runs
Prove: audit artifacts generated; dynamic tools executed or documented as
blocked-by-credentials with exact setup needed.

### T10 Smoke test (compose up + seed + browser flow)
Prove: login + one HR flow end-to-end against running stack.

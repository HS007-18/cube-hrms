# Cube AI Solutions — HRMS Platform

**CUBE HRMS** is a multi-tenant Human Resource Management System for Indian SMEs, built with **FastAPI** (backend), **React + Vite** (frontend), **PostgreSQL** (database), and **Redis** (caching & rate limiting). It features row-level security (RLS) for tenant isolation, role-based access control, JWT authentication with refresh tokens, and a dual-port login architecture separating company users from super admins.

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database & Infrastructure](#database--infrastructure)
- [Multi-Port Login Architecture](#multi-port-login-architecture)
- [Login Credentials (Demo)](#login-credentials-demo)
- [API Endpoints](#api-endpoints)
- [Role-Based Access Control](#role-based-access-control)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS (Ports)                             │
├──────────────────┬───────────────────────────────────────────────────┤
│  Port 5173       │  Port 5170                                        │
│  Company Portal  │  Super Admin Portal                               │
│  (HR Admin,      │  (Platform Admin only)                            │
│   Manager,       │                                                   │
│   Employee)      │                                                   │
└──────────────────┴───────────────────────────────────────────────────┘
                         │                    │
                         ▼                    ▼
              ┌─────────────────────────────────────────┐
              │       Backend API (Port 8000)           │
              │  FastAPI + PostgreSQL RLS + Redis       │
              │                                         │
              │  Auth  • Tenants  • Employees           │
              │  Attendance  • Leave  • Org             │
              │                                         │
              └─────────────────────────────────────────┘
                         │                    │
                         ▼                    ▼
              ┌──────────────────┐  ┌──────────────────┐
              │  PostgreSQL      │  │   Redis          │
              │  (Source of      │  │   (Rate limiting,│
              │   truth - disk)  │  │    Celery queue) │
              └──────────────────┘  └──────────────────┘

### Data Flow

1. **Company users** (HR Admin, Manager, Employee) log in via **port 5173**.
2. **Super Admin** logs in via **port 5170**.
3. Both frontends proxy API calls to the **same backend on port 8000**.
4. Auth cookies (`access_token`, `refresh_token`) are HttpOnly, `SameSite=Lax`, path `/` — shared across both ports on `localhost`.
5. PostgreSQL enforces **Row-Level Security (RLS)** so each tenant only sees their own data.
6. Redis enforces **login rate limiting** (fixed-window) and serves as the **Celery broker**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, Python 3.12, SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL 16 (with pgvector), Redis 7 |
| **Authentication** | JWT (PyJWT), Argon2 hashing, HttpOnly cookies |
| **Rate Limiting** | Redis fixed-window counter |
| **Task Queue** | Celery + Redis |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router |
| **Dev Tools** | Playwright, Vitest, Oxlint |

---

## 📁 Directory Structure

```
cube-hrms/
├── backend/
│   ├── app/
│   │   ├── core/              # Config, DB, security, rate limiting, deps
│   │   ├── modules/
│   │   │   ├── auth/          # JWT login, refresh, logout, /me
│   │   │   ├── tenants/       # Multi-tenant management (super admin only)
│   │   │   ├── employees/     # Employee CRUD
│   │   │   ├── attendance/    # Clock-in/out, corrections
│   │   │   ├── leave/         # Leave types, balances, requests
│   │   │   └── org/           # Departments, designations
│   │   ├── main.py            # FastAPI app entry
│   │   └── celery_app.py      # Celery config
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── alembic.ini            # DB migrations
├── frontend/
│   ├── src/
│   │   ├── app/               # Router, providers, guards
│   │   ├── components/ui/     # Reusable UI components
│   │   ├── components/layout/ # Shell, sidebar, topbar, auth layout
│   │   ├── features/          # Feature pages (auth, attendance, leave, etc.)
│   │   ├── lib/               # API client, auth context, utilities
│   │   └── main.tsx / main-super-admin.tsx
│   ├── vite.config.ts         # Company portal (port 5173)
│   ├── vite.super-admin.config.ts  # Super admin portal (port 5170)
│   └── package.json
├── docker-compose.yml         # PostgreSQL, Redis, backend, worker, frontend
├── .env.example               # Environment variable template
├── README.md
└── scripts/                   # Utility scripts
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.12+ (for local backend development)
- Node.js 20+ (for local frontend development)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/HS007-18/cube-hrms.git
cd cube-hrms

# Copy environment variables
cp .env.example .env

# Start all services
docker compose up -d
```

This starts:
- **PostgreSQL** on `127.0.0.1:5433`
- **Redis** on `127.0.0.1:6380`
- **Backend API** on `127.0.0.1:8000`
- **Frontend (company portal)** via Docker on `127.0.0.1:8081`

### Option 2: Local Development (Separate Ports)

#### Terminal 1 — Backend
```bash
cd backend
pip install -e .
python -m alembic upgrade head
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 — Company Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

#### Terminal 3 — Super Admin Frontend (Port 5170)
```bash
cd frontend
npm run dev:super-admin   # http://localhost:5170
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# ---------- Database ----------
POSTGRES_USER=cube
POSTGRES_PASSWORD=cube_dev_password
POSTGRES_DB=cube_hrms
POSTGRES_PORT=5433
APP_DB_USER=cube_app
APP_DB_PASSWORD=cube_app_dev_password

# ---------- Backend ----------
DATABASE_URL=postgresql+asyncpg://cube_app:cube_app_dev_password@127.0.0.1:5433/cube_hrms
MIGRATION_DATABASE_URL=postgresql+asyncpg://cube:cube_dev_password@127.0.0.1:5433/cube_hrms
REDIS_URL=redis://127.0.0.1:6380/0
JWT_SECRET=dev-only-secret-change-me   # ⚠️ Change in production
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173","http://localhost:5170"]

# ---------- Storage (Wave 2) ----------
MINIO_ENDPOINT=127.0.0.1:9010
MINIO_ACCESS_KEY=cube
MINIO_SECRET_KEY=cube_dev_secret
MINIO_BUCKET=cube-files

# ---------- AI (Wave 4) ----------
OPENAI_API_KEY=

# ---------- Frontend ----------
VITE_API_BASE_URL=/api/v1
```

---

## 🗄️ Database & Infrastructure

### PostgreSQL
- **Role:** Source of truth for all business data
- **RLS:** Row-Level Security enabled on all tenant-scoped tables
- **Port:** `5433` (host) → `5432` (container)
- **Migrations:** `alembic` in `backend/alembic/`

### Redis
- **Role:** Login rate limiting + Celery broker/result backend
- **Port:** `6380` (host) → `6379` (container)
- **Used by:** `backend/app/core/rate_limit.py`, `backend/app/celery_app.py`

### MinIO (Optional — Wave 2)
Object storage for file uploads. Start with:
```bash
docker compose --profile storage up -d minio
```

---

## 🔐 Multi-Port Login Architecture

| Portal | Port | Who Can Log In | Redirects |
|--------|------|----------------|-----------|
| **Company Portal** | `5173` | HR Admin, Manager, Employee | Super Admin → `5170` |
| **Super Admin Portal** | `5170` | Platform Admin only | Company users → `5173` |

### How It Works

1. Both ports share the **same backend** (port 8000) and **same database**.
2. Auth cookies are `HttpOnly`, `SameSite=Lax`, `path=/` — shared across `localhost:5173` and `localhost:5170`.
3. If a super admin logs in on 5173, they are redirected to `5170/login`.
4. If a company user logs in on 5170, they are redirected to `5173/login?error=not_super_admin`.
5. PostgreSQL RLS ensures company users only see their own tenant's data.

---

## 🔑 Login Credentials (Demo Data)

| Role | Email | Password | Portal |
|------|-------|----------|--------|
| Super Admin | `superadmin@cubeaisolutions.com` | `SuperAdmin@2026` | 5170 |
| HR Admin — TechNova | `priya.sharma@technova.example` | `HrAdmin@2026` | 5173 |
| Manager — TechNova | `rohit.verma@technova.example` | `MgrAdmin@2026` | 5173 |
| Employee — TechNova | `amit.kumar@technova.example` | `Employee@2026` | 5173 |
| HR Admin — GreenField | `priya.sharma@greenfield.example` | `HrAdmin@2026` | 5173 |
| Manager — GreenField | `rohit.verma@greenfield.example` | `MgrAdmin@2026` | 5173 |
| Employee — GreenField | `amit.kumar@greenfield.example` | `Employee@2026` | 5173 |

> ⚠️ These are demo credentials. Change `JWT_SECRET` and passwords before production.

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/login` | Login & set cookies | Public |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token | Cookie |
| `GET` | `/api/v1/auth/me` | Get current user profile | Cookie |
| `POST` | `/api/v1/auth/logout` | Revoke all tokens | Cookie |

### Tenants (Super Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/tenants` | List all tenants (paginated) |
| `POST` | `/api/v1/tenants` | Create a new tenant |
| `GET` | `/api/v1/tenants/{id}` | Get tenant details |
| `POST` | `/api/v1/tenants/{id}/provision` | Provision a pending tenant |
| `PATCH` | `/api/v1/tenants/{id}/status` | Change tenant status |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/employees` | List employees (tenant-scoped) |
| `POST` | `/api/v1/employees` | Create employee |
| `GET` | `/api/v1/employees/{id}` | Get employee details |
| `PATCH` | `/api/v1/employees/{id}` | Update employee |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/attendance` | List attendance records |
| `POST` | `/api/v1/attendance` | Clock in/out |
| `GET` | `/api/v1/attendance/{id}` | Get attendance record |

### Leave
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/leave/types` | List leave types |
| `GET` | `/api/v1/leave/balances` | Get leave balances |
| `POST` | `/api/v1/leave/requests` | Apply for leave |
| `PATCH` | `/api/v1/leave/requests/{id}` | Approve/deny leave |

### Organization
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/departments` | List departments |
| `POST` | `/api/v1/departments` | Create department |
| `GET` | `/api/v1/designations` | List designations |
| `POST` | `/api/v1/designations` | Create designation |

---

## 🛡️ Role-Based Access Control

| Role | Can See | Can Do |
|------|---------|--------|
| **Super Admin** | All tenants, all employees | Create tenants, provision, suspend, view cross-tenant analytics |
| **HR Admin** | All employees in their tenant | Manage employees, approve leave, view tenant reports |
| **Manager** | Direct reportees only | Approve team leave, view team attendance |
| **Employee** | Only their own profile | View own attendance, apply for leave, view own payslip |

### Enforcement
- **Backend:** PostgreSQL RLS + FastAPI dependencies (`require_platform_admin`, `require_roles`, `require_tenant_user`)
- **Frontend:** Route guards + role-based UI rendering

---

## 📚 API Documentation

Once the backend is running:

- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **Health Check:** `http://127.0.0.1:8000/health`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is proprietary to **Cube AI Solutions**. All rights reserved.

---

## 🆘 Support

- **Issues:** Open a GitHub issue in this repository
- **Email:** hr@cubeaisolutions.com (demo contact)

---

*Built with ❤️ by Cube AI Solutions — Futuristic Enterprise Human Capital & HRMS Platform.*
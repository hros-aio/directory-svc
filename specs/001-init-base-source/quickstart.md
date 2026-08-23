# Quickstart Guide: Base Source Scaffolding & Verification

**Feature**: `001-init-base-source` | **Date**: 2026-08-23

This guide details how to set up, build, test, and run the initialized Directory Service foundation.

## 1. Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **pnpm**: `v9.x` or higher (`npm install -g pnpm`)
- **Docker & Docker Compose**: For local PostgreSQL and Redis dependencies or Testcontainers
- **Git**: Configured for Conventional Commits

---

## 2. Initial Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Configuration**:
   Create `.env` in repository root:
   ```env
   NODE_ENV=development
   APP_PORT=3000
   APP_PREFIX=api/v1

   # Database (PostgreSQL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=hrms_user
   DB_PASSWORD=hrms_password
   DB_NAME=hrms_directory

   # Cache (Redis)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Auth (JWT RS256 Verification)
   JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
   ```

---

## 3. Running Automated Quality Checks

Run all constitution-mandated code quality checks:

```bash
# 1. Linting
pnpm lint

# 2. Code formatting check
pnpm format:check

# 3. TypeScript type check
pnpm typecheck
```

---

## 4. Running Tests

```bash
# Run unit tests
pnpm test

# Run unit tests with coverage enforcement (90% Stmt / 85% Branch / 90% Func)
pnpm test:cov

# Run E2E and integration tests
pnpm test:e2e
```

---

## 5. Running the Service Locally

```bash
# Start local development server with hot-reload
pnpm start:dev
```

### Verification Endpoints:
- **Liveness Probe**: `curl http://localhost:3000/health/live`
- **Readiness Probe**: `curl http://localhost:3000/health/ready`
- **Swagger Documentation**: Open `http://localhost:3000/docs` in your browser.

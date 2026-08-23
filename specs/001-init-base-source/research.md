# Research: Base Source Initialization with Constitution

**Feature**: `001-init-base-source` | **Date**: 2026-08-23

## 1. Architectural Structure & Module Scaffolding

### Decision
Structure the Directory Service (`hrms-directory-service`) as a standalone NestJS application following the Polyrepo layout and Clean Architecture defined in `constitution.md`, `repository-structure.md`, and `coding-conventions.md`.

- **Root Layout**:
  - `src/main.ts`: Application bootstrap configuring Swagger, global pipes, global filters, interceptors, and CORS.
  - `src/app.module.ts`: Root module orchestrating configuration, database, health, and domain modules.
  - `src/modules/`: Subdomain modules (`health/`, `employees/`, `employment/`).
  - `src/common/`: Service-local constants, decorators, interfaces shared strictly within this service.
  - `src/kafka/`: Service-level event producers and consumers.
  - `src/migrations/`: TypeORM migration files.
  - `test/`: E2E test suites with Supertest and Testcontainers.
- **Module Internal Layout**:
  - `controllers/`: Transport handlers with DTO validation and Swagger decorators.
  - `services/`: Business logic, transaction management, caching, event publishing.
  - `repositories/`: Persistence layer extending `BaseRepository` from `@hrms/libs-sql`.
  - `entities/`: Domain entities extending `BaseEntity` from `@hrms/libs-sql`.
  - `dto/`: Request/response shapes decorated with `class-validator` and `class-transformer`.
  - `interfaces/`: Pure TypeScript contracts.
  - `index.ts`: Public module barrel exporting only public services/providers.

### Rationale
- Complies directly with Constitution Principle I (Clean Architecture) and Principle III (Polyrepo Domain Isolation).
- Ensures each domain boundary has strict compile-time encapsulation while keeping directory-specific subdomains organized.

### Alternatives Considered
- Single flat `src/` directory without domain module grouping: Rejected because it violates domain isolation and Clean Architecture conventions.

---

## 2. Configuration & Environment Validation

### Decision
Use `@nestjs/config` with a strongly-typed configuration schema validated during bootstrap using `class-validator` and `class-transformer`.

- Key environment sections:
  - `APP_PORT`, `NODE_ENV`, `APP_PREFIX`
  - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
  - `JWT_PUBLIC_KEY` (RS256 verification)
  - `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`

### Rationale
- Prevents silent runtime failures by failing fast during container boot if mandatory variables are missing or malformed (SC-001).
- Provides type-safe injection of configuration objects across modules.

### Alternatives Considered
- Ad-hoc `process.env` lookups across services: Rejected as it bypasses validation, breaks testability, and hides configuration dependencies.

---

## 3. Observability, Context Propagation & Logging

### Decision
Integrate `AppLogger` from `@hrms/libs-core` and configure `AsyncLocalStorage` via middleware to attach and propagate `requestId`, `sessionId`, and `tenantCode` across asynchronous call stacks.

- Log format: Structured JSON output in production, colorized pretty logging in local development.
- Traceability: Every request assigned or parsed correlation ID; returned in HTTP response headers (`X-Request-Id`).

### Rationale
- Enforces Constitution Principle V (Unified Observability).
- Ensures 100% of logs have distributed trace metadata (SC-002).

### Alternatives Considered
- Direct `console.log`: Forbidden by Constitution Principle V.

---

## 4. Health Checks & Readiness Probes

### Decision
Implement a dedicated `HealthModule` utilizing `@nestjs/terminus` to expose `/health/live` (liveness) and `/health/ready` (readiness).

- Liveness Probe: Verifies event loop and memory responsiveness.
- Readiness Probe: Checks connectivity to PostgreSQL and Redis without performing heavy write operations.

### Rationale
- Standard cloud-native pattern required for Kubernetes orchestrators to manage rollout and self-healing.

---

## 5. Database, TypeORM & Migrations Setup

### Decision
Configure TypeORM via shared configuration abstractions in `@hrms/libs-sql`.
- `synchronize: false` strictly enforced.
- Entities extend `BaseEntity` (providing `id`, `createdAt`, `updatedAt`, `deletedAt`, `@VersionColumn()`).
- Repositories extend `BaseRepository`.
- Migrations located in `src/migrations/` with dedicated npm script runners (`pnpm migration:run`, `pnpm migration:revert`).

### Rationale
- Satisfies Constitution Principle IV (Data Integrity & Migrations).

---

## 6. Code Quality, Tooling & Testing Harness

### Decision
- **Tooling**:
  - `pnpm` as package manager with frozen lockfile enforcement.
  - ESLint with TypeScript and import ordering plugins.
  - Prettier for formatting.
  - Husky + Commitlint for Conventional Commits enforcement.
- **Testing**:
  - Jest for unit testing with AAA pattern and mock isolations.
  - Supertest + Testcontainers for integration/E2E testing against real PostgreSQL & Redis.
  - Coverage gates: 90% Statements, 85% Branches, 90% Functions.

### Rationale
- Enforces Constitution Principle II (Strict TypeScript) and Principle VI (Testing Discipline).

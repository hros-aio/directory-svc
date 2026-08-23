# Implementation Plan: Base Source Initialization with Constitution

**Branch**: `001-init-base-source` | **Date**: 2026-08-23 | **Spec**: [specs/001-init-base-source/spec.md](spec.md)

**Input**: Feature specification from `specs/001-init-base-source/spec.md`

## Summary

Initialize the foundational codebase for the Enterprise HRMS Directory Service (`hrms-directory-service`) according to the ratified project constitution and memory guidelines. This includes project scaffolding (TypeScript, NestJS, pnpm), configuration validation, structured logging with correlation context (`@hrms/libs-core`), direct reuse of shared middleware, exception filters, and bootstrap configs (`@hrms/libs-apis`), health/readiness probes (`@nestjs/terminus`), database integration patterns (`@hrms/libs-sql`), and automated quality gates (ESLint, Prettier, Husky, Commitlint, Jest with strict coverage).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (LTS)  
**Primary Dependencies**: NestJS (v10+), `@hrms/libs-core`, `@hrms/libs-sql`, `@hrms/libs-apis`, `@hrms/libs-events`, `@nestjs/config`, `@nestjs/terminus`, `class-validator`, `class-transformer`, `pino`  
**Storage**: PostgreSQL 16 (TypeORM migrations-only) + Redis (`CacheManager`)  
**Testing**: Jest, Supertest, Testcontainers (PostgreSQL & Redis)  
**Target Platform**: Linux container / Kubernetes  
**Project Type**: Backend microservice / web-service (REST + Kafka events)  
**Performance Goals**: Cold start < 5s, p95 API response < 100ms  
**Constraints**: Zero `any` policy, Clean Architecture layering (Controller → Service → Repository), 90% statement / 85% branch / 90% function coverage thresholds, direct reuse of `@hrms/libs-*` components (no duplicate local middleware/filters)  
**Scale/Scope**: Enterprise HRMS Directory Service bounded context (`directory-svc`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Assessment | Status |
|---|---|---|
| **I. Clean Architecture & Strict Layering** | Controller handles transport only; Service handles business logic only; Repository handles persistence only. Unidirectional dependencies enforced. | ✅ PASS |
| **II. Strict TypeScript & Type Safety** | `strict: true` non-negotiable; zero `any` tolerance; explicit return types on exports; immutable DTOs with `readonly`; one concept per file. | ✅ PASS |
| **III. Polyrepo Domain Isolation** | Exclusive database ownership for Directory Service; synchronous communication via OpenAPI REST clients; async events via Kafka schemas; `@hrms/libs-*` npm packages. | ✅ PASS |
| **IV. Data Integrity, Migrations & Caching** | TypeORM migrations with `down()` support; transactions for multi-statement atomic writes; namespaced Redis caching with explicit TTL. | ✅ PASS |
| **V. Unified Observability, Error Handling & Security** | `AppLogger` with `AsyncLocalStorage` context propagation; `BaseException` hierarchy; JWT RS256 verification; `PermissionGuard` authorization. | ✅ PASS |
| **VI. Testing Discipline & Quality Gates** | 70/20/10 pyramid, AAA structure, Testcontainers for real DB/Redis integration, 90%/85%/90% coverage enforcement, Conventional Commits. | ✅ PASS |

## Project Structure

### Documentation (this feature)

```text
specs/001-init-base-source/
├── plan.md              # Implementation Plan
├── research.md          # Phase 0 Research decisions
├── data-model.md        # Phase 1 Data Model & entity abstractions
├── quickstart.md        # Phase 1 Quickstart verification guide
├── contracts/           # Phase 1 Interface contracts
│   ├── health-api.md
│   └── openapi-spec.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository layout)

```text
.
├── src/
│   ├── modules/
│   │   ├── health/                     # Health & readiness probes (/health/live, /health/ready)
│   │   │   ├── controllers/
│   │   │   │   └── health.controller.ts
│   │   │   ├── health.module.ts
│   │   │   └── index.ts
│   │   ├── employee/                   # Employee domain module skeleton (deferred models)
│   │   │   ├── employee.module.ts
│   │   │   └── index.ts
│   │   └── employment/                 # Employment domain module skeleton (deferred models)
│   │       ├── employment.module.ts
│   │       └── index.ts
│   ├── common/                         # Directory service-local constants and interfaces only
│   │   ├── constants/
│   │   └── interfaces/
│   ├── config/                         # Typed environment configuration & validation schemas
│   │   ├── configuration.ts
│   │   ├── env.validation.ts
│   │   └── typeorm.config.ts
│   ├── kafka/                          # Service event producers/consumers
│   │   ├── directory-event.producer.ts
│   │   └── directory-event.consumer.ts
│   ├── migrations/                     # TypeORM schema migrations
│   ├── app.module.ts                   # Root module (registers @hrms/libs-apis middlewares)
│   └── main.ts                         # Bootstrap entry point (registers swagger/cors/filters from @hrms/libs-apis)
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .husky/                             # Git pre-commit & commit-msg hooks
├── commitlint.config.js                # Conventional commits rules
├── .eslintrc.js                        # Strict linting configuration
├── .prettierrc                         # Code formatting rules
├── tsconfig.json                       # Root TypeScript config (strict: true)
├── nest-cli.json                       # Nest CLI configuration
├── package.json                        # pnpm dependencies and lifecycle scripts
└── README.md                           # Directory service onboarding
```

**Structure Decision**: Standard NestJS Polyrepo Service layout directly consuming `@hrms/libs-apis`, `@hrms/libs-core`, `@hrms/libs-sql`, and `@hrms/libs-events` without local duplication of middlewares, exception filters, or bootstrap configurations.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | *All architectural rules align with Constitution without exceptions* | *N/A* |

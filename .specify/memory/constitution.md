<!--
Sync Impact Report
==================
Version Change: Unratified Template (0.0.0) → 1.0.0
Ratification Date: 2026-08-23
Last Amended Date: 2026-08-23

Core Principles Defined:
- Principle I: Clean Architecture & Strict Layering (MUST follow Controller → Service → Repository unidirectional flow)
- Principle II: Strict TypeScript & Type Safety (MUST enforce strict mode, zero `any`, explicit return types, immutability)
- Principle III: Polyrepo Domain Isolation & Explicit Contracts (MUST isolate bounded contexts, zero cross-service DB access, REST/Kafka versioned contracts)
- Principle IV: Data Integrity, Migrations & Structured Caching (MUST use TypeORM migrations with `down()`, transactions for multi-statement writes, namespaced Redis caching with TTL)
- Principle V: Unified Observability, Error Handling & Security (MUST use AppLogger with AsyncLocalStorage, BaseException hierarchy, JWT RS256, RBAC guards)
- Principle VI: Testing Discipline & Quality Gates (MUST meet 90% statement / 85% branch coverage, AAA structure, Testcontainers for DB/Redis, Conventional Commits)

Added Sections:
- Technology Stack & Architectural Constraints
- Development Workflow & Quality Gates
- Governance & Compliance

Templates Consistency Verification:
- .specify/templates/plan-template.md: ✅ verified aligned (Constitution Check gates reflect architectural constraints)
- .specify/templates/spec-template.md: ✅ verified aligned (Independent testability & measurable success criteria intact)
- .specify/templates/tasks-template.md: ✅ verified aligned (Phase-based execution & test-first structure supported)

Follow-up Deferred Items: None
-->

# Enterprise HRMS Backend Constitution

## Core Principles

### I. Clean Architecture & Strict Layering
All service code MUST strictly adhere to unidirectional Clean Architecture layering: Controller (transport) → Service (business logic / use case orchestration) → Repository (persistence).
- Controllers MUST only handle HTTP transport, DTO binding, status codes, Swagger documentation, and guard/interceptor execution; controllers MUST NOT execute business logic, call repositories directly, or handle business errors with inline try/catch.
- Services MUST encapsulate domain logic, business validations, transaction boundaries, caching decisions, and event publishing; services MUST NOT reference HTTP `Request` or `Response` objects.
- Repositories MUST solely manage persistence queries extending `BaseRepository` from `@hrms/libs-sql`; repositories MUST NOT evaluate business rules.
- Internal domain modules MUST encapsulate their internals; cross-module access within a service MUST occur solely via exported service providers defined in the module's public `index.ts` barrel.

### II. Strict TypeScript & Type Safety
The codebase MUST enforce maximum type safety without compromise:
- `strict: true` is non-negotiable across all root and module `tsconfig.json` files (`strictNullChecks`, `noImplicitAny`, and `strictPropertyInitialization` MUST remain enabled).
- The `any` type is strictly forbidden in production code; unverified input or dynamic shapes MUST use `unknown` and undergo narrowing before use.
- All exported functions, methods, and class members MUST declare explicit return types.
- Immutability MUST be favored by default: DTO properties and value objects MUST be marked `readonly`.
- Every file MUST represent a single concept (`<name>.<type>.ts`), avoiding default exports in favor of named exports. No interface may use the `I` prefix.

### III. Polyrepo Domain Isolation & Explicit Contracts
Each bounded business domain represents an independent deployable service with exclusive data ownership:
- Each service MUST own its database/schema exclusively; direct cross-service database queries, shared tables, and cross-database joins are strictly prohibited.
- Inter-service synchronous communication MUST occur exclusively via typed HTTP clients consuming versioned OpenAPI REST contracts.
- Inter-service asynchronous communication MUST occur exclusively via Kafka events utilizing versioned schemas published to dedicated topics.
- Shared domain-agnostic logic MUST be consumed via versioned npm packages (`@hrms/libs-core`, `@hrms/libs-sql`, `@hrms/libs-apis`), never copy-pasted or directly imported from peer domain source trees.

### IV. Data Integrity, Migrations & Structured Caching
Data persistence and caching MUST follow deterministic, resilient patterns:
- All database schema modifications MUST use TypeORM migrations with verified `up()` and `down()` methods; `synchronize: true` is prohibited in non-local environments.
- Multi-statement write operations requiring atomicity MUST execute inside an explicit transaction (`runInTransaction` / `QueryRunner`).
- List endpoints MUST enforce pagination via `@hrms/libs-sql` and MUST NOT perform unconstrained queries. N+1 queries in loops are review blockers.
- Caching MUST be routed through `CacheManager` from `@hrms/libs-core` with namespaced keys (`<domain>:<entity>:<id>`) and explicit TTLs. Mutable transactional workflows MUST NEVER be cached.
- Entities subject to concurrent modifications MUST implement optimistic locking (`@VersionColumn()`).

### V. Unified Observability, Error Handling & Security
System instrumentation, exception routing, and security policies MUST operate through shared framework contracts:
- Logging MUST use structured JSON via `AppLogger` (`@hrms/libs-core`) with `requestId`, `sessionId`, and `tenantCode` propagated via `AsyncLocalStorage`. Raw `console.log` is prohibited.
- Domain errors MUST throw typed exceptions extending `BaseException` (`BusinessException`, `ValidationException`, `InfrastructureException`), handled uniformly by the global exception filter from `@hrms/libs-apis`.
- Authentication MUST verify asymmetric JWT RS256 tokens using the public key; symmetric shared secrets across services are prohibited.
- Authorization MUST be declared at controller endpoints via `@Permissions()` and evaluated by `PermissionGuard`.
- All SQL queries MUST utilize parameterized binding; string-interpolated raw SQL is forbidden.

### VI. Testing Discipline & Quality Gates
Testing MUST follow the testing pyramid distribution (~70% unit, ~20% integration, ~10% E2E) and the Arrange-Act-Assert (AAA) structure:
- Unit tests MUST isolate units using NestJS `Test.createTestingModule()` with mocked boundary collaborators.
- Integration and repository tests MUST run against real PostgreSQL and Redis instances orchestrated via Testcontainers with transactional rollbacks or truncation between test runs.
- CI pipelines MUST enforce minimum test coverage thresholds: 90% Statements, 85% Branches, and 90% Functions across packages.
- All commit messages MUST adhere to the Conventional Commits specification, enforced via Husky and Commitlint hooks.

## Technology Stack & Architectural Constraints

| Component | Standard Technology | Policy / Constraint |
|---|---|---|
| Runtime & Framework | Node.js (LTS), NestJS, TypeScript (Strict) | Modular DI, decorator-driven architecture, zero `any` policy. |
| Database & ORM | PostgreSQL, TypeORM | Relational schema, migration-driven, soft deletes via `BaseEntity`. |
| Caching | Redis via `@hrms/libs-core` `CacheManager` | Namespaced keys, mandatory TTLs, cache invalidation in service writes. |
| Auth & RBAC | JWT (RS256), `@hrms/libs-apis` `PermissionGuard` | Asymmetric public key verification, declarative route decorators. |
| API Standard | RESTful JSON, OpenAPI / Swagger | Comprehensive `@Api*` decorators, URI versioning, standard envelope. |
| Messaging | Apache Kafka (`src/kafka/`) | Versioned event schemas, decoupled inter-service domain events. |
| Shared Libraries | `@hrms/libs-core`, `@hrms/libs-sql`, `@hrms/libs-apis` | Versioned npm dependencies; never vendored or mutated locally. |
| Deployment & Infra | Docker, Kubernetes | Immutable container images, declarative K8s manifests per service. |
| Quality Tooling | ESLint, Prettier, Husky, Commitlint, pnpm | Enforced pre-commit and CI gates; strict dependency resolution. |

## Development Workflow & Quality Gates

1. **Local Pre-Commit Gate**:
   - Husky triggers linting (`eslint`), formatting (`prettier`), and commit message validation (`commitlint`).
   - All commits follow `<type>(<scope>): <description>` format.

2. **Continuous Integration (CI) Gate**:
   - `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test:cov` (unit + coverage check) → `pnpm build`.
   - Integration & E2E suites executed against Testcontainers instances.
   - Build artifacts generate/validate OpenAPI specifications.

3. **Code Review Gate**:
   - Strict adherence to the Clean Architecture layer boundaries (no DB access in controllers, no HTTP in services).
   - Validated DTOs on all endpoints (`class-validator` + `class-transformer`).
   - Query efficiency verified (no N+1 queries, indexes on query/filter columns, pagination applied).
   - Hand-crafted TypeORM migration with functional `down()` method included for entity schema updates.
   - Required sign-off from domain team maintainers.

## Governance

This Constitution supersedes all informal development practices, team habits, and undocumented conventions across the Enterprise HRMS Backend services.
- **Enforcement**: All pull requests, automated CI workflows, and code reviews MUST enforce compliance with these principles. Non-compliant contributions MUST NOT be merged without an approved exception.
- **Amendments**: Modifications to this Constitution require documentation of rationale, consensus among technical leads, an impact analysis across services, and a formal semantic version update:
  - **MAJOR** version bumps for backward-incompatible governance or principle changes.
  - **MINOR** version bumps for added principles, sections, or expanded standards.
  - **PATCH** version bumps for clarifications, formatting, or non-semantic editorial refinements.
- **Guidance & Alignment**: For granular implementation guidelines and naming references, consult `coding-conventions.md`, `implemention-rules.md`, `repository-structure.md`, `tech-stack.md`, and `testing-strategy.md`.

**Version**: 1.0.0 | **Ratified**: 2026-08-23 | **Last Amended**: 2026-08-23


---
description: "Task list for Base Source Initialization with Constitution"
---

# Tasks: Base Source Initialization with Constitution

**Input**: Design documents from `specs/001-init-base-source/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are exact repository-relative paths

---

## Phase 1: Setup (Shared Infrastructure & Package Configuration)

**Purpose**: Project initialization, dependency definitions, and build/quality tooling configuration

- [X] T001 Initialize package dependencies (`@nestjs/core`, `@nestjs/common`, `@nestjs/config`, `@nestjs/terminus`, `@nestjs/swagger`, `@hrms/libs-core`, `@hrms/libs-sql`, `@hrms/libs-apis`, `@hrms/libs-events`, `class-validator`, `class-transformer`, `pino`, `pino-pretty`) and lifecycle scripts in `package.json`
- [X] T002 [P] Configure TypeScript compiler options (`strict: true`, decorators, module resolution) in `tsconfig.json` and `tsconfig.build.json`
- [X] T003 [P] Configure Nest CLI builder settings in `nest-cli.json`
- [X] T004 [P] Configure ESLint conventions and Prettier formatting rules in `.eslintrc.js` and `.prettierrc`
- [X] T005 [P] Configure Conventional Commits linting and Git hooks in `commitlint.config.js`, `.husky/pre-commit`, and `.husky/commit-msg`

---

## Phase 2: Foundational (Core Configuration & Bootstrap Wiring)

**Purpose**: Core infrastructure and bootstrap wiring reusing `@hrms/libs-apis` and `@hrms/libs-core`

- [X] T006 [P] Implement strongly typed environment validation schema and configuration factory in `src/config/configuration.ts` and `src/config/env.validation.ts`
- [X] T007 [P] Configure TypeORM database data source settings using `@hrms/libs-sql` in `src/config/typeorm.config.ts`
- [X] T008 Configure root `AppModule` registering `TenantContextMiddleware` and `RequestIdMiddleware` from `@hrms/libs-apis` along with core config in `src/app.module.ts`
- [X] T009 Implement bootstrap entry point in `src/main.ts` configuring `AppLogger` from `@hrms/libs-core`, global exception filter, `swagger.config`, `cors.config`, and `versioning.config` directly from `@hrms/libs-apis`

---

## Phase 3: User Story 1 - Standard Directory Service Scaffolding & Bootstrap Verification (Priority: P1) 🎯 MVP

**Goal**: Establish runnable directory service runtime with environment loading, structured logging with correlation context, and operational `/health/live` and `/health/ready` endpoints.

**Independent Test**: Can be tested independently by bootstrapping the application, verifying health check endpoints (`/health/live`, `/health/ready`) return 200 OK with system status, and verifying structured logs contain request correlation IDs.

### Tests for User Story 1

- [X] T010 [P] [US1] Create unit tests for environment configuration validation in `src/config/env.validation.spec.ts`
- [X] T011 [P] [US1] Create unit tests for health check controller and probes in `src/modules/health/controllers/health.controller.spec.ts`
- [X] T012 [US1] Create E2E integration test verifying bootstrap, correlation ID header (`X-Request-Id`), and `/health/*` endpoints in `test/app.e2e-spec.ts`

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement HealthController exposing `/health/live` and `/health/ready` probes per contract in `src/modules/health/controllers/health.controller.ts`
- [X] T014 [US1] Implement HealthModule integrating `@nestjs/terminus`, database, and cache health indicators in `src/modules/health/health.module.ts`
- [X] T015 [US1] Export public health module providers in `src/modules/health/index.ts`

**Checkpoint**: At this point, the directory service boots cleanly from cold start in under 5s, health probes pass, and correlation IDs are attached to all requests and logs via `@hrms/libs-apis` middlewares.

---

## Phase 4: User Story 2 - Shared Libraries Configuration & Architectural Scaffolding (Priority: P2)

**Goal**: Structure the directory service with enterprise shared libraries (`@hrms/libs-apis`, `@hrms/libs-core`, `@hrms/libs-sql`, `@hrms/libs-events`) and subdomain module skeletons (`employee`, `employment`) without premature business domain models.

**Independent Test**: Can be tested independently by verifying that shared library providers are successfully registered in the NestJS dependency injection container and domain module folders adhere to clean boundary encapsulation.

### Implementation for User Story 2

- [X] T016 [P] [US2] Create directory domain module skeleton and public contract barrel for employee subdomain in `src/modules/employee/employee.module.ts` and `src/modules/employee/index.ts`
- [X] T017 [P] [US2] Create directory domain module skeleton and public contract barrel for employment subdomain in `src/modules/employment/employment.module.ts` and `src/modules/employment/index.ts`
- [X] T018 [P] [US2] Create Kafka event producer/consumer directory structure and contract bindings using `@hrms/libs-events` in `src/kafka/directory-event.producer.ts` and `src/kafka/directory-event.consumer.ts`
- [X] T019 [P] [US2] Initialize TypeORM database migration directory in `src/migrations/.gitkeep`
- [X] T020 [US2] Wire domain module skeletons and `@hrms/libs-*` shared imports into `src/app.module.ts`
- [X] T021 [US2] Create architecture boundary unit test verifying module encapsulation and DI wiring in `src/app.module.spec.ts`

**Checkpoint**: At this point, the shared libraries and modular directory subdomains are wired into the DI graph without premature business entity definitions.

---

## Phase 5: User Story 3 - Automated Quality Gates & Compliance Baseline (Priority: P3)

**Goal**: Establish automated testing harness and code quality gates enforcing 90% statement, 85% branch, and 90% function coverage thresholds along with style and commit linting.

**Independent Test**: Can be tested independently by running `pnpm lint`, `pnpm typecheck`, and `pnpm test:cov`, confirming that all static checks and coverage gates pass.

### Implementation for User Story 3

- [X] T022 [P] [US3] Configure Jest test runner and coverage threshold thresholds (90% Stmt / 85% Branch / 90% Func) in `jest.config.js`
- [X] T023 [P] [US3] Configure Jest E2E test runner configuration in `test/jest-e2e.json`
- [X] T024 [US3] Implement and document directory service developer onboarding, architecture summary, and script commands in `README.md`

**Checkpoint**: At this point, quality verification scripts (`pnpm lint`, `pnpm typecheck`, `pnpm test:cov`) execute cleanly and enforce governance standards.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Infrastructure definitions, containerization, and end-to-end verification

- [X] T025 [P] Create Docker containerization definition for local and CI execution in `docker/Dockerfile` and `docker/docker-compose.yml`
- [X] T026 [P] Create Kubernetes deployment and service manifests in `k8s/deployment.yaml` and `k8s/service.yaml`
- [X] T027 Execute quickstart validation walkthrough according to `specs/001-init-base-source/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion.
- **User Story 3 (Phase 5)**: Depends on User Story 1 & 2 completion.
- **Polish (Phase 6)**: Depends on all user stories being complete.

---

## Parallel Opportunities

- **Phase 1 (Setup)**: Tasks T002, T003, T004, T005 can all run in parallel.
- **Phase 2 (Foundational)**: Tasks T006, T007 can run in parallel before T008, T009.
- **Phase 3 (User Story 1)**: Tests T010, T011 and implementation task T013 can run in parallel.
- **Phase 4 (User Story 2)**: Tasks T016, T017, T018, T019 can run in parallel.
- **Phase 5 (User Story 3)**: Tasks T022, T023 can run in parallel.
- **Phase 6 (Polish)**: Tasks T025, T026 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (package.json, tsconfig, linting, git hooks).
2. Complete **Phase 2: Foundational** (configuration, direct `@hrms/libs-apis` middleware/filter/bootstrap integration).
3. Complete **Phase 3: User Story 1** (Health checks `/health/live`, `/health/ready`, correlation tracking).
4. **STOP and VALIDATE**: Verify application boots in <5s and health endpoints return 200 OK.

### Incremental Delivery

1. Setup + Foundation + US1 → **Runnable Service Foundation (MVP)**
2. Add US2 → **Shared Libraries & Subdomain Scaffolding**
3. Add US3 → **Automated Quality Gates & Test Coverage Enforcement**
4. Polish → **Docker, Kubernetes Manifests & Quickstart Verification**

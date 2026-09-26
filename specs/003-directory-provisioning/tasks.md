# Tasks: Directory Service Provisioning Module

**Input**: Design documents from `/specs/003-directory-provisioning/`
**Prerequisites**: [plan.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/003-directory-provisioning/plan.md), [spec.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/003-directory-provisioning/spec.md), [research.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/003-directory-provisioning/research.md), [data-model.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/003-directory-provisioning/data-model.md), [contracts/setting-events.contract.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/003-directory-provisioning/contracts/setting-events.contract.md)

---

## Phase 1: Setup & Contracts

**Purpose**: Define common enums, Kafka event contracts, and table identifiers across the service.

- [x] T001 [P] Create Setting event type enum in `src/common/enums/setting-event-type.enum.ts`
- [x] T002 [P] Update TableName enum with projection and processed events tables in `src/common/enums/table-name.ts`
- [x] T003 [P] Export new enums in `src/common/enums/index.ts`
- [x] T004 [P] Create universal SettingEvent and payload interfaces in `src/common/interfaces/setting-event.interface.ts`
- [x] T005 [P] Export interfaces in `src/common/interfaces/index.ts`

---

## Phase 2: Foundational Infrastructure

**Purpose**: Establish projection entities, database migrations, and repository base classes required by all provisioning handlers.

**⚠️ CRITICAL**: Must complete before user story handlers are wired into the consumer pipeline.

- [x] T006 [P] Create ProcessedEventEntity for idempotency tracking in `src/modules/provisioning/entities/processed-event.entity.ts`
- [x] T007 [P] Create CompanyProjectionEntity in `src/modules/provisioning/entities/company-projection.entity.ts`
- [x] T008 [P] Create DepartmentProjectionEntity in `src/modules/provisioning/entities/department-projection.entity.ts`
- [x] T009 [P] Create LocationProjectionEntity in `src/modules/provisioning/entities/location-projection.entity.ts`
- [x] T010 [P] Create GradeProjectionEntity in `src/modules/provisioning/entities/grade-projection.entity.ts`
- [x] T011 [P] Create JobTitleProjectionEntity in `src/modules/provisioning/entities/job-title-projection.entity.ts`
- [x] T012 [P] Create barrel export for provisioning entities in `src/modules/provisioning/entities/index.ts`
- [x] T013 [P] Implement ProcessedEventRepository in `src/modules/provisioning/repositories/processed-event.repository.ts`
- [x] T014 [P] Implement CompanyProjectionRepository in `src/modules/provisioning/repositories/company-projection.repository.ts`
- [x] T015 [P] Implement DepartmentProjectionRepository in `src/modules/provisioning/repositories/department-projection.repository.ts`
- [x] T016 [P] Implement LocationProjectionRepository in `src/modules/provisioning/repositories/location-projection.repository.ts`
- [x] T017 [P] Implement GradeProjectionRepository in `src/modules/provisioning/repositories/grade-projection.repository.ts`
- [x] T018 [P] Implement JobTitleProjectionRepository in `src/modules/provisioning/repositories/job-title-projection.repository.ts`
- [x] T019 [P] Create barrel export for provisioning repositories in `src/modules/provisioning/repositories/index.ts`
- [x] T020 [P] Define custom UnsupportedEventError in `src/modules/provisioning/errors/unsupported-event.error.ts`
- [x] T021 [P] Create base provisioning handler abstract class in `src/modules/provisioning/handlers/base-provisioning.handler.ts`

**Checkpoint**: Foundational entities, repositories, and interfaces ready.

---

## Phase 3: User Story 1 - Master Data Projection Sync (Priority: P1) 🎯 MVP

**Goal**: Implement dedicated provisioning handlers for Company, Department, Location, Grade, and JobTitle to synchronize local read projections on created, updated, and deactivated events.

**Independent Test**: Emit `setting.*.created`, `setting.*.updated`, `setting.*.deactivated` events to ProvisioningService and verify that PostgreSQL projection tables reflect the exact state changes scoped by tenant.

- [x] T022 [P] [US1] Create unit tests for CompanyProvisioningHandler in `src/modules/provisioning/handlers/__tests__/company-provisioning.handler.spec.ts`
- [x] T023 [P] [US1] Create unit tests for DepartmentProvisioningHandler in `src/modules/provisioning/handlers/__tests__/department-provisioning.handler.spec.ts`
- [x] T024 [P] [US1] Create unit tests for LocationProvisioningHandler in `src/modules/provisioning/handlers/__tests__/location-provisioning.handler.spec.ts`
- [x] T025 [P] [US1] Create unit tests for GradeProvisioningHandler in `src/modules/provisioning/handlers/__tests__/grade-provisioning.handler.spec.ts`
- [x] T026 [P] [US1] Create unit tests for JobTitleProvisioningHandler in `src/modules/provisioning/handlers/__tests__/job-title-provisioning.handler.spec.ts`
- [x] T027 [P] [US1] Implement CompanyProvisioningHandler in `src/modules/provisioning/handlers/company-provisioning.handler.ts`
- [x] T028 [P] [US1] Implement DepartmentProvisioningHandler in `src/modules/provisioning/handlers/department-provisioning.handler.ts`
- [x] T029 [P] [US1] Implement LocationProvisioningHandler in `src/modules/provisioning/handlers/location-provisioning.handler.ts`
- [x] T030 [P] [US1] Implement GradeProvisioningHandler in `src/modules/provisioning/handlers/grade-provisioning.handler.ts`
- [x] T031 [P] [US1] Implement JobTitleProvisioningHandler in `src/modules/provisioning/handlers/job-title-provisioning.handler.ts`
- [x] T032 [P] [US1] Create barrel export for handlers in `src/modules/provisioning/handlers/index.ts`
- [x] T033 [US1] Create unit tests for ProvisioningService in `src/modules/provisioning/services/__tests__/provisioning.service.spec.ts`
- [x] T034 [US1] Implement ProvisioningService event router in `src/modules/provisioning/services/provisioning.service.ts`
- [x] T035 [US1] Create barrel export for services in `src/modules/provisioning/services/index.ts`

**Checkpoint**: User Story 1 functional and verified across all master data entity handlers.

---

## Phase 4: User Story 2 - Idempotent Event Processing & Deduplication (Priority: P2)

**Goal**: Guarantee at-least-once safety by wrapping handler mutations with atomic transactional insertion into `processed_events` and skipping already-processed event IDs.

**Independent Test**: Replay identical events with the same `eventId` and assert that no duplicate mutations or errors occur and the ledger handles duplicates safely.

- [x] T036 [US2] Create unit tests verifying duplicate event deduplication in `src/modules/provisioning/handlers/__tests__/idempotency.spec.ts`
- [x] T037 [US2] Implement atomic transaction and idempotency verification within `src/modules/provisioning/handlers/base-provisioning.handler.ts`
- [x] T038 [US2] Integrate QueryRunner transaction management in `CompanyProvisioningHandler`, `DepartmentProvisioningHandler`, `LocationProvisioningHandler`, `GradeProvisioningHandler`, `JobTitleProvisioningHandler`

**Checkpoint**: User Stories 1 AND 2 working together with guaranteed idempotency.

---

## Phase 5: User Story 3 - Out-of-Order and Version Conflict Handling (Priority: P3)

**Goal**: Protect projections against stale events arriving out of order by performing optimistic version checks (`eventVersion > projection.version`).

**Independent Test**: Dispatch a newer version event ($V_2$) followed by an older version ($V_1$) and assert that $V_1$ is logged and skipped without mutating state.

- [x] T039 [US3] Create unit tests for out-of-order version rejection in `src/modules/provisioning/handlers/__tests__/versioning.spec.ts`
- [x] T040 [US3] Add aggregate version comparison logic to all entity provisioning handlers in `src/modules/provisioning/handlers/`

**Checkpoint**: Version sequencing enforced; stale events safely ignored.

---

## Phase 6: User Story 4 - Resilient Error Handling, Retries & Dead Letter Queue (DLQ) (Priority: P4)

**Goal**: Ingest Kafka events from `setting.events` via `SettingEventConsumer`, retry transient database errors with exponential backoff, and route poison pills or exhausted retries to `setting.events.dlq`.

**Independent Test**: Ingest malformed events and verify automatic forwarding to DLQ; ingest transient failures and verify retry attempts.

- [x] T041 [US4] Create unit tests for SettingEventConsumer in `src/modules/provisioning/consumers/__tests__/setting-event.consumer.spec.ts`
- [x] T042 [US4] Implement SettingEventConsumer with consumer group `directory-service-provisioning` in `src/modules/provisioning/consumers/setting-event.consumer.ts`
- [x] T043 [US4] Implement DLQ publisher and backoff retry policy in `src/modules/provisioning/consumers/setting-event.consumer.ts`
- [x] T044 [P] [US4] Create barrel export for consumers in `src/modules/provisioning/consumers/index.ts`

**Checkpoint**: Complete event consumption lifecycle with retry and DLQ resilience.

---

## Phase 7: Polish & Module Integration

**Purpose**: Wire module into NestJS dependency injection container, configure metrics/observability, and run full test suites.

- [x] T045 [P] Implement ProvisioningModule wiring entities, repositories, handlers, services, and consumer in `src/modules/provisioning/provisioning.module.ts`
- [x] T046 [P] Create barrel export for ProvisioningModule in `src/modules/provisioning/index.ts`
- [x] T047 Import ProvisioningModule into root `src/app.module.ts`
- [x] T048 Add structured logging and metrics instrumentation across consumer and handlers in `src/modules/provisioning/`
- [x] T049 Execute test suite `pnpm test src/modules/provisioning` and verify coverage thresholds ($\ge 90\%$ statement, $\ge 85\%$ branch)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup & Contracts (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — blocks all handlers.
- **User Story 1 (Phase 3)**: Depends on Phase 2 — implements core handlers and router service.
- **User Story 2 (Phase 4)**: Depends on Phase 3 — integrates atomic idempotency transactions into handlers.
- **User Story 3 (Phase 5)**: Depends on Phase 4 — adds version sequencing checks into handlers.
- **User Story 4 (Phase 6)**: Depends on Phase 5 — wires Kafka consumer, retry loop, and DLQ routing.
- **Polish & Module Integration (Phase 7)**: Depends on all stories completed.

---

## Parallel Execution Opportunities

- All Phase 1 tasks (`T001`-`T005`) can execute in parallel.
- Entity definitions (`T006`-`T011`) and Repository implementations (`T013`-`T018`) can execute in parallel.
- Unit test suites (`T022`-`T026`) and handler implementations (`T027`-`T031`) can run in parallel across entity types.

---

## Implementation Strategy (MVP First)

1. **MVP Target (User Story 1)**: Implement Phases 1, 2, and 3 to have fully functional in-memory/unit-tested handlers synchronizing all master data entities.
2. **Incremental Hardening**: Add Idempotency (US2), Versioning (US3), and Kafka Consumer with DLQ (US4).
3. **Module Registration**: Integrate `ProvisioningModule` into `AppModule` and verify test coverage.

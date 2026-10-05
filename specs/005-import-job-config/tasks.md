# Tasks: Import Job Configuration Management

**Input**: Design documents from `specs/005-import-job-config/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/import-profiles-api.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/import-profiles-api.md`, `quickstart.md`

**Tests**: Unit and integration tests are required as specified in the feature requirements and constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Exact file paths are included in each task description

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Shared enums, interfaces, and table constants required by the domain and database layers.

- [X] T001 Register `EmployeeImportProfile` and `EmployeeImportJob` table names in `src/common/enums/table-name.ts`
- [X] T002 [P] Define `ImportRowErrorMode` enum in `src/common/enums/import-row-error-mode.enum.ts` and export via `src/common/enums/index.ts`
- [X] T003 [P] Define core policy interfaces (`ImportJobConfig`, `ErrorPolicyConfig`, `RetryPolicyConfig`, `TimeoutPolicyConfig`, `ExecutionPolicyConfig`) in `src/common/interfaces/import-config.interface.ts` and export via `src/common/interfaces/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema, base entities, repositories, and standalone runtime validation infrastructure that MUST be completed before user stories.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [X] T004 Create TypeORM database migration for `employee_import_profiles` and `employee_import_jobs` tables with `company_id UUID NULL`, tenant indexes, partial unique constraints, and foreign keys in `src/migrations/1728045000000-create-employee-import-profiles-and-jobs.ts`
- [X] T005 [P] Create `EmployeeImportProfileEntity` with `companyId`, optimistic locking `@VersionColumn()`, and JSONB `config` in `src/modules/employee-import/entities/employee-import-profile.entity.ts`
- [X] T006 [P] Create `EmployeeImportJobEntity` with `companyId`, status, profile reference, and JSONB `config_snapshot` in `src/modules/employee-import/entities/employee-import-job.entity.ts`
- [X] T007 [P] Create `EmployeeImportProfileRepository` extending `BaseRepository` supporting `companyId` filtering in `findAccessibleProfiles` and `findByNameAndTenant` in `src/modules/employee-import/repositories/employee-import-profile.repository.ts`
- [X] T008 [P] Create `EmployeeImportJobRepository` extending `BaseRepository` in `src/modules/employee-import/repositories/employee-import-job.repository.ts`
- [X] T009 Implement standalone runtime `ConfigurationValidator` and validation rules enforcing strict whitelist and cross-field invariants in `src/modules/employee-import/validators/configuration.validator.ts`
- [X] T010 [P] Create unit tests for `ConfigurationValidator` verifying valid schemas, boundary limits, unknown keys, and cross-field constraints in `src/modules/employee-import/validators/configuration.validator.spec.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Manage Reusable Import Profiles with Versioning & Multi-Company Scoping (Priority: P1) 🎯 MVP

**Goal**: Tenant administrators can create, retrieve, update, activate, and deactivate reusable import profiles with optimistic concurrency control, validation, and multi-company scoping validated against `CompanyProjectionRepository`.

**Independent Test**: Can be verified by sending REST requests to create a profile (with or without `companyId`), retrieve it by ID, update its configuration with an expected version (incrementing version from 1 to 2), activate/deactivate the profile, verify company existence/active status via `CompanyProjectionRepository`, and assert that a stale version update yields an HTTP 409 Conflict error.

### Tests for User Story 1

- [X] T011 [P] [US1] Write unit tests for `EmployeeImportProfileService` covering profile creation, `companyId` validation against `CompanyProjectionRepository`, retrieval, updates, optimistic concurrency conflict detection, and activation/deactivation in `src/modules/employee-import/services/employee-import-profile.service.spec.ts`
- [X] T012 [P] [US1] Write unit tests for `EmployeeImportProfileController` verifying endpoint HTTP status codes, `companyId` query filters, DTO bindings, and error mappings in `src/modules/employee-import/controllers/employee-import-profile.controller.spec.ts`

### Implementation for User Story 1

- [X] T013 [P] [US1] Create request and response DTOs (`CreateImportProfileDto`, `UpdateImportProfileDto`, `ImportProfileResponseDto`) with `companyId?: string | null` and `class-validator` annotations in `src/modules/employee-import/dto/`
- [X] T014 [US1] Implement `EmployeeImportProfileService` injecting `CompanyProjectionRepository` for company validation, profile creation, retrieval with `companyId` filter, optimistic concurrency version check, updates, and lifecycle activation/deactivation in `src/modules/employee-import/services/employee-import-profile.service.ts`
- [X] T015 [US1] Implement `EmployeeImportProfileController` exposing `POST /employee-import-profiles`, `GET /employee-import-profiles` (supporting `companyId` query filter), `GET /employee-import-profiles/:id`, `PATCH /employee-import-profiles/:id`, `POST /employee-import-profiles/:id/activate`, and `POST /employee-import-profiles/:id/deactivate` with `@RequirePermission()` guards in `src/modules/employee-import/controllers/employee-import-profile.controller.ts`
- [X] T016 [US1] Configure and register `EmployeeImportModule` importing `ProvisioningModule` (for `CompanyProjectionRepository`) in `src/modules/employee-import/employee-import.module.ts` and import into `src/app.module.ts`

**Checkpoint**: At this point, User Story 1 is fully functional and delivers an MVP import profile management API with multi-company scoping.

---

## Phase 4: User Story 2 - Effective Configuration Resolution & Safety Guardrails (Priority: P1)

**Goal**: Deterministically resolve effective import configurations across a 3-tier hierarchy (System Baseline → Tenant Profile → Job Overrides) with non-overridable system safety quotas.

**Independent Test**: Can be verified by invoking `ConfigurationResolverService.resolve(...)` with partial profile and job overrides, asserting deep nested merging of policy attributes, and asserting that exceeding resource quotas (e.g., batch size > 1000) throws an immediate validation exception.

### Tests for User Story 2

- [X] T017 [P] [US2] Write unit tests for `ConfigurationResolverService` covering system baseline fallback, 3-tier deep merging, and safety quota ceiling rejections in `src/modules/employee-import/services/configuration-resolver.service.spec.ts`

### Implementation for User Story 2

- [X] T018 [US2] Implement `ConfigurationResolverService` with immutable system baseline defaults, custom deep nested merge, and `SYSTEM_SAFETY_LIMITS` quota enforcement in `src/modules/employee-import/services/configuration-resolver.service.ts`

**Checkpoint**: At this point, User Stories 1 and 2 work together to manage profiles and resolve effective configurations.

---

## Phase 5: User Story 3 - Immutable Configuration Snapshotting on Job Initiation (Priority: P2)

**Goal**: Persist the resolved effective configuration as an immutable snapshot in `employee_import_jobs.config_snapshot` along with `company_id`, `profile_id`, and `profile_version` when an import job is initiated, validating company scope compatibility between profile and job.

**Independent Test**: Can be verified by creating an import job referencing Profile A at version 1 (with matching `companyId`), updating Profile A to version 2, and asserting that the job's persisted `config_snapshot`, `company_id`, and `profile_version` remain unchanged, and that mismatched `companyId` between job and profile is rejected.

### Tests for User Story 3

- [X] T019 [P] [US3] Write unit tests for `EmployeeImportJobService` verifying effective configuration resolution, immutable snapshot persistence with `companyId`, `CompanyProjectionRepository` validation, company scope matching against profile, and snapshot invariance upon profile updates in `src/modules/employee-import/services/employee-import-job.service.spec.ts`

### Implementation for User Story 3

- [X] T020 [P] [US3] Create `CreateImportJobDto` and `ImportJobResponseDto` with `companyId?: string | null` in `src/modules/employee-import/dto/`
- [X] T021 [US3] Implement `EmployeeImportJobService` injecting `CompanyProjectionRepository` to validate company existence/status, ensure company compatibility with referenced profile, resolve effective configuration with ad-hoc overrides, and persist immutable job snapshots in `src/modules/employee-import/services/employee-import-job.service.ts`

**Checkpoint**: Import job snapshot persistence is fully functional and auditable independently of subsequent profile mutations.

---

## Phase 6: User Story 4 - Multi-Tenant Isolation & System Profile Governance (Priority: P3)

**Goal**: Prevent cross-tenant data leakage, enforce tenant and company scoping boundaries, and protect system-level profiles from modification or deactivation by tenant administrators.

**Independent Test**: Can be verified by attempting to access or modify Tenant B's profiles while authenticated as Tenant A (yielding 404/403), listing profiles to verify only own-tenant and system profiles are visible, and attempting to edit a system profile (yielding 403 Forbidden).

### Tests for User Story 4

- [X] T022 [P] [US4] Write unit tests verifying tenant boundary enforcement, company-scoping boundary rules, and system-profile immutability for tenant admins in `src/modules/employee-import/services/employee-import-profile.service.spec.ts`

### Implementation for User Story 4

- [X] T023 [US4] Enforce tenant filtering, company-scoping isolation, and system profile protection in `EmployeeImportProfileRepository` and `EmployeeImportProfileService` (`WHERE tenant_code = :tenantCode OR tenant_code IS NULL` on read, 403 Forbidden on tenant mutation of system profiles) in `src/modules/employee-import/services/employee-import-profile.service.ts`

**Checkpoint**: Multi-tenant boundaries and system profile protection are strictly enforced across all profile operations.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Module exports, linting, test suite execution, coverage verification, and quickstart validation.

- [X] T024 [P] Export all public providers, entities, repositories, and DTOs from `src/modules/employee-import/index.ts`
- [X] T025 Run linter and type checker (`pnpm lint` and `pnpm build`) to verify zero type or styling errors across the project
- [X] T026 Run complete test suite and coverage check (`pnpm test src/modules/employee-import/`) ensuring >=90% statement and >=85% branch coverage
- [X] T027 Execute quickstart verification scenarios documented in `specs/005-import-job-config/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion. Can proceed independently.
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion. Can proceed in parallel with US1.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 completion (consumes profiles, configuration resolver, and company validation).
- **User Story 4 (Phase 6)**: Depends on US1 completion.
- **Polish (Phase 7)**: Depends on all user story phases being complete.

### User Story Dependencies

```text
Foundational (Phase 2)
  ├── User Story 1 (P1: Profile Management & Multi-Company) ──────┐
  │     └── User Story 4 (P3: Tenant Isolation & Governance)       │
  └── User Story 2 (P1: Config Resolution) ───────────────────────┴──► User Story 3 (P2: Job Snapshotting)
```

---

## Parallel Opportunities

- **Phase 1**: T002 and T003 can be executed in parallel.
- **Phase 2**: T005, T006, T007, T008, and T010 can be executed in parallel.
- **Phase 3**: T011, T012, and T013 can be executed in parallel before service and controller assembly.
- **Phase 4**: T017 test can be written in parallel.
- **Phase 5**: T019 and T020 can be executed in parallel.
- **Phase 6**: T022 test can be written in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1 with Multi-Company Scoping).
3. Validate: Profile CRUD, validation, company validation, and optimistic concurrency work end-to-end.

### Incremental Delivery
1. Foundation + US1 → Reusable profiles and company scoping ready (MVP).
2. Add US2 → Effective configuration resolution and safety limits ready.
3. Add US3 → Immutable job snapshots with company compatibility ready for worker execution integration.
4. Add US4 → Complete multi-tenant and system governance hardening.
5. Polish → Coverage gates and quickstart validation.

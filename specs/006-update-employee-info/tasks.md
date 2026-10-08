# Tasks: Update Employee Information API

**Input**: Design documents from `specs/006-update-employee-info/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/update-employee-api.md`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/update-employee-api.md`, `quickstart.md`

**Tests**: Unit and integration tests are required as specified in the feature requirements and constitution (testing discipline ≥90% statement / ≥85% branch coverage).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Exact file paths are included in each task description

---

## Phase 1: Setup (Shared DTOs & Validation Schema)

**Purpose**: Define the request DTO schemas and validation annotations required for partial employee updates.

- [ ] T001 Create `UpdateEmployeeDto` with partial properties, validation decorators (`IsOptional`, string lengths, date strings, enum, UUID), and `readonly` modifiers in `src/modules/employee/dto/update-employee.dto.ts`
- [ ] T002 [P] Create unit tests for `UpdateEmployeeDto` verifying valid partial bodies, empty payload checks, invalid formats, and type coercion in `src/modules/employee/dto/update-employee.dto.spec.ts`
- [ ] T003 Export `UpdateEmployeeDto` from the barrel file in `src/modules/employee/dto/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core outbox event formatting and validator enhancements that MUST be completed before user story service orchestration.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [ ] T004 Implement `fromEmployeeUpdated(employee, assignment)` method in `src/modules/outbox/services/outbox.service.ts` to construct and persist `directory.employee.updated` events
- [ ] T005 [P] Create unit tests for `OutboxService.fromEmployeeUpdated` verifying event structure, aggregate mapping, version, and payload schema in `src/modules/outbox/services/outbox.service.spec.ts`
- [ ] T006 Enhance `EmployeeReferenceValidator` to support partial reference resolution against existing active assignments in `src/modules/employee/validators/employee-reference.validator.ts`
- [ ] T007 [P] Create unit tests for `EmployeeReferenceValidator` covering partial reference merging, inactive projection checks, and cross-company mismatch rejection in `src/modules/employee/validators/employee-reference.validator.spec.ts`
- [ ] T008 Enhance `ManagerValidator` to enforce anti-self checks (`CANNOT_REPORT_TO_SELF`) and immediate 1-hop circular reporting hierarchy checks (`CIRCULAR_REPORTING_HIERARCHY`) in `src/modules/employee/validators/manager.validator.ts`
- [ ] T009 [P] Create unit tests for `ManagerValidator` covering self-manager, circular reporting, inactive manager, and valid reporting lines in `src/modules/employee/validators/manager.validator.spec.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Update Employee Personal & Profile Information (Priority: P1) 🎯 MVP

**Goal**: HR Administrators can partially update an existing employee's personal profile attributes (names, preferred name, contact details, date of birth, gender, and residential address) within the authenticated tenant context, emitting outbox events and preserving unmodified fields.

**Independent Test**: Can be verified by sending a `PATCH /employees/{id}` request with partial profile attributes (`preferredName`, `personalPhone`, `address`), asserting a `200 OK` response with updated fields, verifying unmodified fields remain unchanged, verifying database persistence in `employee_profiles`, and asserting creation of an outbox event `directory.employee.updated`.

### Tests for User Story 1

- [ ] T010 [P] [US1] Write unit tests for `EmployeeService.update` covering profile updates, omitted fields preservation, nullable field clearing, non-existent employee (`404 EMPLOYEE_NOT_FOUND`), tenant scoping, and atomic outbox creation in `src/modules/employee/services/employee.service.spec.ts`
- [ ] T011 [P] [US1] Write unit tests for `EmployeeController` verifying `PATCH /employees/:id` endpoint bindings, UUID param validation, `@RequirePermission('employee.update')` guard, and HTTP status codes in `src/modules/employee/controllers/employee.controller.spec.ts`

### Implementation for User Story 1

- [ ] T012 [US1] Implement core `update(id, dto)` orchestration in `EmployeeService` covering tenant isolation, employee and profile retrieval, partial profile field updates, atomic transaction via `TransactionService.runInTransaction`, outbox event persistence, and audit logging in `src/modules/employee/services/employee.service.ts`
- [ ] T013 [US1] Expose `@Patch(':id')` endpoint in `EmployeeController` with `@RequirePermission('employee.update')`, Swagger documentation (`@ApiOperation`, `@ApiResponse`), and DTO binding in `src/modules/employee/controllers/employee.controller.ts`

**Checkpoint**: At this point, User Story 1 is fully functional and delivers an MVP update employee profile API.

---

## Phase 4: User Story 2 - Update Employment Lifecycle & Timeline Attributes (Priority: P2)

**Goal**: HR Administrators can update an employee's employment type, employment status, system status, and lifecycle milestone dates (`joinedAt`, `probationEndAt`, `endedAt`) while enforcing employee code immutability and date consistency invariants.

**Independent Test**: Can be verified by sending a `PATCH /employees/{id}` request with status transitions (`ACTIVE`, `employmentStatus = ACTIVE`), verifying `chk_employees_dates` invariant rejection (`endedAt < joinedAt` yields HTTP `400 INVALID_EMPLOYMENT_DATES`), and asserting that attempts to mutate `employeeCode` are rejected with HTTP `400 EMPLOYEE_CODE_IMMUTABLE`.

### Tests for User Story 2

- [ ] T014 [P] [US2] Write unit tests in `src/modules/employee/services/employee.service.spec.ts` covering status and lifecycle date transitions, `endedAt >= joinedAt` consistency checks against incoming and existing dates, and `employeeCode` immutability rejection

### Implementation for User Story 2

- [ ] T015 [US2] Implement employment lifecycle fields updates (`employmentType`, `employmentStatus`, `status`, `joinedAt`, `probationEndAt`, `endedAt`), date range validation, and `employeeCode` immutability enforcement in `EmployeeService` in `src/modules/employee/services/employee.service.ts`

**Checkpoint**: At this point, User Stories 1 and 2 work together to support profile and employment status updates.

---

## Phase 5: User Story 3 - Update Organizational Assignment & Reporting Line (Priority: P3)

**Goal**: HR Administrators can update an employee's organizational placement (Department, Location, Grade, Job Title, or Reporting Manager) with local Setting projections validation and circular reporting guardrails.

**Independent Test**: Can be verified by sending a `PATCH /employees/{id}` with updated `departmentId` and `managerId`, asserting that invalid or cross-company department IDs return HTTP `400 INVALID_ORGANIZATION_ASSIGNMENT`, verifying that self-manager and circular reporting return HTTP `400` (`CANNOT_REPORT_TO_SELF` / `CIRCULAR_REPORTING_HIERARCHY`), and verifying that valid updates mutate the active assignment and return resolved projection names.

### Tests for User Story 3

- [ ] T016 [P] [US3] Write unit tests in `src/modules/employee/services/employee.service.spec.ts` covering assignment updates, local projection resolution, company boundary validation, manager validation, and response mapping with resolved entity names

### Implementation for User Story 3

- [ ] T017 [US3] Integrate active assignment retrieval via `EmploymentAssignmentRepository.findCurrentAssignment` and partial assignment mutation into `EmployeeService.update` in `src/modules/employee/services/employee.service.ts`
- [ ] T018 [US3] Connect enhanced `EmployeeReferenceValidator` and `ManagerValidator` into `EmployeeService.update` within the transaction in `src/modules/employee/services/employee.service.ts`
- [ ] T019 [US3] Update response mapping to include resolved organization names and manager information in `EmployeeResponseDto` returned from `EmployeeService.update` in `src/modules/employee/services/employee.service.ts`

**Checkpoint**: All three user stories are now fully implemented and integrated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end scenario verification, test coverage enforcement, and linting compliance.

- [ ] T020 Run automated unit test suite across `src/modules/employee` and `src/modules/outbox` with coverage enforcement (`pnpm test:cov`) ensuring ≥90% statement / ≥85% branch coverage
- [ ] T021 [P] Execute linting and formatting validation (`pnpm lint` & `pnpm format:check`) across modified source files
- [ ] T022 Execute quickstart validation scenarios defined in `specs/006-update-employee-info/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user story phases.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion:
  - User Story 1 (P1 - MVP): Establishes core PATCH endpoint, service orchestration, and profile updates.
  - User Story 2 (P2): Extends service orchestration with status, lifecycle dates, and immutability guardrails.
  - User Story 3 (P3): Extends service orchestration with organizational assignment and manager validation.
- **Polish (Phase 6)**: Depends on all user story phases being completed.

### Parallel Opportunities

- Within Phase 1: `T002` (DTO tests) can run in parallel with `T003` (barrel export).
- Within Phase 2: `T005` (outbox tests), `T007` (reference validator tests), and `T009` (manager validator tests) can run in parallel.
- Within User Story 1: `T010` (service tests) and `T011` (controller tests) can run in parallel.
- Within Polish: `T021` (lint check) can run in parallel with test suite verification.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup: DTOs).
2. Complete Phase 2 (Foundational: Outbox and Validators).
3. Complete Phase 3 (User Story 1: Personal Profile Updates & PATCH endpoint).
4. **STOP and VALIDATE**: Verify User Story 1 independently with unit tests and curl scenarios.

### Incremental Delivery

1. Foundation ready (Phases 1 & 2).
2. Deliver US1 (MVP) -> Test independently -> Verified.
3. Deliver US2 (Status & Dates) -> Test independently -> Verified.
4. Deliver US3 (Assignment & Manager) -> Test independently -> Verified.
5. Execute Polish phase (Full test coverage and lint verification).

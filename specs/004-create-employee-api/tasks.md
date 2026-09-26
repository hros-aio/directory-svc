# Tasks: Create Employee API in Directory Service

**Input**: Design documents from `specs/004-create-employee-api/`
**Prerequisites**: [plan.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/004-create-employee-api/plan.md), [spec.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/004-create-employee-api/spec.md), [data-model.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/004-create-employee-api/data-model.md), [research.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/004-create-employee-api/research.md)

---

## Phase 1: Foundational Infrastructure & Repositories

**Purpose**: Core outbox entity/repository, table enums, and persistence layer repositories required before business workflows.

- [x] T001 [P] Create `OutboxStatus` enum in `src/common/enums/outbox-status.enum.ts` and update `src/common/enums/table-name.ts` with `OutboxEvent = 'outbox_events'`.
- [x] T002 [P] Create `OutboxEventEntity` in `src/modules/outbox/entities/outbox-event.entity.ts`.
- [x] T003 [P] Create `OutboxRepository` in `src/modules/outbox/repositories/outbox.repository.ts` and wire `OutboxModule` in `src/modules/outbox/outbox.module.ts`.
- [x] T004 [P] Create `EmployeeRepository` in `src/modules/employee/repositories/employee.repository.ts`.
- [x] T005 [P] Create `EmployeeProfileRepository` in `src/modules/employee/repositories/employee-profile.repository.ts`.
- [x] T006 [P] Create `EmploymentAssignmentRepository` in `src/modules/employment/repositories/employment-assignment.repository.ts`.

---

## Phase 2: DTOs, Contracts & Validators

**Purpose**: DTO binding, request payload validation, and business rule validators.

- [x] T007 [P] Create `AddressDto` and `CreateEmployeeDto` with validation rules in `src/modules/employee/dto/create-employee.dto.ts`.
- [x] T008 [P] Create `EmployeeResponseDto` with resolved reference names in `src/modules/employee/dto/employee-response.dto.ts`.
- [x] T009 [P] Create `DirectoryEmployeeCreatedEvent` payload contract in `src/modules/employee/events/employee-created.event.ts`.
- [x] T010 [P] Implement `EmployeeReferenceValidator` in `src/modules/employee/validators/employee-reference.validator.ts` validating against local Setting projections.
- [x] T011 [P] Implement `ManagerValidator` in `src/modules/employee/validators/manager.validator.ts` validating manager eligibility in tenant.

---

## Phase 3: User Story 1 - Create Employee & Assignment (Priority: P1) 🎯 MVP

**Goal**: Atomic persistence of Employee, Profile, Assignment, and Outbox Event inside a single database transaction, returning HTTP 201 Created with resolved projection names.

- [x] T012 [US1] Implement `EmployeeService.createEmployee()` in `src/modules/employee/services/employee.service.ts` using `TransactionService.runInTransaction`.
- [x] T013 [US1] Implement `EmployeeController.create()` in `src/modules/employee/controllers/employee.controller.ts` with `@Post()`, `@Permissions('employee.create')`, `@UseGuards(PermissionGuard)`.
- [x] T014 [US1] Wire all providers and dependencies into `EmployeeModule`, `EmploymentModule`, `OutboxModule`, and `AppModule`.

---

## Phase 4: User Story 2 & 3 - Reference Validation, Guardrails & Error Mapping (Priority: P2/P3)

**Goal**: Comprehensive validation error mapping (400, 404, 409), tenant isolation enforcement, duplicate employee code checks, and audit logging.

- [x] T015 [US2] Enhance `EmployeeReferenceValidator` and `EmployeeService` error mappings (`COMPANY_NOT_FOUND`, `LOCATION_NOT_FOUND`, `DEPARTMENT_NOT_FOUND`, `GRADE_NOT_FOUND`, `JOB_TITLE_NOT_FOUND`, `INVALID_ORGANIZATION_ASSIGNMENT`, `SETTING_PROJECTION_NOT_READY`).
- [x] T016 [US3] Enforce duplicate employee code conflict handling (`DUPLICATE_EMPLOYEE_CODE`) and manager validation (`MANAGER_NOT_FOUND`, `INVALID_MANAGER`).
- [x] T017 [US3] Add structured audit logging via `AppLogger` on successful employee creation.

---

## Phase 5: Verification & Quality Gates

**Purpose**: Automated test suites, coverage, and TypeScript verification.

- [x] T018 [P] Unit tests for `CreateEmployeeDto` in `src/modules/employee/dto/create-employee.dto.spec.ts`.
- [x] T019 [P] Unit tests for `EmployeeReferenceValidator` in `src/modules/employee/validators/employee-reference.validator.spec.ts`.
- [x] T020 [P] Unit tests for `ManagerValidator` in `src/modules/employee/validators/manager.validator.spec.ts`.
- [x] T021 [P] Unit tests for `EmployeeService` in `src/modules/employee/services/employee.service.spec.ts`.
- [x] T022 [P] Unit tests for `EmployeeController` in `src/modules/employee/controllers/employee.controller.spec.ts`.
- [x] T023 Run typecheck, linting, and full test suite across the repository.

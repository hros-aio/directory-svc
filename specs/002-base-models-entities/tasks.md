---
description: "Task list for Base Models and Entities implementation"
---

# Tasks: Base Models and Entities for Directory Service

**Input**: Design documents from `specs/002-base-models-entities/`
**Prerequisites**: [plan.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/002-base-models-entities/plan.md), [spec.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/002-base-models-entities/spec.md), [research.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/002-base-models-entities/research.md), [data-model.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/002-base-models-entities/data-model.md), [contracts/domain-models.contract.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/002-base-models-entities/contracts/domain-models.contract.md)

**Tests**: Unit tests for entity metadata and TypeORM constraints are included to enforce Constitution Principle VI (Testing Discipline).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, module directory structure, and configuration

- [X] T001 Configure common directory structure for enums and interfaces in `src/common/index.ts`
- [X] T002 [P] Verify and update TypeORM entity auto-loading configuration in `src/config/typeorm.config.ts` and `src/app.module.ts`

---

## Phase 2: Foundational (Enums & Value Objects)

**Purpose**: Core enums and interfaces that MUST be complete before ANY entity can be implemented

**⚠️ CRITICAL**: No entity implementation can begin until these enums and value object interfaces are created.

- [X] T003 [P] Implement employee and employment enums in `src/common/enums/employee-status.enum.ts`, `src/common/enums/employment-type.enum.ts`, and `src/common/enums/employment-status.enum.ts`
- [X] T004 [P] Implement onboarding enums in `src/common/enums/onboarding-status.enum.ts`, `src/common/enums/onboarding-requirement-status.enum.ts`, and `src/common/enums/onboarding-requirement-type.enum.ts`
- [X] T005 [P] Implement document and contract enums in `src/common/enums/employee-document-type.enum.ts`, `src/common/enums/employee-document-status.enum.ts`, `src/common/enums/employment-contract-type.enum.ts`, and `src/common/enums/employment-contract-status.enum.ts`
- [X] T006 [P] Implement financial and tax enums in `src/common/enums/bank-account-status.enum.ts` and `src/common/enums/tax-profile-status.enum.ts`
- [X] T007 [P] Create barrel export for all domain enums in `src/common/enums/index.ts`
- [X] T008 [P] Implement common value object interfaces (`Address`, `TaxMetadata`) in `src/common/interfaces/address.interface.ts`, `src/common/interfaces/tax-metadata.interface.ts`, and `src/common/interfaces/index.ts`

**Checkpoint**: Foundation ready - domain entities implementation can now begin.

---

## Phase 3: User Story 1 - Employee Master & Personal Profile Management (Priority: P1) 🎯 MVP

**Goal**: Deliver the core Employee master entity (`employees`) and Employee Profile entity (`employee_profiles`) with tenant isolation and 1-to-1 relationship.

**Independent Test**: Can be verified by running `employee.entity.spec.ts` validating entity column decorators, indexes, composite unique keys, and cascade deletion.

### Tests for User Story 1
- [X] T009 [P] [US1] Unit test for Employee and EmployeeProfile entity definitions in `src/modules/employee/entities/employee.entity.spec.ts`

### Implementation for User Story 1
- [X] T010 [P] [US1] Implement EmployeeEntity (`employees` table extending `BaseEntity` with composite unique constraints and status enums) in `src/modules/employee/entities/employee.entity.ts`
- [X] T011 [P] [US1] Implement EmployeeProfileEntity (`employee_profiles` table with JSONB address and 1-to-1 cascade relation) in `src/modules/employee/entities/employee-profile.entity.ts`
- [X] T012 [US1] Register Employee and EmployeeProfile entities in `src/modules/employee/employee.module.ts` and export via `src/modules/employee/index.ts`

**Checkpoint**: User Story 1 fully functional and testable independently as the core MVP.

---

## Phase 4: User Story 2 - Effective-Dated Organizational Placement & Reporting Hierarchy (Priority: P2)

**Goal**: Deliver the Employment Assignment entity (`employment_assignments`) supporting point-in-time organizational placement, external setting UUID references, manager relations, and self-manager prevention constraints.

**Independent Test**: Can be verified by running `employment-assignment.entity.spec.ts` checking foreign key constraints, partial active assignment indexes, and check constraints.

### Tests for User Story 2
- [X] T013 [P] [US2] Unit test for EmploymentAssignment entity definition and date/self-manager constraints in `src/modules/employment/entities/employment-assignment.entity.spec.ts`

### Implementation for User Story 2
- [X] T014 [US2] Implement EmploymentAssignmentEntity (`employment_assignments` table with company/department IDs, manager relation, and date range checks) in `src/modules/employment/entities/employment-assignment.entity.ts`
- [X] T015 [US2] Register EmploymentAssignment entity in `src/modules/employment/employment.module.ts` and export via `src/modules/employment/index.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Employment Contracts & Document Compliance Management (Priority: P3)

**Goal**: Deliver legal Employment Contracts (`employment_contracts`) and Employee Verification Documents (`employee_documents`) with status lifecycles and expiration tracking.

**Independent Test**: Can be verified by running `employment-contract.entity.spec.ts` and `employee-document.entity.spec.ts` testing table mappings and date constraints.

### Tests for User Story 3
- [X] T016 [P] [US3] Unit test for EmploymentContract and EmployeeDocument entity definitions in `src/modules/employment/entities/employment-contract.entity.spec.ts` and `src/modules/employee/entities/employee-document.entity.spec.ts`

### Implementation for User Story 3
- [X] T017 [P] [US3] Implement EmploymentContractEntity (`employment_contracts` table with unique contract number per tenant) in `src/modules/employment/entities/employment-contract.entity.ts`
- [X] T018 [P] [US3] Implement EmployeeDocumentEntity (`employee_documents` table with document type/status enums and verification dates) in `src/modules/employee/entities/employee-document.entity.ts`
- [X] T019 [US3] Register contract and document entities in `src/modules/employment/employment.module.ts`, `src/modules/employee/employee.module.ts`, and respective `index.ts` barrels

**Checkpoint**: User Stories 1, 2, and 3 are functional and independently testable.

---

## Phase 6: User Story 4 - Onboarding Workflow & Checklist Lifecycle (Priority: P4)

**Goal**: Deliver Onboarding workflow instances (`onboardings`) and dynamic checklist requirements (`onboarding_requirements`) with lifecycle states.

**Independent Test**: Can be verified by running `onboarding.entity.spec.ts` checking 1-to-1 employee onboarding uniqueness and 1-to-many requirement cascading relations.

### Tests for User Story 4
- [X] T020 [P] [US4] Unit test for Onboarding and OnboardingRequirement entity definitions in `src/modules/employee/entities/onboarding.entity.spec.ts`

### Implementation for User Story 4
- [X] T021 [P] [US4] Implement OnboardingEntity (`onboardings` table with 1-to-1 employee link and lifecycle statuses) in `src/modules/employee/entities/onboarding.entity.ts`
- [X] T022 [P] [US4] Implement OnboardingRequirementEntity (`onboarding_requirements` table with checklist types and dynamic completion timestamps) in `src/modules/employee/entities/onboarding-requirement.entity.ts`
- [X] T023 [US4] Connect Onboarding relationships in `src/modules/employee/employee.module.ts` and export via `src/modules/employee/index.ts`

**Checkpoint**: User Stories 1 through 4 are independently functional.

---

## Phase 7: User Story 5 - Financial & Country-Specific Tax Profiles (Priority: P5)

**Goal**: Deliver Employee Bank Accounts (`employee_bank_accounts`) with primary account uniqueness and Employee Tax Profiles (`employee_tax_profiles`) with active country partial indexes and JSONB metadata.

**Independent Test**: Can be verified by running `employee-bank-account.entity.spec.ts` and `employee-tax-profile.entity.spec.ts` validating partial indexes and JSONB columns.

### Tests for User Story 5
- [X] T024 [P] [US5] Unit test for EmployeeBankAccount and EmployeeTaxProfile entity definitions in `src/modules/employee/entities/employee-bank-account.entity.spec.ts` and `src/modules/employee/entities/employee-tax-profile.entity.spec.ts`

### Implementation for User Story 5
- [X] T025 [P] [US5] Implement EmployeeBankAccountEntity (`employee_bank_accounts` table with primary account partial index) in `src/modules/employee/entities/employee-bank-account.entity.ts`
- [X] T026 [P] [US5] Implement EmployeeTaxProfileEntity (`employee_tax_profiles` table with JSONB metadata and active country partial index) in `src/modules/employee/entities/employee-tax-profile.entity.ts`
- [X] T027 [US5] Register bank account and tax profile entities in `src/modules/employee/employee.module.ts` and export via `src/modules/employee/index.ts`

**Checkpoint**: All 5 user stories and 9 entities are implemented and independently testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Module barrel exports, validation checks, formatting, and test coverage verification

- [X] T028 [P] Consolidate entity barrel exports in `src/modules/employee/entities/index.ts` and `src/modules/employment/entities/index.ts`
- [X] T029 Execute TypeScript type check `pnpm typecheck` to guarantee zero compilation errors and strict type conformance
- [X] T030 Execute linting and formatting validation `pnpm lint` and `pnpm format:check`
- [X] T031 Execute unit test suite with coverage `pnpm test` verifying 90%+ statement coverage per Constitution Principle VI
- [X] T032 Validate all scenarios in `specs/002-base-models-entities/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all entity implementations.
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion.
  - P1 (User Story 1 - Employee Master & Profile) is the core MVP foundation.
  - P2 (User Story 2 - Assignments), P3 (Contracts & Documents), P4 (Onboarding), and P5 (Bank Accounts & Tax Profiles) can proceed sequentially or in parallel once US1 core entity models are in place.
- **Polish (Phase 8)**: Depends on completion of all user story entities and tests.

### Within Each User Story
- Unit tests written first and run via Jest.
- Entity definition created with TypeORM decorators matching `schema.sql`.
- Entity registered in NestJS module and public index barrels.

### Parallel Opportunities

- **Phase 2 (Foundational)**: T003, T004, T005, T006, T007, and T008 can all execute concurrently across separate files.
- **Phase 3 (User Story 1)**: T009 test, T010 EmployeeEntity, and T011 EmployeeProfileEntity can execute in parallel.
- **Phase 5 (User Story 3)**: T016 test, T017 EmploymentContractEntity, and T018 EmployeeDocumentEntity can execute in parallel.
- **Phase 6 (User Story 4)**: T020 test, T021 OnboardingEntity, and T022 OnboardingRequirementEntity can execute in parallel.
- **Phase 7 (User Story 5)**: T024 test, T025 EmployeeBankAccountEntity, and T026 EmployeeTaxProfileEntity can execute in parallel.

---

## Parallel Example: User Story 1 (MVP)

```bash
# Concurrently create test and entities for User Story 1:
Task: "Unit test for Employee and EmployeeProfile entity definitions in src/modules/employee/entities/employee.entity.spec.ts"
Task: "Implement EmployeeEntity in src/modules/employee/entities/employee.entity.ts"
Task: "Implement EmployeeProfileEntity in src/modules/employee/entities/employee-profile.entity.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Enums & Value Object Interfaces)
3. Complete Phase 3: User Story 1 (Employee Master & Profile entities)
4. **STOP and VALIDATE**: Run `pnpm test` and verify Employee & EmployeeProfile metadata.

### Incremental Delivery
1. Foundation + US1 → Core Employee Directory MVP ready.
2. Add US2 → Organizational Assignments & Reporting line structure.
3. Add US3 → Employment Contracts & Compliance Documents.
4. Add US4 → Onboarding workflows & checklist milestones.
5. Add US5 → Bank Accounts & Tax Profiles.
6. Run Phase 8 Polish → Full type safety, linting, and test suite verification.

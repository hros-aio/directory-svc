# Implementation Plan: Update Employee Information API in Directory Service

**Branch**: `006-update-employee-info` | **Date**: 2026-10-08 | **Spec**: [specs/006-update-employee-info/spec.md](spec.md)

**Input**: Feature specification from `specs/006-update-employee-info/spec.md`

---

## Summary

Design and implement the **Update Employee Information API** (`PATCH /employees/:id`) in the Directory Service following Clean Architecture principles and strict polyrepo domain boundaries. The API allows authorized HR Administrators to partially update an existing employee's personal profile (`EmployeeProfileEntity`), employment lifecycle state and dates (`EmployeeEntity`), and organizational placement and reporting line (`EmploymentAssignmentEntity`). All organizational references (`Company`, `Department`, `Location`, `Grade`, `JobTitle`) are validated against local synchronized read projections without synchronous cross-service calls, while manager assignments are guarded against cross-tenant, self-referential, and circular dependencies. Multi-entity updates and transactional outbox event creation (`directory.employee.updated`) execute inside a single atomic PostgreSQL transaction to guarantee full data consistency and reliable downstream asynchronous propagation via Kafka.

---

## Technical Context

**Language/Version**: Node.js LTS (v20+), TypeScript 5.x (Strict mode enabled: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`)

**Primary Dependencies**: NestJS 10.x, TypeORM 0.3.x, `class-validator`, `class-transformer`, `@new-hros/libs-core`, `@new-hros/libs-sql`, `@new-hros/libs-apis`

**Storage**: PostgreSQL 16+ (relational schema, transactional outbox pattern via TypeORM)

**Testing**: Jest, `@nestjs/testing`, Testcontainers (PostgreSQL, Redis)

**Target Platform**: Linux server (Dockerized NestJS microservice container)

**Project Type**: RESTful Web Service (part of Enterprise HRMS Polyrepo)

**Performance Goals**: <250ms p95 latency for employee partial update requests under standard operational load

**Constraints**:
- Strict multi-tenant isolation: Tenant code and actor ID derived exclusively from verified JWT token via `RequestContextService`; cross-tenant lookups and updates prohibited.
- `employeeCode` is immutable; update attempts are rejected with HTTP `400 Bad Request` (`EMPLOYEE_CODE_IMMUTABLE`).
- Projections validated solely against local database tables (`company_projections`, etc.); zero synchronous external HTTP/RPC calls.
- Atomic unit-of-work: Employee, Profile, Assignment, and Outbox event committed within a single database transaction (`runInTransaction`).
- Manager validation prevents self-manager (`CANNOT_REPORT_TO_SELF`) and immediate 1-hop circular reporting hierarchies (`CIRCULAR_REPORTING_HIERARCHY`).

**Scale/Scope**: Core employee maintenance API serving all tenant HR portals and automated workforce lifecycle updates.

---

## Constitution Check

*GATE: All checks evaluated against `.specify/memory/constitution.md`.*

| Principle | Status | Justification / Architectural Alignment |
|---|---|---|
| **I. Clean Architecture & Strict Layering** | **PASS** | Strict layering: `EmployeeController` handles HTTP transport, DTO validation, and route guards; `EmployeeService` orchestrates business logic, validation, transactions, and audit logging; `EmployeeRepository`, `EmployeeProfileRepository`, and `EmploymentAssignmentRepository` handle persistence extending `BaseRepository`. |
| **II. Strict TypeScript & Type Safety** | **PASS** | Strict TypeScript enforced across all files, zero `any` usage, explicit return types on all controller and service methods, immutable `readonly` properties on `UpdateEmployeeDto`. |
| **III. Polyrepo Domain Isolation** | **PASS** | Exclusive data ownership in Directory Service database. Reference entities (`Company`, `Department`, `Location`, `Grade`, `JobTitle`) validated against local read projections populated asynchronously by Provisioning consumers. |
| **IV. Data Integrity & Migrations** | **PASS** | Atomic write operations run in an explicit transaction (`TransactionService.runInTransaction`). Date check constraints (`endedAt >= joinedAt`) enforced at both DTO and DB levels. |
| **V. Unified Observability & Security** | **PASS** | Structured logging via `AppLogger` and `LoggerService.audit('EMPLOYEE_UPDATED', ...)`; domain errors throw typed `BusinessException` handled by global exception filter; secured by `PermissionGuard` and `@RequirePermission('employee.update')`. |
| **VI. Testing Discipline & Quality Gates** | **PASS** | AAA pattern across unit tests (`@nestjs/testing`) and integration suites covering partial updates, omitted fields, date invariants, manager cycle detection, and outbox event creation, targeting ≥90% statement / ≥85% branch coverage. |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-update-employee-info/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 output: Technical research & architectural decisions
├── data-model.md        # Phase 1 output: Entities, table mappings, and validation rules
├── quickstart.md        # Phase 1 output: Verification & test execution guide
├── contracts/           # Phase 1 output: API contracts
│   └── update-employee-api.md
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output: Work breakdown (generated by /speckit-tasks)
```

### Source Code Layout

```text
src/
├── modules/
│   ├── employee/
│   │   ├── controllers/
│   │   │   ├── employee.controller.ts                  # Add @Patch(':id') endpoint
│   │   │   └── employee.controller.spec.ts             # Update controller tests
│   │   ├── dto/
│   │   │   ├── update-employee.dto.ts                  # Add UpdateEmployeeDto with partial validations
│   │   │   ├── update-employee.dto.spec.ts             # DTO unit tests
│   │   │   └── index.ts                                # Export UpdateEmployeeDto
│   │   ├── services/
│   │   │   ├── employee.service.ts                     # Add update(id, dto) method
│   │   │   └── employee.service.spec.ts                # Add unit tests for update scenarios
│   │   └── validators/
│   │       ├── employee-reference.validator.ts         # Support partial reference validation
│   │       ├── employee-reference.validator.spec.ts    # Validator unit tests
│   │       ├── manager.validator.ts                    # Add self & circular reporting validation
│   │       └── manager.validator.spec.ts               # Manager validator tests
│   └── outbox/
│       └── services/
│           ├── outbox.service.ts                       # Add fromEmployeeUpdated(employee, assignment)
│           └── outbox.service.spec.ts                  # Outbox service tests
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | All designs adhere strictly to existing architecture and constitutional principles. | N/A |

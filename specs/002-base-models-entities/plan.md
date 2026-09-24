# Implementation Plan: Base Models and Entities for Directory Service

**Branch**: `002-base-models-entities` | **Date**: 2026-09-24 | **Spec**: [specs/002-base-models-entities/spec.md](file:///home/ren0503/new-hros/admin-module/directory-svc/specs/002-base-models-entities/spec.md)

**Input**: Feature specification from `specs/002-base-models-entities/spec.md`

## Summary

Build and configure the complete set of domain models, TypeORM entities, enumerations, value objects, and repository mappings for the Directory Service (`directory-svc`) based on `schema.sql`. The design encapsulates all 9 core domain entities (`employees`, `employee_profiles`, `employment_assignments`, `employment_contracts`, `employee_documents`, `onboardings`, `onboarding_requirements`, `employee_bank_accounts`, `employee_tax_profiles`) and 12 enumerations across two domain modules (`employee`, `employment`), enforcing multi-tenancy, strict TypeScript type safety, optimistic locking, and clean architecture boundaries.

## Technical Context

**Language/Version**: TypeScript 5.3.3 / Node.js >= 20 (Strict mode enabled: `strictNullChecks`, `noImplicitAny`, `strictPropertyInitialization`)

**Primary Dependencies**: NestJS 10.3, `@nestjs/typeorm` 10.0, `typeorm` 0.3.17, `@new-hros/libs-sql` 1.2.0, `@new-hros/libs-core` 1.3.2, `@new-hros/libs-apis` 1.2.2, `class-validator` 0.14, `class-transformer` 0.5

**Storage**: PostgreSQL 18 with `pgcrypto` extension (UUID primary keys, JSONB for address and tax metadata)

**Testing**: Jest 29.7 with unit tests for entity metadata and TypeORM schema definitions

**Target Platform**: Linux / Containerized Node.js Microservice

**Project Type**: NestJS Web Microservice (Domain Entities & Data Layer)

**Performance Goals**: Sub-millisecond in-memory entity instantiation and serialization; optimized TypeORM metadata loading

**Constraints**: Strict compliance with Constitution principles (zero cross-service DB relations, 100% TypeORM migrations compatibility, tenant isolation on all tables)

**Scale/Scope**: 9 entities, 12 enumerations, 2 domain modules, 100% schema.sql parity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check Item | Status | Notes |
|---|---|---|---|
| **I. Clean Architecture & Strict Layering** | Entities and domain models cleanly placed in module directories; no HTTP or business logic in entities | ✅ PASS | Entities reside in `src/modules/<module>/entities/` and common types in `src/common/` |
| **II. Strict TypeScript & Type Safety** | `strict: true` compatibility, zero `any`, explicit types, immutability on value objects, no `I` prefix on interfaces | ✅ PASS | All enums and interfaces strictly typed; no `any` used |
| **III. Domain Isolation & Explicit Contracts** | Zero cross-service foreign keys to Setting Service or Document Service; external IDs stored as UUID columns | ✅ PASS | `company_id`, `department_id`, `file_id`, etc. defined as raw UUID columns |
| **IV. Data Integrity & Optimistic Locking** | Inherits `BaseEntity` with `@VersionColumn()` and soft delete support where applicable; composite unique indexes on tenant code | ✅ PASS | All standard entities extend `BaseEntity`; composite indexes mapped |
| **V. Unified Observability & Security** | Strict multi-tenancy via mandatory `tenant_code` scoping across all tables | ✅ PASS | Every entity explicitly defines `tenant_code` column and composite constraints |
| **VI. Testing Discipline** | Entity definitions and constraints verified via Jest test suites | ✅ PASS | Unit tests planned for entity metadata validation |

## Project Structure

### Documentation (this feature)

```text
specs/002-base-models-entities/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── domain-models.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── common/
│   ├── enums/
│   │   ├── employee-status.enum.ts
│   │   ├── employment-type.enum.ts
│   │   ├── employment-status.enum.ts
│   │   ├── onboarding-status.enum.ts
│   │   ├── onboarding-requirement-status.enum.ts
│   │   ├── onboarding-requirement-type.enum.ts
│   │   ├── employee-document-type.enum.ts
│   │   ├── employee-document-status.enum.ts
│   │   ├── employment-contract-type.enum.ts
│   │   ├── employment-contract-status.enum.ts
│   │   ├── bank-account-status.enum.ts
│   │   ├── tax-profile-status.enum.ts
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── address.interface.ts
│   │   ├── tax-metadata.interface.ts
│   │   └── index.ts
│   └── constants/
├── modules/
│   ├── employee/
│   │   ├── entities/
│   │   │   ├── employee.entity.ts
│   │   │   ├── employee-profile.entity.ts
│   │   │   ├── employee-document.entity.ts
│   │   │   ├── employee-bank-account.entity.ts
│   │   │   ├── employee-tax-profile.entity.ts
│   │   │   ├── onboarding.entity.ts
│   │   │   ├── onboarding-requirement.entity.ts
│   │   │   └── index.ts
│   │   ├── employee.module.ts
│   │   └── index.ts
│   └── employment/
│       ├── entities/
│       │   ├── employment-assignment.entity.ts
│       │   ├── employment-contract.entity.ts
│       │   └── index.ts
│       ├── employment.module.ts
│       └── index.ts
```

**Structure Decision**: Selected domain modular structure dividing entities between `employee` and `employment` modules, sharing common enums and value object interfaces in `src/common/`.

## Complexity Tracking

> **No Constitution violations. No special justifications required.**

# Research & Technical Decisions: Base Models and Entities for Directory Service

## Overview
This document captures architectural and technical decisions for defining the domain models and TypeORM entities for the Directory Service (`directory-svc`), derived from `schema.sql` and conforming to the HRMS Backend Constitution.

---

### Decision 1: Entity Layering & Base Class Inheritance
- **Decision**: All domain entities will extend `BaseEntity` from `@new-hros/libs-sql` where standard audit fields (`id`, `tenantCode`, `createdAt`, `updatedAt`, `deletedAt`, `version`) apply. For `EmployeeProfileEntity` (which uses `employee_id` as primary foreign key matching `employees(id)`), it maps `employee_id` as `@PrimaryColumn('uuid', { name: 'employee_id' })` and includes `tenantCode`, `createdAt`, and `updatedAt`.
- **Rationale**: Reuses the core SQL library patterns across the HRMS ecosystem, enforces optimistic locking (`version`), soft deletes (`deletedAt`), and standardized audit timestamps.
- **Alternatives Considered**: Creating standalone custom base entities per module was rejected to avoid breaking ecosystem conventions established in `@new-hros/libs-sql`.

---

### Decision 2: Module Decomposition & Domain Boundaries
- **Decision**: Organize entities into two core domain modules:
  1. `src/modules/employee/entities/` and `src/modules/employee/models/`:
     - `EmployeeEntity` (`employees`)
     - `EmployeeProfileEntity` (`employee_profiles`)
     - `EmployeeDocumentEntity` (`employee_documents`)
     - `EmployeeBankAccountEntity` (`employee_bank_accounts`)
     - `EmployeeTaxProfileEntity` (`employee_tax_profiles`)
     - `OnboardingEntity` (`onboardings`)
     - `OnboardingRequirementEntity` (`onboarding_requirements`)
  2. `src/modules/employment/entities/` and `src/modules/employment/models/`:
     - `EmploymentAssignmentEntity` (`employment_assignments`)
     - `EmploymentContractEntity` (`employment_contracts`)
  3. Shared Enums & Value Objects in `src/common/enums/` and `src/common/interfaces/` / `src/common/models/`:
     - Address value object interface
     - Tax metadata interface
     - All 12 domain enums defined in `schema.sql`
- **Rationale**: Directly aligns with existing directory service modules (`employee`, `employment`) while keeping organizational placements and contracts scoped to employment domain logic.
- **Alternatives Considered**: Monolithic single entity directory was rejected as it violates clean modular separation.

---

### Decision 3: Cross-Service References & Foreign Key Representation
- **Decision**: Cross-service foreign keys (e.g. `company_id`, `location_id`, `department_id`, `job_title_id`, `grade_id` owned by Setting Service, and `file_id`, `document_id` owned by Document/Storage Service) are stored strictly as scalar UUID columns (`@Column('uuid', { name: '...' })`), with zero `@ManyToOne` or `@JoinColumn` TypeORM relations referencing external domain tables.
- **Rationale**: Mandatory Constitution Principle III (Polyrepo Domain Isolation & Explicit Contracts). Shared databases and cross-service joins/FKs are strictly prohibited.
- **Alternatives Considered**: Mocking external entities in TypeORM was rejected because it creates phantom schemas and migration issues.

---

### Decision 4: PostgreSQL Enums vs TypeScript String Enums
- **Decision**: Domain enums are defined as native TypeScript string enums matching PostgreSQL enum values exactly, mapped in TypeORM via `@Column({ type: 'enum', enum: EnumName, enumName: 'enum_name' })`.
- **Rationale**: Guarantees compile-time type safety across TypeScript code and matches PostgreSQL 18 enum types from `schema.sql`.
- **Alternatives Considered**: Plain `VARCHAR` with validation decorators was rejected because `schema.sql` defines explicit PostgreSQL `ENUM` types.

---

### Decision 5: Structured JSONB Fields (Address & Tax Metadata)
- **Decision**: Store `address` in `EmployeeProfileEntity` and `metadata` in `EmployeeTaxProfileEntity` as `@Column({ type: 'jsonb', nullable: true })` with strongly typed TypeScript interfaces (`Address` and `TaxMetadata`).
- **Rationale**: Matches `schema.sql` JSONB column definitions while preserving type safety in application layers.
- **Alternatives Considered**: Separate relational address tables were rejected because `schema.sql` standardizes on JSONB.

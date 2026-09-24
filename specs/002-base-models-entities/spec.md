# Feature Specification: Base Models and Entities for Directory Service

**Feature Branch**: `002-base-models-entities`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Read schema.sql and build base model and entity for it"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Employee Master & Personal Profile Management (Priority: P1)

As an HR Administrator, I need a centralized employee master record and detailed personal profile so that I can accurately register, track, and maintain employee identity and core employment lifecycle states across our organization with strict multi-tenant isolation.

**Why this priority**: The Employee master record and its associated personal profile form the foundational core of the directory service. All subsequent organizational assignments, onboarding workflows, contracts, documents, and financial profiles depend on this entity.

**Independent Test**: Can be independently verified by creating an employee record with mandatory tenant codes, employee codes, and associated personal profile details, verifying unique constraints, and transitioning employee lifecycle statuses (`INVITED`, `ONBOARDING`, `ACTIVE`, `INACTIVE`, `TERMINATED`).

**Acceptance Scenarios**:

1. **Given** a valid tenant code and unique employee code, **When** creating an employee master record with initial employment status `PENDING` and lifecycle status `INVITED`, **Then** the record is created with a unique identifier and default timestamps.
2. **Given** an existing employee master record, **When** associating an employee profile containing personal details (name, date of birth, contact email, address), **Then** the profile is linked 1-to-1 with cascade deletion upon employee removal.
3. **Given** an employee record with `joined_at` and `ended_at` dates, **When** `ended_at` precedes `joined_at`, **Then** the system rejects the operation with a validation constraint violation.
4. **Given** an existing employee in a tenant, **When** attempting to register another employee with the same `employee_code` within the same tenant, **Then** the system rejects the creation due to tenant-scoped uniqueness rules.

---

### User Story 2 - Effective-Dated Organizational Placement & Reporting Hierarchy (Priority: P2)

As an HR Operations Specialist or Organization Manager, I need to record and track time-bounded (effective-dated) job assignments, department placements, and reporting hierarchy for employees so that historical and current organizational structures are accurately maintained without cross-domain foreign key dependencies.

**Why this priority**: Organizations constantly evolve with role transitions, promotions, and managerial changes. Effective-dated organizational assignments allow both point-in-time auditing and future-dated organizational structuring.

**Independent Test**: Can be tested independently by creating employment assignment records with effective date ranges (`effective_from` to `effective_to`), assigning direct managers within the same tenant, and querying current vs historical assignments.

**Acceptance Scenarios**:

1. **Given** an active employee, **When** creating an organizational assignment with company, department, job title, and `effective_from` date, **Then** the assignment is stored and designated as active.
2. **Given** an assignment with both `effective_from` and `effective_to`, **When** `effective_to` is earlier than `effective_from`, **Then** the system rejects the assignment with a date consistency violation.
3. **Given** an employee assignment, **When** specifying a manager who is the employee themselves, **Then** the system rejects the assignment to prevent circular self-management.
4. **Given** an employee whose manager record is deleted or reassigned, **When** the manager reference changes, **Then** the employee assignment remains intact with the manager link cleared gracefully.

---

### User Story 3 - Employment Contracts & Document Compliance Management (Priority: P3)

As a Legal and Compliance Officer, I need to track legal employment contracts and employee verification documents (identities, visas, work permits, certifications) with validity dates and verification lifecycles so that statutory compliance is enforced.

**Why this priority**: Employment contracts and identity documents carry critical legal obligations and audit requirements. Maintaining explicit contract terms, status lifecycles, and verification workflows protects the business from non-compliance penalties.

**Independent Test**: Can be tested independently by creating employment contracts (with contract type, duration, and status) and employee documents (with document type, expiration tracking, and verification statuses: `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED`).

**Acceptance Scenarios**:

1. **Given** an employee record, **When** adding an employment contract with contract number, type (`PERMANENT`, `FIXED_TERM`, etc.), and valid start/end dates, **Then** the contract is recorded with unique contract number within the tenant.
2. **Given** an employee contract with `end_date`, **When** `end_date` is earlier than `start_date`, **Then** the system rejects the contract creation.
3. **Given** an employee document with `issued_at` and `expired_at`, **When** the document is created with valid chronological dates, **Then** it is tracked in `PENDING` verification status by default.
4. **Given** an employee document, **When** `expired_at` is earlier than `issued_at`, **Then** the system rejects the document record.

---

### User Story 4 - Onboarding Workflow & Checklist Lifecycle (Priority: P4)

As an Onboarding Coordinator and New Hire, I need a structured onboarding workflow with dynamic checklist requirements so that the new hire's onboarding progress can be tracked from initial invitation through completion or cancellation.

**Why this priority**: Onboarding coordinates multiple prerequisites (personal information submission, document collection, policy acknowledgements, bank details). A dedicated workflow entity ensures transparent visibility into onboarding milestones.

**Independent Test**: Can be tested independently by creating an onboarding workflow instance for an employee, attaching multiple dynamic checklist items with different requirement types, and updating item completion statuses.

**Acceptance Scenarios**:

1. **Given** an invited or onboarding employee, **When** an onboarding workflow is initiated, **Then** an onboarding record in `DRAFT` or `IN_PROGRESS` status is linked uniquely (1-to-1) to the employee for that tenant.
2. **Given** an active onboarding workflow, **When** adding dynamic checklist requirements (such as personal info, document uploads, or tax information), **Then** each requirement tracks its requirement type, mandatory flag, status, and completion timestamp.
3. **Given** an employee with an existing onboarding workflow, **When** attempting to create a duplicate active onboarding instance for the same employee, **Then** the system enforces 1-to-1 uniqueness per tenant.

---

### User Story 5 - Financial & Country-Specific Tax Profiles (Priority: P5)

As a Payroll Administrator, I need to store bank accounts and country-specific tax profiles with validity dates and primary account designations so that payroll and financial operations can be reliably processed per tenant.

**Why this priority**: Direct financial payouts and tax reporting require precise validation, audit trails, and strict uniqueness (e.g., exactly one primary bank account per employee and one active tax profile per country).

**Independent Test**: Can be tested independently by creating bank accounts and tax profiles for an employee, verifying primary bank account uniqueness, and verifying country-specific active tax profiles.

**Acceptance Scenarios**:

1. **Given** an employee record, **When** adding a bank account designated as `is_primary = true`, **Then** the bank account is stored successfully.
2. **Given** an employee already having a primary bank account, **When** adding another bank account with `is_primary = true`, **Then** the system enforces uniqueness so that only one primary account can be active simultaneously.
3. **Given** an employee with an active tax profile for country `VN`, **When** attempting to create a second tax profile with status `ACTIVE` for the same country `VN`, **Then** the system enforces country-level active uniqueness per tenant.
4. **Given** bank accounts or tax profiles with effective date ranges, **When** `effective_to` is earlier than `effective_from`, **Then** the system rejects the entry.

---

### Edge Cases

- **Cross-Tenant Collision**: What happens when two tenants register an employee with the exact same `employee_code`? The system permits both because uniqueness constraints are composite on `(tenant_code, employee_code)`.
- **Dangling External References**: What happens when an external Setting Service entity (such as `department_id`, `company_id`, or `location_id`) is modified or deleted? Since cross-service foreign keys are intentionally prohibited, the directory service stores UUID identifiers and handles resolution through inter-service APIs without DB-level cascading failures.
- **Cascade Deletion of Employee**: When an employee master record is deleted, all owned subordinate records (`employee_profiles`, `employment_assignments`, `employment_contracts`, `employee_documents`, `onboardings`, `employee_bank_accounts`, `employee_tax_profiles`) are cascadingly deleted within the tenant.
- **Manager Cycle Prevention**: When setting an assignment's manager to the employee themselves (`manager_employee_id == employee_id`), the system strictly blocks the operation via domain constraint.
- **Dynamic Onboarding Requirements Removal**: When an onboarding instance is deleted, all associated `onboarding_requirements` are cascadingly deleted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce multi-tenant isolation across all directory entities using `tenant_code` as an essential scope component.
- **FR-002**: System MUST represent the **Employee** master domain model with core attributes: `id` (UUID), `tenant_code`, `employee_code`, `employment_type` (Enum), `employment_status` (Enum), `joined_at`, `probation_end_at`, `ended_at`, `status` (Employee Status Enum), `created_at`, and `updated_at`.
- **FR-003**: System MUST enforce tenant-scoped uniqueness for `(tenant_code, employee_code)` and `(tenant_code, id)` on the Employee model.
- **FR-004**: System MUST represent the **Employee Profile** domain model with attributes: `employee_id`, `tenant_code`, `first_name`, `middle_name`, `last_name`, `preferred_name`, `date_of_birth`, `gender`, `avatar_url`, `personal_email`, `personal_phone`, `address` (structured data), and timestamps, linked 1-to-1 with Employee.
- **FR-005**: System MUST represent the **Employment Assignment** domain model with attributes: `id`, `tenant_code`, `employee_id`, `company_id`, `location_id`, `department_id`, `job_title_id`, `grade_id`, `manager_employee_id`, `effective_from`, `effective_to`, and timestamps.
- **FR-006**: System MUST enforce that an employee cannot be their own manager (`manager_employee_id != employee_id`) and that `effective_to >= effective_from`.
- **FR-007**: System MUST represent the **Employment Contract** domain model with attributes: `id`, `tenant_code`, `employee_id`, `contract_type` (Enum), `contract_number`, `start_date`, `end_date`, `status` (Enum), `document_id`, `signed_at`, `terminated_at`, and timestamps, enforcing unique contract numbers per tenant.
- **FR-008**: System MUST represent the **Employee Document** domain model with attributes: `id`, `tenant_code`, `employee_id`, `document_type` (Enum), `document_number`, `file_id`, `status` (Enum), `issued_at`, `expired_at`, and timestamps, with validation ensuring `expired_at >= issued_at`.
- **FR-009**: System MUST represent the **Onboarding** workflow domain model with attributes: `id`, `tenant_code`, `employee_id`, `status` (Enum: `DRAFT`, `IN_PROGRESS`, `SUBMITTED`, `REVIEWING`, `COMPLETED`, `CANCELLED`), `started_at`, `submitted_at`, `completed_at`, and timestamps, enforcing 1-to-1 uniqueness per employee in a tenant.
- **FR-010**: System MUST represent the **Onboarding Requirement** domain model with attributes: `id`, `tenant_code`, `onboarding_id`, `requirement_type` (Enum), `title`, `required` (boolean), `status` (Enum: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `WAIVED`), `document_id`, `completed_at`, and timestamps.
- **FR-011**: System MUST represent the **Employee Bank Account** domain model with attributes: `id`, `tenant_code`, `employee_id`, `bank_name`, `bank_code`, `account_number`, `account_holder_name`, `currency_code`, `status` (Enum), `is_primary` (boolean), `effective_from`, `effective_to`, and timestamps, enforcing that only one primary bank account may exist per employee per tenant.
- **FR-012**: System MUST represent the **Employee Tax Profile** domain model with attributes: `id`, `tenant_code`, `employee_id`, `country_code` (2-letter ISO), `tax_number`, `status` (Enum), `effective_from`, `effective_to`, `metadata` (structured data), and timestamps, enforcing unique active tax profile per country per employee.
- **FR-013**: System MUST support all standard enumeration definitions:
  - `employee_status`: `INVITED`, `ONBOARDING`, `ACTIVE`, `INACTIVE`, `TERMINATED`
  - `employment_type`: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `TEMPORARY`, `INTERN`
  - `employment_status`: `PENDING`, `PROBATION`, `ACTIVE`, `ON_LEAVE`, `SUSPENDED`, `ENDED`
  - `onboarding_status`: `DRAFT`, `IN_PROGRESS`, `SUBMITTED`, `REVIEWING`, `COMPLETED`, `CANCELLED`
  - `onboarding_requirement_status`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `WAIVED`
  - `onboarding_requirement_type`: `PERSONAL_INFORMATION`, `DOCUMENT`, `BANK_ACCOUNT`, `TAX_INFORMATION`, `CONTRACT`, `POLICY_ACKNOWLEDGEMENT`, `OTHER`
  - `employee_document_type`: `IDENTITY`, `PASSPORT`, `WORK_PERMIT`, `VISA`, `EDUCATION`, `CERTIFICATION`, `MEDICAL`, `OTHER`
  - `employee_document_status`: `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED`
  - `employment_contract_type`: `PERMANENT`, `FIXED_TERM`, `PART_TIME`, `CONTRACTOR`, `INTERNSHIP`, `OTHER`
  - `employment_contract_status`: `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `CANCELLED`
  - `bank_account_status`: `PENDING`, `ACTIVE`, `INACTIVE`
  - `tax_profile_status`: `PENDING`, `ACTIVE`, `INACTIVE`
- **FR-014**: System MUST maintain loose coupling with external domains by storing external identifiers (`company_id`, `location_id`, `department_id`, `job_title_id`, `grade_id`, `file_id`, `document_id`) without physical foreign key constraints.

### Key Entities *(include if feature involves data)*

- **Employee**: Master root record representing an individual worker in the tenant, maintaining core lifecycle and employment statuses.
- **EmployeeProfile**: Personal demographic and contact details (name, date of birth, contact email/phone, address) associated 1-to-1 with Employee.
- **EmploymentAssignment**: Point-in-time organizational placement (department, company, location, grade, job title, and direct manager) with effective dating (`effective_from`, `effective_to`).
- **EmploymentContract**: Formal legal contract document record with contract classification, term duration, signing/termination dates, and status.
- **EmployeeDocument**: Personal or statutory document verification record (ID cards, passports, visas, certifications) with validity period and verification status.
- **Onboarding**: Lifecycle state container for an employee's onboarding process.
- **OnboardingRequirement**: Specific dynamic milestone or requirement checklist item within an onboarding workflow.
- **EmployeeBankAccount**: Financial disbursement account details with currency, primary flag, and validity dates.
- **EmployeeTaxProfile**: Jurisdiction/country-specific tax registration information with effective dating and flexible metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 9 database tables and 12 enumerations defined in `schema.sql` are completely mapped into structured domain models and entities with matching field types, defaults, and constraints.
- **SC-002**: 100% of data integrity constraints (composite uniqueness, date range checks, self-manager exclusion, and single primary account constraints) are explicitly defined and validated.
- **SC-003**: Domain entities and models support full CRUD operations across all 9 domain entities without schema drift or missing relationship definitions.
- **SC-004**: Multi-tenant data segregation is enforced across all 9 domain models, guaranteeing zero accidental cross-tenant data access.

## Assumptions

- Database schema is based on PostgreSQL 18 with UUID keys generated via standard cryptographically secure UUID algorithms.
- Setting service references (`company_id`, `location_id`, `department_id`, `job_title_id`, `grade_id`) and file storage references (`file_id`, `document_id`) are validated asynchronously or at application/API boundary without foreign key constraints in the database.
- Address in `employee_profiles` and metadata in `employee_tax_profiles` are stored as structured JSON documents allowing flexible regional customization.
- System operates in a multi-tenant environment where `tenant_code` identifies the organizational boundary.

# Feature Specification: Import Job Configuration Management

**Feature Branch**: `005-import-job-config`  
**Created**: 2026-10-04  
**Status**: Draft  
**Input**: User description: "Implement a configurable policy system for employee CSV import jobs. The system must support creating, retrieving, updating, and versioning reusable import profiles, as well as snapshotting the effective configuration when an import job is created. Focus only on configuration management. Do not implement CSV parsing or the import worker execution flow in this task."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Reusable Import Profiles with Versioning (Priority: P1)

As an HR Administrator or Tenant Operator, I want to create, retrieve, update, activate, and deactivate reusable import profiles defining execution, error-handling, retry, and timeout policies for bulk employee imports, so that my organization can standardize and reuse import configurations across departments and teams.

**Why this priority**:
Import profiles are the foundational configuration entity. Without profile creation, retrieval, validation, and lifecycle management, neither tenants nor automated jobs can configure import behavior.

**Independent Test**:
Can be fully tested by creating an import profile with valid policy parameters via the profile management API, retrieving it by identifier, modifying its policies with an expected version to trigger version increment, activating/deactivating the profile, and verifying that concurrent updates with outdated version tokens are rejected with a version conflict error.

**Acceptance Scenarios**:

1. **Given** an authenticated tenant administrator and a valid import profile payload containing error, retry, timeout, and execution policies, **When** submitting a profile creation request, **Then** the profile is persisted as active (`is_active = true`), initialized at `version = 1`, tagged with the authenticated user ID and tenant code, and returned with a unique profile identifier.
2. **Given** an existing active import profile at version `N`, **When** the tenant administrator submits an update request with valid policy modifications and provides matching expected version `N`, **Then** the profile configuration is updated, the version increments to `N + 1`, and the updated profile representation is returned.
3. **Given** an existing import profile at version `N`, **When** two concurrent update requests are submitted with expected version `N`, **Then** exactly one update succeeds (incrementing to `N + 1`), and the second update is rejected with an optimistic concurrency conflict error indicating stale state.
4. **Given** an active import profile, **When** the tenant administrator deactivates it via the deactivation action, **Then** the profile status is updated to inactive (`is_active = false`) and subsequent job creations referencing this profile without explicit reactivation are rejected.

---

### User Story 2 - Effective Configuration Resolution & Safety Guardrails (Priority: P1)

As an Import Processing Subsystem or Job Dispatcher, I want to resolve an effective import configuration by applying a deterministic 3-tier precedence hierarchy (System Baseline Defaults → Tenant Profile / Tenant Configuration → Job-Level Overrides) while strictly enforcing non-overridable system safety quotas and schema constraints, so that jobs run with validated configurations that protect system stability.

**Why this priority**:
Resolving configurations accurately and safely is essential for execution predictability. Tenant customizations must never allow unconstrained or dangerous parameters (such as infinite retries or unbounded batch sizes) that could exhaust system resources.

**Independent Test**:
Can be tested independently by supplying system defaults, tenant-level profiles, and job-level override payloads to the configuration resolution component, verifying that nested policies are deeply merged in order of precedence, and verifying that attempts to exceed system-enforced resource quotas (e.g., maximum batch size, timeout bounds) trigger immediate validation failures.

**Acceptance Scenarios**:

1. **Given** no tenant profile and no job overrides, **When** resolving the effective configuration, **Then** the resolver produces a complete, valid configuration identical to the system baseline defaults.
2. **Given** a tenant profile overriding `executionPolicy.batchSize` and a job-level override adjusting `errorPolicy.maxErrorRows`, **When** resolving the configuration, **Then** the resulting configuration contains the system baseline for untouched policies, the tenant profile value for `executionPolicy.batchSize`, and the job-level override for `errorPolicy.maxErrorRows`.
3. **Given** an override attempt where `executionPolicy.batchSize` or `timeoutPolicy.jobTimeoutSeconds` exceeds the system-enforced ceiling, **When** resolving the configuration, **Then** the resolution fails with a validation error indicating that the parameter exceeds system-enforced safety quotas.
4. **Given** an override specifying unknown or unrecognized configuration properties, **Then** the resolver strictly rejects the configuration to prevent silent configuration drift or typos.

---

### User Story 3 - Immutable Configuration Snapshotting on Job Initiation (Priority: P2)

As a System Auditor and Import Job Orchestrator, I want the effective configuration resolved at job creation time to be permanently frozen as an immutable configuration snapshot attached to the import job record, so that historical import runs can be inspected, audited, or reproduced regardless of future profile modifications or profile deletions.

**Why this priority**:
Ensures audit integrity and deterministic execution. If an import profile is modified or deactivated while a job is running or after it has completed, the job's execution policies and audit trail must remain completely unaffected.

**Independent Test**:
Can be tested by initiating an import job referencing Profile A at version 1, verifying that `config_snapshot`, `profile_id`, and `profile_version` are saved in the job record, then updating Profile A to version 2 (or deactivating Profile A), and asserting that the job's persisted `config_snapshot` and `profile_version` remain unchanged.

**Acceptance Scenarios**:

1. **Given** an import job initiation request referencing a valid profile, **When** the job record is persisted, **Then** the fully resolved effective configuration is stored in `config_snapshot`, accompanied by the referenced `profile_id` and the exact `profile_version` at that moment.
2. **Given** an import job initiation request with ad-hoc overrides but no reusable profile, **When** the job record is persisted, **Then** `profile_id` and `profile_version` are null, and `config_snapshot` contains the resolved configuration based on system defaults and validated overrides.
3. **Given** an existing import job with an immutable configuration snapshot, **When** the referenced profile is subsequently modified, deactivated, or deleted, **Then** the job's `config_snapshot` remains completely unchanged.

---

### User Story 4 - Multi-Tenant Isolation & System Profile Governance (Priority: P3)

As a Security and Compliance Officer, I want import profiles to enforce strict tenant isolation such that tenant administrators cannot view, modify, or deactivate profiles belonging to other tenants, and system-level profiles remain immutable and protected from tenant modification.

**Why this priority**:
Protects cross-tenant data boundaries and prevents tenant users from tampering with global baseline configurations.

**Independent Test**:
Can be tested by attempting to retrieve, update, or deactivate a profile belonging to Tenant B while authenticated under Tenant A, and by attempting to modify or deactivate a system-level profile using tenant administrator credentials, asserting deterministic 403 Forbidden or 404 Not Found responses.

**Acceptance Scenarios**:

1. **Given** an authenticated user for Tenant A, **When** listing profiles, **Then** the system returns only profiles belonging to Tenant A alongside globally available system-level profiles.
2. **Given** an authenticated user for Tenant A, **When** attempting to view or update a profile belonging to Tenant B, **Then** the system returns an access denial error (404 Not Found or 403 Forbidden).
3. **Given** a system-level profile (where `tenant_code` is null), **When** a tenant administrator attempts to update, activate, or deactivate it, **Then** the system rejects the operation with a forbidden permission error.

---

### Edge Cases

- **Concurrent Stale Updates**: What happens when a user attempts to update a profile while another administrator has just incremented its version?  
  *Handling*: The update operation checks the provided version against the stored version; if mismatched, it rejects the update with HTTP `409 Conflict` (`STALE_PROFILE_VERSION`).
- **Metadata-Only Updates**: What happens when only the profile name or description is updated without changing policy values?  
  *Handling*: For uniform optimistic concurrency control, any update to the profile record (metadata or configuration) increments the record's `version`.
- **System Quota Violation in Overrides**: What happens if a job override attempts to specify an excessive retry count or batch size?  
  *Handling*: Configuration resolver runs boundary validation against system safety caps; any violation throws a validation error (`CONFIG_QUOTA_EXCEEDED`) detailing the offending field and allowed range.
- **Deactivated Profile Reference**: What happens when an import job attempts to use a deactivated profile?  
  *Handling*: Job initiation rejects the request with an error indicating the selected profile is inactive (`PROFILE_INACTIVE`).
- **Profile Deletion While Referenced**: What happens to historical jobs if a profile is soft-deleted or removed?  
  *Handling*: Job records retain the immutable `config_snapshot`, `profile_id`, and `profile_version` independently. Foreign key constraint uses `ON DELETE SET NULL` or retains reference to ensure historical job data is never lost or corrupted.
- **Cross-Field Policy Inconsistencies**: What happens if an error policy specifies `mode = STOP_ON_ERROR_THRESHOLD` but omits `maxErrorRate` or sets it to 0?  
  *Handling*: Runtime schema validation enforces cross-field rules, rejecting the invalid combination with a structured validation error before persisting or resolving.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Import Profile Lifecycle & Management
- **FR-001**: System MUST provide an import profile management capability allowing authorized users to create, list, retrieve, update, activate, and deactivate import profiles.
- **FR-002**: System MUST store each import profile with attributes: `id` (UUID), `tenant_code` (nullable string for system profiles), `name` (string), `description` (optional string), `config` (structured JSON document), `version` (integer), `is_active` (boolean, default true), `created_by` (user identifier), `created_at` (timestamp), and `updated_at` (timestamp).
- **FR-003**: System MUST enforce unique profile names per tenant (and unique names among system-level profiles).
- **FR-004**: System MUST allow tenant administrators to view system-level profiles in addition to their own tenant profiles, but MUST strictly prevent tenant administrators from creating, editing, or deactivating system-level profiles.
- **FR-005**: System MUST strictly isolate tenant profiles such that no tenant can inspect, update, or reference profiles belonging to another tenant.
- **FR-006**: System MUST enforce optimistic concurrency control on profile updates: every update MUST verify the target profile's current version, increment `version` by 1 upon success, and reject stale versions with a conflict error.
- **FR-007**: System MUST provide dedicated activation and deactivation actions that update `is_active` while preserving version integrity.

#### Configuration Schema & Validation
- **FR-008**: System MUST define and validate a strongly typed configuration schema comprising:
  - `errorPolicy`: `mode` (enum: `CONTINUE_ON_ROW_ERROR`, `STOP_ON_ROW_ERROR`, `STOP_ON_ERROR_THRESHOLD`, `ALL_OR_NOTHING`), `maxErrorRows` (integer, >= 0), `maxErrorRate` (float between 0.0 and 1.0).
  - `retryPolicy`: `maxAttempts` (integer, >= 1), `initialDelayMs` (integer, >= 0), `maxDelayMs` (integer, >= initialDelayMs), `backoffMultiplier` (number, >= 1.0).
  - `timeoutPolicy`: `jobTimeoutSeconds` (integer, >= 1), `batchTimeoutSeconds` (integer, >= 1), `idleTimeoutSeconds` (integer, >= 1).
  - `executionPolicy`: `batchSize` (integer, >= 1), `maxConcurrentBatches` (integer, >= 1).
- **FR-009**: System MUST validate cross-field constraints (e.g., when `mode` is `STOP_ON_ERROR_THRESHOLD`, `maxErrorRows` or `maxErrorRate` must be positively bounded; `maxDelayMs` must be greater than or equal to `initialDelayMs`).
- **FR-010**: System MUST strictly reject unknown properties in profile configuration payloads to prevent silent typos or configuration errors.
- **FR-011**: System MUST decouple configuration validation from the transport layer so that configuration validation can be executed uniformly by HTTP controllers, background resolvers, and internal service modules.

#### Effective Configuration Resolution
- **FR-012**: System MUST resolve effective import configuration using a deterministic 3-tier precedence order:
  1. System default baseline configuration.
  2. Tenant-level configuration or selected tenant profile.
  3. Job-level explicit overrides.
- **FR-013**: System MUST perform deep/nested merging when applying overrides, ensuring that non-overridden sibling attributes within policy blocks retain their higher-precedence defaults.
- **FR-014**: System MUST enforce immutable system safety limits (e.g., maximum allowed `batchSize`, maximum `maxAttempts`, maximum `jobTimeoutSeconds`, minimum `initialDelayMs`), rejecting any tenant or job-level override that attempts to exceed these safety limits.
- **FR-015**: System MUST ensure that the output of configuration resolution is a fully populated, complete, and validated configuration instance.

#### Immutable Configuration Snapshotting
- **FR-016**: System MUST persist an immutable configuration snapshot in the import job record (`config_snapshot`) upon job creation.
- **FR-017**: System MUST record the source `profile_id` and the exact `profile_version` in the job record when a reusable profile is selected.
- **FR-018**: System MUST allow `profile_id` and `profile_version` to be null when a job is configured entirely via system defaults and validated ad-hoc overrides without referencing a reusable profile.
- **FR-019**: System MUST guarantee that once written, the job's `config_snapshot` remains completely immutable and is not modified by subsequent updates, version increments, or deactivations of the source profile.
- **FR-020**: System MUST ensure that if the import job persistence table already exists, schema adjustments (adding `config_snapshot`, `profile_id`, `profile_version`) are performed non-destructively via database migration.

#### Security, Tenant & Multi-Company Context
- **FR-021**: System MUST derive the tenant identity and actor identity exclusively from the authenticated context and ignore any tenant identifier submitted in the request body.
- **FR-022**: System MUST require explicit permissions for profile creation, profile modification, profile activation/deactivation, and profile retrieval.
- **FR-023**: System MUST NOT expose sensitive internal configurations, database identifiers unnecessarily, or unhandled internal error traces in API responses.
- **FR-024**: System MUST support multi-company scoping by allowing `company_id` (nullable UUID) on `employee_import_profiles` and `employee_import_jobs`.
  - When `company_id` is null on a tenant profile, the profile is tenant-wide (applicable across all companies in the tenant).
  - When `company_id` is provided on a tenant profile or import job, the system MUST validate that the company exists, is active (`status === 'ACTIVE'`), and belongs to the authenticated tenant using the local `CompanyProjectionRepository`.
  - System-level profiles (`tenant_code IS NULL`) MUST always have `company_id = NULL`.
  - When an import job references a company-scoped profile, the job's `company_id` MUST match the profile's `company_id`.

---

### Key Entities *(include if feature involves data)*

- **EmployeeImportProfile**:
  - `id`: Unique identifier (UUID).
  - `tenantCode`: Nullable string representing the owning tenant (`null` for system-level default profiles).
  - `companyId`: Nullable UUID representing the scoped company (`null` for tenant-wide or system profiles).
  - `name`: Human-readable unique profile name within the tenant/company scope.
  - `description`: Optional text describing the intended use case.
  - `config`: Structured JSON document containing `errorPolicy`, `retryPolicy`, `timeoutPolicy`, and `executionPolicy`.
  - `version`: Integer tracking configuration changes and supporting optimistic concurrency control.
  - `isActive`: Boolean indicating whether the profile can be selected for new import jobs.
  - `createdBy`: User identifier who created the profile.
  - `createdAt`: Timestamp of profile creation.
  - `updatedAt`: Timestamp of last modification.
  - *Constraints*:
    - Unique partial index on `(name)` WHERE `tenant_code IS NULL AND deleted_at IS NULL`.
    - Unique partial index on `(tenant_code, name)` WHERE `tenant_code IS NOT NULL AND company_id IS NULL AND deleted_at IS NULL`.
    - Unique partial index on `(tenant_code, company_id, name)` WHERE `tenant_code IS NOT NULL AND company_id IS NOT NULL AND deleted_at IS NULL`.

- **EmployeeImportJob (Snapshot Extension)**:
  - `id`: Unique job identifier.
  - `tenantCode`: String representing the owning tenant.
  - `companyId`: Nullable UUID representing the target company for bulk import.
  - `profileId`: Nullable UUID reference to the source `EmployeeImportProfile`.
  - `profileVersion`: Nullable integer recording the exact version of the profile at job creation time.
  - `configSnapshot`: Immutable JSON document containing the fully resolved effective configuration for the job.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of created and updated import configurations conform to the strongly typed schema, with invalid payloads rejected before persistence.
- **SC-002**: 100% of concurrent profile updates with outdated version tokens are rejected with a deterministic conflict status, preventing lost updates.
- **SC-003**: 100% of initiated import jobs capture a complete, immutable snapshot of effective configuration that remains unaffected by subsequent source profile updates.
- **SC-004**: 0% of cross-tenant profile access attempts succeed, maintaining complete multi-tenant isolation.
- **SC-005**: 100% of tenant attempts to override system-enforced resource quotas (such as batch size or timeout ceilings) are blocked with structured validation errors.
- **SC-006**: Profile retrieval and configuration resolution requests complete with minimal latency (under 50ms under normal load).

---

## Assumptions

- **Tenant Authentication**: The system operates with an existing authentication and tenant context mechanism that injects `tenantCode` and `actorId` (`userId`) into the execution context for every request.
- **Job Execution Separation**: Execution of import jobs (CSV file parsing, row validation, Kafka events, worker threads) is outside the scope of this feature and will consume the persisted `config_snapshot`.
- **System-Level Profiles**: System profiles have `tenant_code = null` and are seeded or managed exclusively by system administrators or initial migration seed scripts. Tenant administrators have read-only access to system profiles.
- **Version Increment Semantics**: Any change to a profile record (whether policy configuration or metadata like name and description) increments the `version` field by 1 to ensure standard, robust optimistic concurrency control across all profile fields.
- **Safety Quota Ceilings**: System baseline defaults define hard limits: maximum `batchSize = 1000`, maximum `maxAttempts = 10`, maximum `jobTimeoutSeconds = 86400` (24 hours), and maximum `maxConcurrentBatches = 10`. Overrides attempting to exceed these ceilings are rejected.
- **Soft Deletion**: Import profiles may be deactivated via `isActive = false` rather than physically deleted from the database to preserve historical foreign key integrity.

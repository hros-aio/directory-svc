# Feature Specification: Directory Service Provisioning Module

**Feature Branch**: `003-directory-provisioning`

**Created**: 2026-09-26

**Status**: Implemented

**Input**: User description: "Task: Design and Implement Directory Service Provisioning Module for HROS platform consuming Setting Service master data events (Company, Location, Department, Grade, Job Title)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Data Projection Sync (Priority: P1)

As the HROS Directory Service, I need to reliably consume organizational master-data events published by Setting Service (`setting.company.*`, `setting.location.*`, `setting.department.*`, `setting.grade.*`, `setting.job_title.*`) and synchronize Directory's local organizational projections so that Directory modules (Employee, Employment, Assignment) can validate and associate employees with accurate, up-to-date organizational metadata without querying Setting Service directly.

**Why this priority**: Directory Service must maintain localized read projections of master data domains to function autonomously without cross-service database access or synchronous HTTP dependencies during employee lifecycle operations.

**Independent Test**: Can be fully tested by dispatching `setting.*.created`, `setting.*.updated`, and `setting.*.activated` / `setting.*.deactivated` events via NestJS microservice handlers and verifying that the corresponding projection records in Directory database are created, updated, or status-updated according to event payload attributes.

**Acceptance Scenarios**:

1. **Given** a new company/department/location/grade/job title is created in Setting Service, **When** a `setting.<entity>.created` event arrives in Directory Service, **Then** Directory creates or upserts a matching local projection record within the event's tenant context (`tenantCode`).
2. **Given** an existing master entity is updated in Setting Service (e.g. Department name change from "HR" to "People Operations"), **When** a `setting.<entity>.updated` event arrives, **Then** Directory updates the local projection record attributes while maintaining strict tenant isolation.
3. **Given** a master entity is deactivated (or activated) in Setting Service, **When** a `setting.<entity>.deactivated` or `setting.company.activated` event arrives, **Then** Directory updates the local projection status accordingly (`MasterDataStatus.INACTIVE` / `CompanyStatus.ACTIVE`) and updates entity version.

---

### User Story 2 - Idempotent Event Processing & Tenant Context Execution (Priority: P2)

As a robust messaging consumer, the Directory Provisioning Module must handle event execution safely within an isolated `RequestContext`, maintaining tenant separation and idempotency across operations.

**Why this priority**: Network retries, rebalances, or consumer restarts can deliver identical events multiple times. Proper context propagation (`RequestContextService`) ensures multi-tenant data boundaries are preserved.

**Independent Test**: Dispatch events with tenant metadata and assert that each execution is bounded by `RequestContext` with matching `tenantCode`, `requestId`, and `traceId`, and duplicate or out-of-order deliveries do not corrupt projection state.

**Acceptance Scenarios**:

1. **Given** an incoming event envelope `EventEnvelope<T>`, **When** handled by a provisioning handler, **Then** execution is wrapped in `RequestContextService.run({ tenantCode, traceId, requestId, ... })` ensuring all repository interactions are automatically scoped by tenant.
2. **Given** a payload missing required identifiers or `tenantCode`, **When** the handler receives the envelope, **Then** a warning is logged and execution safely terminates without corrupting the database.

---

### User Story 3 - Out-of-Order and Version Conflict Handling (Priority: P3)

As a data consistency coordinator, Directory Provisioning must handle out-of-order event arrivals and prevent stale events from overwriting newer master data states.

**Why this priority**: Due to network latency, partition distribution, or redeliveries, an older update event could arrive after a newer update has already been applied.

**Independent Test**: Emit a state update with version $V_2$, followed by a delayed state update with version $V_1$ ($V_1 \le V_2$), and verify that the older payload is ignored and does not overwrite the newer state in Directory.

**Acceptance Scenarios**:

1. **Given** Directory holds projection state at version $V_2$, **When** a delayed event arrives with version $V_1 \le V_2$, **Then** the handler logs a stale event warning and skips mutating the projection record.
2. **Given** events arriving in sequential order ($V_1 \rightarrow V_2 \rightarrow V_3$), **When** processed sequentially, **Then** each updates the local projection version and data state accordingly.

---

### User Story 4 - Resilient Error Handling, Retries & Dead Letter Queue (DLQ) (Priority: P4)

As an operations engineer, I need transient failures (e.g. brief database disconnects) to be retried automatically with backoff, and non-recoverable failures (e.g. malformed payloads, corrupt data) to be routed to a Dead Letter Queue (DLQ) with contextual error metadata for manual inspection and replay.

**Why this priority**: Prevents poison pills from blocking the consumer partition while guaranteeing that transient network blips do not cause data loss.

**Independent Test**: Simulate database connectivity drop during event consumption to verify retry behavior; simulate unrecoverable schema validation failure to verify immediate logging and DLQ routing.

**Acceptance Scenarios**:

1. **Given** a transient database connection timeout during event handling, **When** the consumer encounters the error, **Then** it retries up to the maximum configured retry threshold before succeeding or exhausting retries.
2. **Given** a corrupted or non-retryable event payload (or exhausted retries), **When** processing fails, **Then** the event is logged with diagnostic details and routed to DLQ, keeping the event stream unblocked.

---

### Edge Cases

- What happens when a child entity event (e.g., `setting.department.created` referencing `companyId`) arrives before the parent company projection exists in Directory?
  - The handler persists the projection entity with parent ID; foreign keys are managed at the domain level rather than blocking event ingestion.
- How does the system handle cross-tenant leakage in event payloads?
  - Every handler extracts `tenantCode` from the payload and wraps execution inside `RequestContextService.run()`. `BaseRepository<T>` automatically applies tenant filtering on all operations.
- How does the system handle unknown or unsupported event types within the `setting.*` namespace?
  - Unsupported events within the Setting namespace are logged and safely acknowledged without throwing unhandled exceptions that crash the microservice controller.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Directory Service MUST consume organizational master data events published by Setting Service using NestJS microservice controllers and `@EventPattern` decorators.
- **FR-002**: Directory Service MUST strictly operate as a consumer/projection store for Company, Location, Department, Grade, and Job Title domains, and MUST NOT provide source-of-truth CRUD APIs or modify Setting Service database directly.
- **FR-003**: System MUST support the full lifecycle events defined in `SettingEventType`:
  - `setting.company.created`, `setting.company.updated`, `setting.company.activated`
  - `setting.location.created`, `setting.location.updated`, `setting.location.deactivated`
  - `setting.department.created`, `setting.department.updated`, `setting.department.deactivated`
  - `setting.grade.created`, `setting.grade.updated`, `setting.grade.deactivated`
  - `setting.job_title.created`, `setting.job_title.updated`, `setting.job_title.deactivated`
- **FR-004**: System MUST validate all incoming events against `EventEnvelope<T>` containing `id`, `correlationId`, and typed `payload` extending entities from `@new-hros/libs-sql`.
- **FR-005**: Provisioning Service MUST route events to dedicated modular microservice handlers:
  - `CompanyProvisioningHandler`
  - `LocationProvisioningHandler`
  - `DepartmentProvisioningHandler`
  - `GradeProvisioningHandler`
  - `JobTitleProvisioningHandler`
- **FR-006**: System MUST ensure isolation and context propagation by executing each event within `RequestContextService.run({ traceId, requestId, tenantCode, ... })`.
- **FR-007**: System MUST guarantee strict tenant isolation by leveraging `BaseRepository<T>` and `tenantCode` scoping across all projection repositories:
  - `CompanyProjectionRepository`
  - `DepartmentProjectionRepository`
  - `LocationProjectionRepository`
  - `GradeProjectionRepository`
  - `JobTitleProjectionRepository`
- **FR-008**: System MUST prevent stale event overwrites using entity version comparison (`existing.version >= payload.version`) against the existing local projection record.
- **FR-009**: System MUST support projection upserts (`upsertProjection`) and status modifications (`updateStatus`) with optimistic version synchronization.
- **FR-010**: System MUST export all projection repositories from `ProvisioningModule` and import `ProvisioningModule` into the root `AppModule` so that other modules (Employee, Employment) can consume local projection data.

---

### Key Entities *(include if feature involves data)*

- **Company Projection (`Company` / `company_projections` / `companies`)**:
  - `id`: Unique identifier (UUID) matching Setting Service ID.
  - `tenantCode`: Tenant code for isolation.
  - `code`: Company code.
  - `name`: Company display name.
  - `status`: Company status (`CompanyStatus.ACTIVE`, `CompanyStatus.INACTIVE`, etc.).
  - `version`: Version number for optimistic concurrency and stale check.
- **Department Projection (`Department` / `department_projections` / `departments`)**:
  - `id`: Unique identifier (UUID) matching Setting Service ID.
  - `tenantCode`: Tenant code.
  - `companyId`: Parent company reference.
  - `code`: Department code.
  - `name`: Department name.
  - `status`: Master data status (`MasterDataStatus.ACTIVE`, `MasterDataStatus.INACTIVE`).
  - `version`: Version number for ordering.
- **Location Projection (`Location` / `location_projections` / `locations`)**:
  - `id`: Location identifier matching Setting Service ID.
  - `tenantCode`: Tenant code.
  - `companyId`: Parent company reference.
  - `name`: Location name / address.
  - `status`: Master data status (`MasterDataStatus.ACTIVE`, `MasterDataStatus.INACTIVE`).
  - `version`: Version number for ordering.
- **Grade Projection (`Grade` / `grade_projections` / `grades`)**:
  - `id`: Grade identifier matching Setting Service ID.
  - `tenantCode`: Tenant code.
  - `code`: Grade code / level.
  - `name`: Grade name.
  - `level`: Hierarchical rank / level.
  - `status`: Master data status (`MasterDataStatus.ACTIVE`, `MasterDataStatus.INACTIVE`).
  - `version`: Version number for ordering.
- **JobTitle Projection (`JobTitle` / `job_title_projections` / `job_titles`)**:
  - `id`: Job Title identifier matching Setting Service ID.
  - `tenantCode`: Tenant code.
  - `code`: Job title code.
  - `name`: Job title name.
  - `status`: Master data status (`MasterDataStatus.ACTIVE`, `MasterDataStatus.INACTIVE`).
  - `version`: Version number for ordering.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid master data events dispatched by Setting Service are accurately reflected in Directory Service projections within 2 seconds under standard load.
- **SC-002**: 100% of duplicate or stale event deliveries (`version <= currentVersion`) are safely ignored with zero corrupted projection mutations.
- **SC-003**: 0% cross-tenant data corruption or leakage during simultaneous multi-tenant event consumption via `RequestContextService` and `BaseRepository`.
- **SC-004**: 100% test coverage across all provisioning handlers (`Company`, `Department`, `Location`, `Grade`, `JobTitle`) with automated unit test suites.

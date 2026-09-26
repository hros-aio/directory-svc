# Feature Specification: Directory Service Provisioning Module

**Feature Branch**: `003-directory-provisioning`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Task: Design and Implement Directory Service Provisioning Module for HROS platform consuming Setting Service master data events (Company, Location, Department, Grade, Job Title)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Data Projection Sync (Priority: P1)

As the HROS Directory Service, I need to reliably consume organizational master-data events published by Setting Service (`setting.company.*`, `setting.location.*`, `setting.department.*`, `setting.grade.*`, `setting.job_title.*`) and synchronize Directory's local organizational projections so that Directory modules (Employee, Employment, Assignment) can validate and associate employees with accurate, up-to-date organizational metadata without querying Setting Service directly.

**Why this priority**: Directory Service must maintain localized read projections of master data domains to function autonomously without cross-service database access or synchronous HTTP dependencies during employee lifecycle operations.

**Independent Test**: Can be fully tested by dispatching `setting.*.created`, `setting.*.updated`, and `setting.*.deactivated` events to Kafka and verifying that the corresponding records in Directory database tables are created, updated, or marked inactive according to event payload attributes.

**Acceptance Scenarios**:

1. **Given** a new company/department/location/grade/job title is created in Setting Service, **When** a `setting.<entity>.created` event arrives in Directory Service, **Then** Directory creates a matching local projection record within the event's tenant boundary.
2. **Given** an existing master entity is updated in Setting Service (e.g. Department name change from "HR" to "People Operations"), **When** a `setting.<entity>.updated` event arrives, **Then** Directory updates the local projection record attributes while maintaining tenant isolation.
3. **Given** a master entity is deactivated in Setting Service, **When** a `setting.<entity>.deactivated` event arrives, **Then** Directory updates the local projection status to inactive (`INACTIVE` / deactivated state) and ensures dependent references handle the deactivation gracefully.

---

### User Story 2 - Idempotent Event Processing & Deduplication (Priority: P2)

As a robust messaging consumer, the Directory Provisioning Module must handle duplicate event deliveries gracefully without corrupting local data or triggering duplicate downstream side-effects.

**Why this priority**: Kafka guarantees at-least-once delivery; network retries, rebalances, or consumer restarts can deliver identical events multiple times. Business-level idempotency ensures data consistency.

**Independent Test**: Dispatch the exact same `setting.<entity>.*` event multiple times (same `eventId`, `tenantId`, `aggregateId`) and assert that the operation is executed exactly once, recorded in the processed events ledger, and duplicate attempts are skipped without error.

**Acceptance Scenarios**:

1. **Given** an event with `eventId: "uuid-1"` has already been successfully processed and recorded in `processed_events`, **When** the identical event is received again, **Then** the provisioning handler detects the existing record, acknowledges the message, and skips re-execution.
2. **Given** multiple concurrent workers receiving identical messages for the same aggregate, **When** both attempt to process the event, **Then** the database unique constraint on `event_id` ensures only one transaction commits successfully and the other is safely handled as a duplicate.

---

### User Story 3 - Out-of-Order and Version Conflict Handling (Priority: P3)

As a data consistency coordinator, Directory Provisioning must handle out-of-order event arrivals and prevent stale events from overwriting newer master data states.

**Why this priority**: Due to network latency, partition distribution, or redeliveries, an older update event could arrive after a newer update has already been applied.

**Independent Test**: Emit a state update with version/timestamp $T_2$, followed by a delayed state update with version/timestamp $T_1$ ($T_1 < T_2$), and verify that the older payload does not overwrite the newer state in Directory.

**Acceptance Scenarios**:

1. **Given** Directory holds projection state at version $V_{11}$ (or timestamp $T_2$), **When** a delayed event arrives with version $V_{10}$ (or timestamp $T_1 < T_2$), **Then** the handler logs the out-of-order event and skips mutating the newer projection record.
2. **Given** events arriving in sequential order ($V_1 \rightarrow V_2 \rightarrow V_3$), **When** processed sequentially, **Then** each updates the local projection version and data state accordingly.

---

### User Story 4 - Resilient Error Handling, Retries & Dead Letter Queue (DLQ) (Priority: P4)

As an operations engineer, I need transient failures (e.g. brief database disconnects) to be retried automatically with backoff, and non-recoverable failures (e.g. malformed payloads, corrupt data) to be routed to a Dead Letter Queue (DLQ) with contextual error metadata for manual inspection and replay.

**Why this priority**: Prevents poison pills from blocking the consumer partition while guaranteeing that transient network blips do not cause data loss.

**Independent Test**: Simulate database connectivity drop during event consumption to verify exponential backoff retry; simulate unrecoverable schema validation failure to verify immediate routing to DLQ with structured failure alert.

**Acceptance Scenarios**:

1. **Given** a transient database connection timeout during event handling, **When** the consumer encounters the error, **Then** it retries up to the maximum configured retry threshold (e.g. 3 attempts with exponential backoff) before succeeding or exhausting retries.
2. **Given** a corrupted or non-retryable event payload (or exhausted retries), **When** processing fails, **Then** the event envelope is published to the configured DLQ topic (`setting.events.dlq`) with failure reason, stack trace, timestamp, and original headers, and the consumer offset is committed to keep the pipeline flowing.

---

### Edge Cases

- What happens when a child entity event (e.g., `setting.department.created` referencing `companyId`) arrives before the parent company projection exists in Directory?
  - The handler should either persist the reference or trigger a controlled retry/backoff mechanism allowing the parent event to settle.
- How does the system handle cross-tenant leakage in event payloads?
  - Every handler strictly enforces `WHERE tenant_id = :tenantId` scoping on all queries and mutations matching the event envelope `tenantId`. Any attempt to modify a different tenant's projection must fail validation and be flagged.
- How does the system handle unknown or unsupported event types within the `setting.*` namespace?
  - Unsupported events within the Setting namespace must be logged and safely acknowledged (or routed to an unhandled event topic) without throwing unhandled exceptions that crash the consumer group.
- How does the system handle Debezium outbox wrapper transformations?
  - Logical event payload parsing extracts the uniform `SettingEvent<T>` envelope regardless of underlying CDC envelope formatting.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Directory Service MUST consume organizational master data events from the dedicated Kafka topic (`setting.events`) using consumer group `directory-service-provisioning`.
- **FR-002**: Directory Service MUST strictly operate as a consumer/projection store for Company, Location, Department, Grade, and Job Title domains, and MUST NOT provide source-of-truth CRUD APIs or modify Setting Service database directly.
- **FR-003**: System MUST support the full lifecycle events with `setting.*` prefix:
  - `setting.company.created`, `setting.company.updated`, `setting.company.deactivated`
  - `setting.location.created`, `setting.location.updated`, `setting.location.deactivated`
  - `setting.department.created`, `setting.department.updated`, `setting.department.deactivated`
  - `setting.grade.created`, `setting.grade.updated`, `setting.grade.deactivated`
  - `setting.job_title.created`, `setting.job_title.updated`, `setting.job_title.deactivated`
- **FR-004**: System MUST validate all incoming events against a standard `SettingEvent<T>` envelope containing `eventId`, `eventType`, `eventVersion`, `tenantId`, `aggregateId`, `occurredAt`, `traceId`, `correlationId`, and typed `payload`.
- **FR-005**: Provisioning Service MUST route events to dedicated modular handlers:
  - `CompanyProvisioningHandler`
  - `LocationProvisioningHandler`
  - `DepartmentProvisioningHandler`
  - `GradeProvisioningHandler`
  - `JobTitleProvisioningHandler`
- **FR-006**: System MUST enforce idempotency by recording successfully processed event identifiers (`eventId`, `tenantId`, `eventType`, `processedAt`) in a dedicated `processed_events` table with a unique constraint on `eventId`.
- **FR-007**: System MUST guarantee strict tenant isolation by scoping all projection lookup and mutation queries to the `tenantId` present in the verified event envelope.
- **FR-008**: System MUST prevent stale event overwrites using aggregate version comparison (`eventVersion` / timestamp comparison) against the existing local projection record.
- **FR-009**: System MUST implement retry policies with backoff for transient errors, and route poison pills / exhausted retries to a Dead Letter Queue (`setting.events.dlq`) accompanied by error diagnostic headers.
- **FR-010**: System MUST expose structured audit logging and Prometheus metrics (`directory_provisioning_events_total`, `directory_provisioning_success_total`, `directory_provisioning_failure_total`, `directory_provisioning_retry_total`, `directory_provisioning_duration_seconds`) tagged by `eventType`, `tenantId`, and status.
- **FR-011**: If downstream services (e.g. Authorization) require awareness of Directory-specific provisioning completion, Directory MAY publish derived events under `directory.<entity>.provisioned` namespace without mutating or renaming the original Setting events.

---

### Key Entities *(include if feature involves data)*

- **ProcessedEvent (`processed_events`)**:
  - `id`: Unique surrogate identifier (UUID).
  - `eventId`: Originating Setting event ID (UUID, Unique Index).
  - `eventType`: Name of event type (e.g., `setting.department.updated`).
  - `tenantId`: Tenant identifier for isolation.
  - `aggregateId`: Master entity aggregate identifier.
  - `processedAt`: Timestamp when event processing completed.
- **Company Projection (`companies` / master projection)**:
  - `id`: Company aggregate identifier matching Setting Service ID.
  - `tenantId`: Tenant identifier.
  - `code`: Unique company code.
  - `name`: Company display name.
  - `status`: Active / Inactive status.
  - `version`: Aggregate version for optimistic concurrency and ordering.
- **Department Projection (`departments`)**:
  - `id`: Department aggregate identifier matching Setting Service ID.
  - `tenantId`: Tenant identifier.
  - `companyId`: Parent company reference.
  - `code`: Department code.
  - `name`: Department name.
  - `status`: Active / Inactive status.
  - `version`: Aggregate version for ordering.
- **Location Projection (`locations`)**:
  - `id`: Location identifier matching Setting Service ID.
  - `tenantId`: Tenant identifier.
  - `companyId`: Parent company reference.
  - `name`: Location name / address info.
  - `status`: Active / Inactive status.
  - `version`: Aggregate version for ordering.
- **Grade Projection (`grades`)**:
  - `id`: Grade identifier matching Setting Service ID.
  - `tenantId`: Tenant identifier.
  - `code`: Grade code / level.
  - `name`: Grade name.
  - `level`: Numerical rank / hierarchy level.
  - `status`: Active / Inactive status.
  - `version`: Aggregate version for ordering.
- **JobTitle Projection (`job_titles`)**:
  - `id`: Job Title identifier matching Setting Service ID.
  - `tenantId`: Tenant identifier.
  - `code`: Job title code.
  - `name`: Job title name.
  - `status`: Active / Inactive status.
  - `version`: Aggregate version for ordering.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid master data events dispatched by Setting Service are accurately reflected in Directory Service projections within 2 seconds under standard load.
- **SC-002**: 100% of duplicate event deliveries are safely ignored with zero duplicate projection mutations and zero processing errors.
- **SC-003**: 0% cross-tenant data corruption or leakage during simultaneous multi-tenant event consumption.
- **SC-004**: 100% of unrecoverable poison-pill messages are redirected to DLQ without stalling or halting consumer partition consumption.
- **SC-005**: Unit and integration test coverage for the Provisioning module meets or exceeds Constitution gates ($\ge 90\%$ statement coverage, $\ge 85\%$ branch coverage).

---

## Assumptions

- **Master Data Authority**: Setting Service is the absolute source of truth; Directory Service never pushes master entity mutations back to Setting Service.
- **Partitioning Key**: Kafka events published by Setting Service use `aggregateId` (or `tenantId:aggregateId`) as the message partition key to guarantee sequential delivery per aggregate.
- **Database Schema Ownership**: Directory Service manages its own projection tables and migrations via TypeORM within the Directory PostgreSQL database.
- **No Direct Synchronous Coupling**: Directory Service does not make synchronous REST or direct database queries to Setting Service during event ingestion.
- **Contract Stability**: Setting Service adheres to the agreed JSON event schema containing required envelope headers (`eventId`, `tenantId`, `eventType`, `eventVersion`, `payload`).

# Research & Architectural Decisions: Directory Service Provisioning Module

**Feature**: Directory Service Provisioning Module (`specs/003-directory-provisioning`)
**Date**: 2026-09-26
**Author**: Antigravity Assistant

---

## 1. Architecture Decisions

### Decision 1.1: Event-Driven Unidirectional Synchronization (Source of Truth Separation)
- **Decision**: Setting Service owns all master-data domains (`Company`, `Location`, `Department`, `Grade`, `JobTitle`). Directory Service is strictly an event-driven consumer holding read projections.
- **Rationale**: Setting Service acts as the single source of truth across the enterprise HRMS platform. Directory Service requires fast local joins and query resolution for employees and employment assignments without making cross-service HTTP calls or distributed transactions.
- **Alternatives Considered**:
  - *Synchronous REST lookup on demand*: Rejected due to high latency, tight coupling, and vulnerability to cascading network failures.
  - *Shared database tables*: Strictly prohibited by Constitution Principle III (Polyrepo Domain Isolation & Zero cross-service DB access).
  - *Bidirectional sync (Directory writes back to Setting)*: Strictly prohibited to avoid infinite update loops and split-brain states.

### Decision 1.2: Dedicated `provisioning` Domain Module with Clean Architecture
- **Decision**: Introduce a top-level domain module `src/modules/provisioning/` structured with:
  - `consumers/`: Kafka consumer listener component (deserialization, envelope validation).
  - `services/`: `ProvisioningService` (event routing and orchestration).
  - `handlers/`: Individual domain entity provisioning handlers (`CompanyProvisioningHandler`, `LocationProvisioningHandler`, etc.).
  - `repositories/`: `ProcessedEventRepository` and projection repositories.
  - `entities/`: `ProcessedEventEntity` and projection entities (`CompanyProjectionEntity`, `DepartmentProjectionEntity`, etc.).
- **Rationale**: Keeps transport/deserialization separated from business routing, persistence, and projection transformations in compliance with Clean Architecture layering.
- **Alternatives Considered**:
  - *Embedding handlers inside `employee` or `employment` module*: Rejected because master data projections span multiple modules and represent an independent infrastructure bounded context.

### Decision 1.3: Database-Level Idempotency Ledger with Atomic Transactions
- **Decision**: Use a dedicated table `processed_events` storing `event_id` (with a unique constraint), `tenant_code`, `event_type`, `aggregate_id`, `version`, and `processed_at`. All entity mutations and the `processed_events` insertion execute within a single atomic database transaction via `QueryRunner` or `runInTransaction`.
- **Rationale**: Kafka provides at-least-once delivery. In a multi-replica consumer group, network retransmits or consumer rebalances can cause identical messages to be received. Transactional record insertion guarantees atomic execution and eliminates phantom processing.
- **Alternatives Considered**:
  - *Redis deduplication key with TTL*: Rejected because if a DB write fails after a Redis key is set, the event would not be retried. Using PostgreSQL transactional atomicity provides ACID guarantees.

### Decision 1.4: Event Ordering & Stale Event Protection Strategy
- **Decision**: Projection entities will maintain an aggregate `version` column (integer or timestamp). When handling updates or deactivations:
  - If incoming `event.eventVersion > currentProjection.version`, apply the update and set `projection.version = event.eventVersion`.
  - If incoming `event.eventVersion <= currentProjection.version`, the event is logged as an out-of-order/stale update and skipped.
  - For create events, if the entity already exists, treat as an update if `event.eventVersion > currentProjection.version`.
- **Rationale**: Network latency and message retries can result in delayed delivery of earlier state updates.
- **Alternatives Considered**:
  - *Always overwrite (last-write-wins by local DB timestamp)*: Rejected because local processing timestamp does not reflect the master data creation timestamp.

### Decision 1.5: Resilient Retries and Dead-Letter Queue (DLQ) Strategy
- **Decision**:
  - *Transient errors* (e.g. DB connection timeout, deadlock): Retry up to 3 times with exponential backoff (1s, 2s, 4s).
  - *Non-transient errors* (e.g. JSON schema validation error, unsupported format) or *retries exhausted*: Route message to `setting.events.dlq` containing original message, error stack trace, attempt count, and metadata headers. Acknowledge the original offset to unblock the partition.
- **Rationale**: Poison pills must never block partition consumption for other tenants or aggregates.

### Decision 1.6: Strict Tenant Isolation
- **Decision**: Every query and update in projection repositories must be explicitly qualified with `tenantCode` (`tenant_code` in DB) matching `event.tenantId`.
- **Rationale**: Prevents accidental cross-tenant data corruption or unauthorized mutation in multi-tenant SaaS environments.

### Decision 1.7: Debezium Compatibility & Uniform Logical Event Envelope
- **Decision**: Support the standard `SettingEvent<T>` envelope directly while providing an unwrap utility that can extract the logical payload if messages arrive via Debezium Outbox Event Router or raw Kafka message format.
- **Rationale**: Keeps domain handlers decoupled from CDC infrastructure details.

---

## 2. Setting Event Contracts & Topic Topology

### Kafka Topic & Consumer Group
- **Input Topic**: `setting.events` (or configured via environment)
- **Consumer Group**: `directory-service-provisioning`
- **DLQ Topic**: `setting.events.dlq`
- **Partitioning Key**: `aggregateId` (e.g. `companyId`, `departmentId`, `locationId`, etc.) ensuring per-aggregate FIFO ordering within each Kafka partition.

### Supported Event Types
1. `setting.company.created`, `setting.company.updated`, `setting.company.deactivated`
2. `setting.location.created`, `setting.location.updated`, `setting.location.deactivated`
3. `setting.department.created`, `setting.department.updated`, `setting.department.deactivated`
4. `setting.grade.created`, `setting.grade.updated`, `setting.grade.deactivated`
5. `setting.job_title.created`, `setting.job_title.updated`, `setting.job_title.deactivated`

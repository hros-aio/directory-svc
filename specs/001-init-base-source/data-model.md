# Data Model: Base Source Initialization

**Feature**: `001-init-base-source` | **Date**: 2026-08-23

## 1. Foundational Entities & Abstractions

All persistent entities in the Directory Service inherit from `BaseEntity` provided by `@hrms/libs-sql`.

### BaseEntity Contract (Inherited Attributes)

| Field | Type | Description | Constraints |
|---|---|---|---|
| `id` | `string` (UUID v4) | Primary identifier | Primary Key, Generated |
| `createdAt` | `Date` | Timestamp of creation | Auto-generated timestamp |
| `updatedAt` | `Date` | Timestamp of last modification | Auto-updated timestamp |
| `deletedAt` | `Date \| null` | Soft-delete timestamp | Nullable, indexed |
| `version` | `number` | Optimistic locking counter | Managed via `@VersionColumn()` |

---

## 2. Core Entities (Scaffolding Reference)

### DirectoryServiceRuntime
Represents the in-memory execution state of the service instance.

- **Attributes**:
  - `instanceId`: `string` (UUID) - Unique ID for running pod/container
  - `status`: `'STARTING' | 'HEALTHY' | 'DEGRADED' | 'SHUTTING_DOWN'`
  - `environment`: `'development' | 'staging' | 'production' | 'test'`
  - `uptimeSeconds`: `number`
  - `version`: `string` (semver from package.json)

### ServiceHealthStatus
Represents the composite health report exposed by orchestration probes.

- **Attributes**:
  - `status`: `'ok' | 'error' | 'shutting_down'`
  - `info`: `Record<string, { status: 'up' | 'down'; message?: string }>`
    - `database`: Status of PostgreSQL connection pool
    - `cache`: Status of Redis connection
    - `memory_heap`: Heap usage metrics
  - `error`: `Record<string, string>` (if degraded)
  - `timestamp`: `string` (ISO 8601)

### AuditLogContext
Represents contextual trace attributes carried across execution contexts via `AsyncLocalStorage`.

- **Attributes**:
  - `requestId`: `string` (UUID / incoming trace header)
  - `tenantCode`: `string` (multi-tenant identifier)
  - `sessionId`: `string | null`
  - `userId`: `string | null`
  - `path`: `string`
  - `method`: `string`

---

## 3. Directory Domain Entity Scaffolding (Target Models)

The initialized directory service scaffolding prepares contracts for upcoming directory subdomains:

### EmployeeEntity (Reference Scaffolding)
- `id`: `string` (UUID, PK)
- `tenantCode`: `string` (indexed)
- `employeeCode`: `string` (unique per tenant)
- `firstName`: `string`
- `lastName`: `string`
- `email`: `string` (unique per tenant)
- `status`: `EmploymentStatus` enum (`ACTIVE`, `PROBATION`, `TERMINATED`, `SUSPENDED`)
- `departmentId`: `string | null` (UUID)
- `locationId`: `string | null` (UUID)
- `hireDate`: `Date`
- `metadata`: `Record<string, unknown>` (JSONB)

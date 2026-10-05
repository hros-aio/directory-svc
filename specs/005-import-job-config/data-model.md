# Data Model: Import Job Configuration Management

## 1. Entities & Database Tables

### 1.1 `EmployeeImportProfileEntity`
Table: `employee_import_profiles`

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `false` | `gen_random_uuid()` | Primary Key |
| `tenant_code` | `varchar(64)` | `true` | `null` | Owning tenant identifier. `null` for system-level profiles |
| `company_id` | `uuid` | `true` | `null` | Scoped company identifier. `null` for tenant-wide or system profiles |
| `name` | `varchar(128)` | `false` | - | Human-readable profile name |
| `description` | `text` | `true` | `null` | Optional description |
| `config` | `jsonb` | `false` | - | Validated import policy configuration document |
| `version` | `integer` | `false` | `1` | Optimistic concurrency control version |
| `is_active` | `boolean` | `false` | `true` | Active lifecycle status |
| `created_by` | `varchar(64)` | `false` | - | Authenticated user ID of the creator |
| `created_at` | `timestamptz` | `false` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `false` | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | `true` | `null` | Soft deletion timestamp |

#### Indexes & Constraints
- `uq_import_profiles_system_name`: Unique partial index on `(name)` WHERE `tenant_code IS NULL AND deleted_at IS NULL`.
- `uq_import_profiles_tenant_global_name`: Unique partial index on `(tenant_code, name)` WHERE `tenant_code IS NOT NULL AND company_id IS NULL AND deleted_at IS NULL`.
- `uq_import_profiles_tenant_company_name`: Unique partial index on `(tenant_code, company_id, name)` WHERE `tenant_code IS NOT NULL AND company_id IS NOT NULL AND deleted_at IS NULL`.
- `idx_import_profiles_tenant_company_active`: Index on `(tenant_code, company_id, is_active)` WHERE `deleted_at IS NULL`.

---

### 1.2 `EmployeeImportJobEntity`
Table: `employee_import_jobs`

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | `false` | `gen_random_uuid()` | Primary Key |
| `tenant_code` | `varchar(64)` | `false` | - | Owning tenant identifier |
| `company_id` | `uuid` | `true` | `null` | Target company identifier for import |
| `status` | `varchar(32)` | `false` | `'PENDING'` | Job lifecycle status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) |
| `profile_id` | `uuid` | `true` | `null` | Reference to source `employee_import_profiles(id)` |
| `profile_version` | `integer` | `true` | `null` | Source profile version at moment of job creation |
| `config_snapshot` | `jsonb` | `false` | - | Immutable resolved effective configuration snapshot |
| `created_by` | `varchar(64)` | `false` | - | Authenticated user ID of the initiator |
| `created_at` | `timestamptz` | `false` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `false` | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | `true` | `null` | Soft deletion timestamp |

#### Foreign Keys & Constraints
- `fk_employee_import_jobs_profile_id`: Foreign key on `profile_id` referencing `employee_import_profiles(id)` with `ON DELETE SET NULL`.
- `idx_import_jobs_tenant_company_status`: Index on `(tenant_code, company_id, status)` WHERE `deleted_at IS NULL`.

---

## 2. Configuration Schema Data Types

### 2.1 Enums

```typescript
export enum ImportRowErrorMode {
  CONTINUE_ON_ROW_ERROR = 'CONTINUE_ON_ROW_ERROR',
  STOP_ON_ROW_ERROR = 'STOP_ON_ROW_ERROR',
  STOP_ON_ERROR_THRESHOLD = 'STOP_ON_ERROR_THRESHOLD',
  ALL_OR_NOTHING = 'ALL_OR_NOTHING',
}
```

### 2.2 Policy Interfaces

```typescript
export interface ErrorPolicyConfig {
  readonly mode: ImportRowErrorMode;
  readonly maxErrorRows?: number;
  readonly maxErrorRate?: number;
}

export interface RetryPolicyConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

export interface TimeoutPolicyConfig {
  readonly jobTimeoutSeconds: number;
  readonly batchTimeoutSeconds: number;
  readonly idleTimeoutSeconds: number;
}

export interface ExecutionPolicyConfig {
  readonly batchSize: number;
  readonly maxConcurrentBatches: number;
}

export interface ImportJobConfig {
  readonly errorPolicy: ErrorPolicyConfig;
  readonly retryPolicy: RetryPolicyConfig;
  readonly timeoutPolicy: TimeoutPolicyConfig;
  readonly executionPolicy: ExecutionPolicyConfig;
}
```

---

## 3. Validation Rules & Invariants

1. **Error Policy**:
   - `mode`: Must be one of `ImportRowErrorMode`.
   - `maxErrorRows`: Optional, integer `>= 0`.
   - `maxErrorRate`: Optional, number between `0.0` and `1.0`.
   - Invariant: When `mode === STOP_ON_ERROR_THRESHOLD`, at least one of `maxErrorRows` or `maxErrorRate` must be defined and strictly greater than zero.

2. **Retry Policy**:
   - `maxAttempts`: Integer, `1 <= maxAttempts <= 10`.
   - `initialDelayMs`: Integer, `100 <= initialDelayMs <= 60000`.
   - `maxDelayMs`: Integer, `maxDelayMs >= initialDelayMs` and `<= 300000`.
   - `backoffMultiplier`: Number, `1.0 <= backoffMultiplier <= 5.0`.

3. **Timeout Policy**:
   - `jobTimeoutSeconds`: Integer, `10 <= jobTimeoutSeconds <= 86400`.
   - `batchTimeoutSeconds`: Integer, `5 <= batchTimeoutSeconds <= 1800`.
   - `idleTimeoutSeconds`: Integer, `5 <= idleTimeoutSeconds <= 1800`.
   - Invariant: `jobTimeoutSeconds >= batchTimeoutSeconds`.

4. **Execution Policy**:
   - `batchSize`: Integer, `1 <= batchSize <= 1000`.
   - `maxConcurrentBatches`: Integer, `1 <= maxConcurrentBatches <= 10`.

5. **Entity Concurrency & Lifecycle Invariants**:
   - Updating `EmployeeImportProfileEntity` requires matching `expectedVersion === entity.version`.
   - Any modification increments `version` by 1.
   - Deactivated profiles (`isActive === false`) cannot be selected when creating new import jobs.
   - `EmployeeImportJobEntity.config_snapshot` is immutable once written; it cannot be modified after creation.

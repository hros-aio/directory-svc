# Technical Research & Architecture Decisions: Import Job Configuration Management

## 1. Configuration Schema Definition & Standalone Runtime Validation

### Decision
Define TypeScript interfaces and class-based validation schemas for `ImportJobConfig`, `ErrorPolicy`, `RetryPolicy`, `TimeoutPolicy`, and `ExecutionPolicy`. Runtime validation will be encapsulated in a dedicated `ConfigurationValidator` provider that utilizes `class-validator` and `class-transformer` with `whitelist: true, forbidNonWhitelisted: true`.

### Rationale
- **Decoupled Validation**: Encapsulating validation in `ConfigurationValidator` allows both HTTP controllers and downstream job resolution services / CLI / worker modules to validate configurations without relying on NestJS HTTP `ValidationPipe`.
- **Strict Whitelisting**: `forbidNonWhitelisted: true` ensures unknown configuration attributes are rejected immediately, preventing typos and unexpected behaviors.
- **Cross-Field Validation**: Custom validator decorators or validator methods verify interdependent attributes:
  - When `errorPolicy.mode === STOP_ON_ERROR_THRESHOLD`, at least one of `maxErrorRows` or `maxErrorRate` must be specified.
  - In `retryPolicy`, `maxDelayMs` must be `>= initialDelayMs`.
  - In `timeoutPolicy`, `jobTimeoutSeconds` must be `>= batchTimeoutSeconds`.

### Alternatives Considered
- *JSON Schema (ajv)*: Validates JSON schemas quickly, but introduces a second schema definition language outside TypeScript and `class-validator`, deviating from existing repository patterns.
- *Zod*: Highly expressive, but would introduce an extra dependency into a codebase standardizing on `class-validator` and `class-transformer`.

---

## 2. Precedence Hierarchy, Deep Merging & Safety Quotas

### Decision
Implement `ConfigurationResolverService` enforcing a 3-tier precedence order:
1. **System Baseline Defaults**: Static immutable baseline defining safe standard values for all policy settings.
2. **Tenant Profile**: Selected `EmployeeImportProfile.config` or tenant-level defaults.
3. **Job-Level Overrides**: Ad-hoc partial configuration provided during job initiation.

Merging is performed using a custom deep-merge function that strictly operates on known policy keys. After merging, the resolved configuration is checked against system safety limits (`SYSTEM_SAFETY_LIMITS`).

### System Safety Limits (Quotas)
| Policy Field | Minimum Allowed | Maximum Allowed | Default |
|---|---|---|---|
| `executionPolicy.batchSize` | 1 | 1,000 | 500 |
| `executionPolicy.maxConcurrentBatches` | 1 | 10 | 1 |
| `retryPolicy.maxAttempts` | 1 | 10 | 3 |
| `retryPolicy.initialDelayMs` | 100 | 60,000 | 1,000 |
| `retryPolicy.maxDelayMs` | 500 | 300,000 (5m) | 30,000 |
| `retryPolicy.backoffMultiplier` | 1.0 | 5.0 | 2.0 |
| `timeoutPolicy.jobTimeoutSeconds` | 10 | 86,400 (24h) | 1,800 (30m) |
| `timeoutPolicy.batchTimeoutSeconds` | 5 | 1,800 (30m) | 60 |
| `timeoutPolicy.idleTimeoutSeconds` | 5 | 1,800 (30m) | 300 |

If any tenant profile or job-level override attempts to exceed these bounds, `ConfigurationResolverService` throws `BusinessException('CONFIG_QUOTA_EXCEEDED', HttpStatus.BAD_REQUEST)`.

### Rationale
- Prevents resource starvation (e.g. single tenant attempting batchSize=100,000 or 100 concurrent workers).
- Ensures deterministic fallback: any omitted field at the profile or override level automatically resolves to the system baseline.

### Alternatives Considered
- *Shallow merge (`Object.assign`)*: Rejected because shallow merging replaces entire policy objects (e.g., overriding `retryPolicy.maxAttempts` would wipe out `initialDelayMs` and `backoffMultiplier`).
- *Unconstrained deep merge*: Rejected because it allows arbitrary properties to leak into the resolved configuration snapshot.

---

## 3. Optimistic Concurrency Control & Versioning

### Decision
`EmployeeImportProfileEntity` incorporates an integer `version` column managed via TypeORM's `@VersionColumn()`.
- Profile updates require an optional or explicit `expectedVersion` parameter.
- The update query evaluates `WHERE id = :id AND version = :expectedVersion`.
- If 0 rows are affected (version mismatch), the service throws `BusinessException('STALE_PROFILE_VERSION', HttpStatus.CONFLICT)`.
- **Semantics**: Any update to the profile record—including metadata such as `name` or `description`—increments `version` by 1. This guarantees that any concurrent edit is detected and prevented from silently overwriting recent changes.

### Rationale
- Standardizes concurrency control without requiring distributed locks.
- Ensures consistency when multiple tenant administrators configure import jobs simultaneously.

---

## 4. Multi-Tenant Isolation & System-Level Profile Protection

### Decision
- System-level profiles are identified by `tenant_code IS NULL`.
- Tenant administrators cannot modify, activate, deactivate, or delete profiles where `tenant_code IS NULL` (`403 Forbidden: SYSTEM_PROFILE_IMMUTABLE`).
- In list operations: query retrieves `(tenant_code = :tenantCode OR tenant_code IS NULL) AND deleted_at IS NULL`.
- In get operations: if a profile belongs to another tenant (`tenant_code !== currentTenant && tenant_code !== null`), the service returns `404 Not Found` (`PROFILE_NOT_FOUND`) to prevent enumeration attacks.
- Profile name uniqueness:
  - System profiles: unique index on `(name)` WHERE `tenant_code IS NULL AND deleted_at IS NULL`.
  - Tenant-global profiles: unique index on `(tenant_code, name)` WHERE `tenant_code IS NOT NULL AND company_id IS NULL AND deleted_at IS NULL`.
  - Company-scoped profiles: unique index on `(tenant_code, company_id, name)` WHERE `tenant_code IS NOT NULL AND company_id IS NOT NULL AND deleted_at IS NULL`.

---

## 5. Configuration Snapshotting in Import Jobs

### Decision
Create `EmployeeImportJobEntity` with:
- `profile_id`: UUID nullable foreign key to `employee_import_profiles(id)` (`ON DELETE SET NULL`).
- `profile_version`: integer, nullable.
- `company_id`: UUID, nullable, identifying the target company for the employee import job.
- `config_snapshot`: `jsonb`, not null, storing the immutable resolved configuration.
- `tenant_code`: varchar(64), not null.
- `status`: enum / varchar representing job lifecycle.

When `createJob(...)` is invoked:
1. If `profileId` is supplied, fetch the profile and ensure `is_active === true`.
2. If `profile.companyId` is set, verify that `job.companyId === profile.companyId`.
3. If `companyId` is supplied on job, validate that the company exists, belongs to `tenantCode`, and has `status === 'ACTIVE'` via `CompanyProjectionRepository`.
4. Resolve effective configuration: System Baseline → Profile Config → Job Overrides.
5. Persist `config_snapshot`, `company_id`, `profile_id`, and `profile_version = profile.version`.
6. The snapshot is completely decoupled from the profile; future changes to the profile do not trigger any cascade or mutation of existing job snapshots.

---

## 6. Multi-Company Scoping & Validation via CompanyProjection

### Decision
Directory Service maintains local company projection records via `CompanyProjectionEntity` and `CompanyProjectionRepository` in `src/modules/provisioning/repositories/company-projection.repository.ts`, synchronized from the Organization / Provisioning service.
- **Profile Multi-Company Scoping**:
  - `company_id: null` with `tenant_code: null`: Global system profile.
  - `company_id: null` with `tenant_code: <tenant>`: Tenant-wide profile usable by all companies within that tenant.
  - `company_id: <uuid>` with `tenant_code: <tenant>`: Scoped profile dedicated to a specific company.
- **Validation**:
  - If a client supplies `companyId` when creating or updating a profile or creating an import job, the service queries `CompanyProjectionRepository.findOne({ where: { id: companyId, tenantCode, deletedAt: IsNull() } })`.
  - If not found or `company.status !== 'ACTIVE'`, throws `BusinessException('COMPANY_NOT_FOUND', HttpStatus.BAD_REQUEST)` or `BusinessException('COMPANY_INACTIVE', HttpStatus.BAD_REQUEST)`.
  - Tenant administrators are prevented from referencing companies of other tenants because the lookup enforces `tenantCode`.
- **Query Filtering**:
  - `GET /employee-import-profiles?companyId=<uuid>`: Returns tenant profiles scoped to that company, tenant-wide profiles (`company_id IS NULL`), and system profiles (`tenant_code IS NULL`).


# Quickstart & Verification Guide: Import Job Configuration Management

## Prerequisites

- Node.js LTS (v20+)
- pnpm package manager
- Local PostgreSQL instance or Docker test container running
- Directory Service dependencies installed (`pnpm install`)

---

## 1. Automated Test Execution

Run the complete unit and integration test suite covering profile CRUD, schema validation, nested resolution, safety quotas, optimistic locking, and tenant isolation:

```bash
# Run unit tests for import profile & configuration resolution
pnpm test src/modules/employee-import/

# Run coverage verification
pnpm test:cov src/modules/employee-import/
```

Expected Outcome:
- All unit and integration tests pass with 0 failures.
- Minimum statement coverage >= 90%, branch coverage >= 85%.

---

## 2. Validation Scenarios & Verification Steps

### Scenario 1: Create Import Profile with Runtime Validation
1. Send `POST /employee-import-profiles` with a valid JSON configuration payload referencing policies ([contracts/import-profiles-api.md](contracts/import-profiles-api.md#1-create-profile)).
2. **Verify**:
   - HTTP status `201 Created`.
   - `id` generated (UUID).
   - `version` initialized to `1`.
   - `isActive` is `true`.
   - Unknown fields or out-of-range bounds (e.g. `batchSize: 50000`) return HTTP `400 Bad Request`.

### Scenario 2: Retrieve Profiles with Tenant Isolation
1. Authenticate with Tenant A credentials. Send `GET /employee-import-profiles`.
2. **Verify**:
   - Response contains Tenant A profiles and permitted system-level profiles (`tenantCode: null`).
   - Profiles belonging to Tenant B are never returned.

### Scenario 3: Update Profile with Optimistic Concurrency Control
1. Send `PATCH /employee-import-profiles/:id` with `expectedVersion: 1` and modified `executionPolicy.batchSize: 750`.
2. **Verify**:
   - HTTP `200 OK`, `version` is incremented to `2`.
3. Submit another update immediately with `expectedVersion: 1`.
4. **Verify**:
   - HTTP `409 Conflict` with error code `STALE_PROFILE_VERSION`.

### Scenario 4: Effective Configuration Resolution & Safety Quota Enforcement
1. Invoke `ConfigurationResolverService.resolve(...)` with:
   - System baseline defaults.
   - Profile overriding `batchSize = 250`.
   - Job override overriding `errorPolicy.maxErrorRows = 50`.
2. **Verify**:
   - Effective configuration reflects the nested merged result.
   - Sibling fields (e.g. `errorPolicy.mode`, `retryPolicy.*`) retain their respective defaults.
3. Attempt to pass job override `executionPolicy.batchSize = 5000`.
4. **Verify**:
   - Immediate rejection with `CONFIG_QUOTA_EXCEEDED`.

### Scenario 5: Immutable Job Configuration Snapshotting
1. Create an import job referencing Profile A at version 1.
2. Assert `employee_import_jobs` record contains `profile_id`, `profile_version: 1`, `company_id`, and `config_snapshot`.
3. Update Profile A to version 2 (e.g., change `batchSize` to 800) or deactivate Profile A.
4. Query the import job created in step 1.
5. **Verify**:
   - `config_snapshot` and `profile_version` in the job record remain completely identical to the initial snapshot.

### Scenario 6: Multi-Company Scoping & CompanyProjection Validation
1. Create a company-scoped profile referencing an active company UUID (`POST /employee-import-profiles`).
2. **Verify**: Profile is created with `companyId` set.
3. Attempt to create a profile referencing an inactive company or a company belonging to another tenant.
4. **Verify**: Immediate rejection with HTTP `400 Bad Request` (`COMPANY_NOT_FOUND` or `COMPANY_INACTIVE`).
5. Query `GET /employee-import-profiles?companyId=<companyId>`.
6. **Verify**: List returns the company-scoped profile, tenant-wide profiles (`companyId: null`), and system profiles (`tenantCode: null`).
7. Create an import job referencing a company-scoped profile with mismatched `companyId`.
8. **Verify**: Rejection with HTTP `400 Bad Request` indicating profile company scope mismatch.

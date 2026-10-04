# API Contracts: Employee Import Profiles & Job Snapshots

## Base Path: `/employee-import-profiles`

All endpoints require:
- `Authorization: Bearer <JWT>` containing `tenantCode` and `userId`.
- Standard error envelope: `{ statusCode: number, message: string, errorCode: string, timestamp: string, path: string }`.

---

### 1. Create Profile
- **Method**: `POST`
- **Path**: `/employee-import-profiles`
- **Permission**: `import_profile.create`
- **Request Body**:
  ```json
  {
    "name": "Standard Employee Bulk Import",
    "description": "Default configuration for large monthly payroll/employee sync",
    "companyId": "e5b8d2a6-9f3c-4217-b715-2f9876543210",
    "config": {
      "errorPolicy": {
        "mode": "CONTINUE_ON_ROW_ERROR",
        "maxErrorRows": 1000,
        "maxErrorRate": 0.05
      },
      "retryPolicy": {
        "maxAttempts": 3,
        "initialDelayMs": 1000,
        "maxDelayMs": 30000,
        "backoffMultiplier": 2.0
      },
      "timeoutPolicy": {
        "jobTimeoutSeconds": 1800,
        "batchTimeoutSeconds": 60,
        "idleTimeoutSeconds": 300
      },
      "executionPolicy": {
        "batchSize": 500,
        "maxConcurrentBatches": 1
      }
    }
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "id": "a4d3f56b-8c1e-450a-8d76-123456789abc",
      "tenantCode": "TENANT_ACME",
      "companyId": "e5b8d2a6-9f3c-4217-b715-2f9876543210",
      "name": "Standard Employee Bulk Import",
      "description": "Default configuration for large monthly payroll/employee sync",
      "config": { ... },
      "version": 1,
      "isActive": true,
      "createdBy": "usr_998877",
      "createdAt": "2026-10-04T12:00:00.000Z",
      "updatedAt": "2026-10-04T12:00:00.000Z"
    }
    ```
  - `400 Bad Request`: Schema validation failure, unknown configuration attributes, or invalid/inactive `companyId`.
  - `409 Conflict`: Duplicate profile name for the current tenant and company scope (`DUPLICATE_PROFILE_NAME`).

---

### 2. List Profiles
- **Method**: `GET`
- **Path**: `/employee-import-profiles`
- **Permission**: `import_profile.read`
- **Query Parameters**:
  - `isActive`: (optional boolean) filter by active state.
  - `includeSystem`: (optional boolean, default `true`) include system-level profiles.
  - `companyId`: (optional UUID) filter profiles scoped to this company or tenant-wide (`company_id IS NULL`).
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": "00000000-0000-0000-0000-000000000001",
        "tenantCode": null,
        "companyId": null,
        "name": "System Default Profile",
        "description": "Baseline system-provided import profile",
        "config": { ... },
        "version": 1,
        "isActive": true,
        "isSystem": true,
        "createdBy": "system",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      },
      {
        "id": "a4d3f56b-8c1e-450a-8d76-123456789abc",
        "tenantCode": "TENANT_ACME",
        "companyId": "e5b8d2a6-9f3c-4217-b715-2f9876543210",
        "name": "Standard Employee Bulk Import",
        "description": "Default configuration for large monthly payroll/employee sync",
        "config": { ... },
        "version": 1,
        "isActive": true,
        "isSystem": false,
        "createdBy": "usr_998877",
        "createdAt": "2026-10-04T12:00:00.000Z",
        "updatedAt": "2026-10-04T12:00:00.000Z"
      }
    ]
    ```

---

### 3. Get Profile by ID
- **Method**: `GET`
- **Path**: `/employee-import-profiles/:id`
- **Permission**: `import_profile.read`
- **Responses**:
  - `200 OK`: Full profile representation (including `companyId`).
  - `404 Not Found`: Profile not found or belongs to another tenant.

---

### 4. Update Profile
- **Method**: `PATCH`
- **Path**: `/employee-import-profiles/:id`
- **Permission**: `import_profile.update`
- **Request Body**:
  ```json
  {
    "expectedVersion": 1,
    "name": "Updated Profile Name",
    "description": "Updated description",
    "companyId": "e5b8d2a6-9f3c-4217-b715-2f9876543210",
    "config": {
      "executionPolicy": {
        "batchSize": 750,
        "maxConcurrentBatches": 2
      }
    }
  }
  ```
- **Responses**:
  - `200 OK`: Returns updated profile with `version = expectedVersion + 1`.
  - `400 Bad Request`: Validation failure, quota exceeded, or invalid/inactive `companyId`.
  - `403 Forbidden`: Attempting to edit a system-level profile (`SYSTEM_PROFILE_IMMUTABLE`).
  - `404 Not Found`: Profile not found or belongs to another tenant.
  - `409 Conflict`: Expected version does not match current version (`STALE_PROFILE_VERSION`).

---

### 5. Activate Profile
- **Method**: `POST`
- **Path**: `/employee-import-profiles/:id/activate`
- **Permission**: `import_profile.update`
- **Responses**:
  - `200 OK`: Profile with `isActive: true`.
  - `403 Forbidden`: System profile.
  - `404 Not Found`: Profile not found.

---

### 6. Deactivate Profile
- **Method**: `POST`
- **Path**: `/employee-import-profiles/:id/deactivate`
- **Permission**: `import_profile.update`
- **Responses**:
  - `200 OK`: Profile with `isActive: false`.
  - `403 Forbidden`: System profile.
  - `404 Not Found`: Profile not found.

---

### 7. Create Import Job Snapshot
- **Contract**: `EmployeeImportJobService.createJob(dto, tenantCode, actorId)`
- **Payload Schema (`CreateImportJobDto`)**:
  ```json
  {
    "profileId": "a4d3f56b-8c1e-450a-8d76-123456789abc",
    "companyId": "e5b8d2a6-9f3c-4217-b715-2f9876543210",
    "overrides": {
      "executionPolicy": {
        "batchSize": 250
      }
    }
  }
  ```
- **Response Schema (`ImportJobResponseDto`)**:
  ```json
  {
    "id": "f8a1c9e2-3b4d-4567-890a-bcdef1234567",
    "tenantCode": "TENANT_ACME",
    "companyId": "e5b8d2a6-9f3c-4217-b715-2f9876543210",
    "status": "PENDING",
    "profileId": "a4d3f56b-8c1e-450a-8d76-123456789abc",
    "profileVersion": 1,
    "configSnapshot": { ... },
    "createdBy": "usr_998877",
    "createdAt": "2026-10-04T12:05:00.000Z",
    "updatedAt": "2026-10-04T12:05:00.000Z"
  }
  ```
- **Error Conditions**:
  - `400 Bad Request`: If `companyId` is invalid/inactive, or if `profile.companyId` is set and does not match `job.companyId`.


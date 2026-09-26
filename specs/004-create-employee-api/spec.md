# Feature Specification: Create Employee API in Directory Service

**Feature Branch**: `004-create-employee-api`  
**Created**: 2026-09-26  
**Status**: Draft  
**Input**: User description: "Design and Implement Create Employee API in Directory Service"  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Core Employee Profile & Primary Assignment (Priority: P1)

As an HR Administrator, I want to create a new employee in the Directory Service with their identity profile, initial employment terms, and primary organizational assignment (Company, Department, Location, Grade, Job Title, and Reporting Manager) so that the employee record is established as the authoritative source of truth across the enterprise.

**Why this priority**:
Creating an employee record is the foundational operation of the Directory Service. Without this capability, downstream systems (Payroll, Access Control, Performance Management, Onboarding) cannot function or reference personnel.

**Independent Test**:
Can be fully tested by submitting a valid `POST /employees` request with complete identity and valid local Setting references, verifying a `201 Created` response containing the created employee with resolved organizational names, verifying the database persistence of `Employee`, `EmployeeProfile`, and `EmploymentAssignment`, and verifying the emission of a `directory.employee.created` transactional outbox event.

**Acceptance Scenarios**:

1. **Given** a valid authenticated HR Administrator tenant session and valid organizational projections for Company, Location, Department, Grade, and Job Title, **When** submitting a `POST /employees` request with valid identity, employment, and assignment attributes, **Then** the system atomically persists the `Employee`, `EmployeeProfile`, and `EmploymentAssignment` records, enqueues an outbox event `directory.employee.created`, and returns HTTP status `201 Created` with the employee payload including resolved organizational names.
2. **Given** an existing active manager employee in the same tenant, **When** creating an employee referencing `managerId` (`managerEmployeeId`), **Then** the reporting hierarchy is established in the assignment record and reflected in the response.
3. **Given** an employee creation request without optional fields (`middleName`, `preferredName`, `dateOfBirth`, `gender`, `avatarUrl`, `personalEmail`, `personalPhone`, `address`, `managerId`, `locationId`, `departmentId`, `gradeId`, `jobTitleId`, `probationEndAt`), **When** submitting the request, **Then** the record is successfully created with nullable fields set to null and default statuses applied (`status = INVITED` or `ACTIVE`, `employmentStatus = PENDING` or `ACTIVE`).

---

### User Story 2 - Local Setting Projection Reference Validation & Organizational Consistency (Priority: P2)

As a System Auditor / HR Administrator, I want employee organizational assignments to be strictly validated against local Setting projections without making synchronous cross-service database or HTTP calls, and with strict parent-child relationship enforcement (e.g., Department and Location must belong to the assigned Company).

**Why this priority**:
Ensures data integrity and service autonomy (polyrepo/microservice isolation) while preventing invalid cross-company assignments or broken organizational hierarchies.

**Independent Test**:
Can be tested by sending requests with invalid, cross-company, or non-existent Company/Department/Location/Grade/JobTitle IDs and asserting deterministic HTTP 400/404/409 errors with machine-readable error codes.

**Acceptance Scenarios**:

1. **Given** a request referencing a `companyId` that does not exist or is inactive in `company_projections`, **Then** the system rejects the request with HTTP `404 Not Found` and error code `COMPANY_NOT_FOUND`.
2. **Given** a request referencing a `departmentId` that exists but belongs to a different company than `companyId`, **Then** the system rejects the request with HTTP `400 Bad Request` and error code `INVALID_ORGANIZATION_ASSIGNMENT`.
3. **Given** a request referencing a `locationId` that exists but belongs to a different company than `companyId`, **Then** the system rejects the request with HTTP `400 Bad Request` and error code `INVALID_ORGANIZATION_ASSIGNMENT`.
4. **Given** a request where a referenced master entity is pending synchronization in Directory projections, **Then** the system rejects the request with HTTP `409 Conflict` and error code `SETTING_PROJECTION_NOT_READY`.

---

### User Story 3 - Uniqueness, Hierarchy, & Tenant Isolation Guardrails (Priority: P3)

As a Security and Compliance Officer, I want employee codes to be unique per tenant and manager assignments to be restricted to the same tenant and non-self references, ensuring full multi-tenant isolation.

**Why this priority**:
Prevents data leakage across tenants, duplicate personnel numbers, and invalid cyclic/self-referential reporting hierarchies.

**Independent Test**:
Can be tested by attempting duplicate `employeeCode` submissions, self-referencing managers, cross-tenant manager IDs, or spoofed `tenantId` in request bodies.

**Acceptance Scenarios**:

1. **Given** an existing employee with code `EMP-001` in tenant `TENANT_A`, **When** a user attempts to create another employee with code `EMP-001` in tenant `TENANT_A`, **Then** the system rejects the request with HTTP `409 Conflict` and error code `DUPLICATE_EMPLOYEE_CODE`.
2. **Given** an existing employee with code `EMP-001` in tenant `TENANT_B`, **When** creating an employee with code `EMP-001` in tenant `TENANT_A`, **Then** the creation succeeds without conflict.
3. **Given** an employee creation request where `managerId` references an employee in a different tenant or a non-existent employee, **Then** the system rejects the request with HTTP `404 Not Found` and error code `MANAGER_NOT_FOUND`.
4. **Given** a request body containing a `tenantCode` or `tenantId` different from the authenticated token context, **Then** the system ignores the body value and strictly scopes all operations to the authenticated tenant context.

---

### Edge Cases

- **Concurrent Duplicate Submission**: What happens when two identical creation requests with the same `employeeCode` arrive simultaneously?  
  *Handling*: Database unique index `uq_employees_tenant_employee_code` (`tenant_code`, `employee_code`) triggers a unique constraint violation, which the transactional error mapper translates into HTTP `409 Conflict` (`DUPLICATE_EMPLOYEE_CODE`).
- **Partial Failure during Multi-Entity Write**: What happens if `Employee` is inserted but `EmploymentAssignment` or outbox write fails?  
  *Handling*: All database operations run in a single atomic database transaction (`QueryRunner` / `runInTransaction`). Any failure triggers a complete rollback; no orphaned employee records are retained.
- **Self-referential Reporting**: What happens if `managerId` is set to the newly generated ID?  
  *Handling*: Manager ID is validated against existing persistent employee records prior to persistence and enforced by DB check constraint `manager_employee_id <> employee_id`.
- **Stale or Soft-Deleted Projection Reference**: What happens if a referenced department was soft-deleted or marked inactive in local projection?  
  *Handling*: Validation queries filter on `status = 'ACTIVE'` and `deleted_at IS NULL`, failing with `DEPARTMENT_NOT_FOUND` or `SETTING_PROJECTION_NOT_READY`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `POST /employees` endpoint accessible only to authenticated users with the `employee.create` permission.
- **FR-002**: System MUST strictly extract `tenantCode` / `tenantId` and `actorId` (`userId`) from the verified JWT authentication context and forbid client overrides in request payloads.
- **FR-003**: System MUST accept employee identity attributes: `employeeCode` (required), `firstName` (required), `lastName` (required), `middleName` (optional), `preferredName` (optional), `dateOfBirth` (optional), `gender` (optional), `avatarUrl` (optional), `personalEmail` (optional), `personalPhone` (optional), and `address` (optional).
- **FR-004**: System MUST accept employment attributes: `employmentType` (required, enum: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `TEMPORARY`, `INTERN`), `employmentStatus` (optional, default: `PENDING`), `joinedAt` (optional, hire date), `probationEndAt` (optional), and `endedAt` (optional).
- **FR-005**: System MUST accept organization assignment attributes: `companyId` (required), `locationId` (optional), `departmentId` (optional), `gradeId` (optional), `jobTitleId` (optional), `managerId` (optional), and `effectiveFrom` (optional, defaults to `joinedAt` or current date).
- **FR-006**: System MUST validate `companyId`, `locationId`, `departmentId`, `gradeId`, and `jobTitleId` solely against local Directory projections (`company_projections`, `location_projections`, `department_projections`, `grade_projections`, `job_title_projections`) without invoking Setting Service synchronous APIs or database connections.
- **FR-007**: System MUST validate that referenced `departmentId` and `locationId` belong to the specified `companyId` in the local projections.
- **FR-008**: System MUST validate that referenced `managerId` belongs to an active, existing employee within the same `tenantCode`.
- **FR-009**: System MUST atomically persist `EmployeeEntity`, `EmployeeProfileEntity`, and `EmploymentAssignmentEntity` within a single database transaction.
- **FR-010**: System MUST insert an outbox event `directory.employee.created` into the transactional outbox table within the same atomic database transaction.
- **FR-011**: System MUST return HTTP `201 Created` with the employee payload including nested resolved company, department, location, grade, and job title names from local projections.
- **FR-012**: System MUST return structured machine-readable error responses adhering to the enterprise `BaseException` format with standardized error codes:
  - `400 Bad Request`: `INVALID_REQUEST`, `INVALID_ORGANIZATION_ASSIGNMENT`
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `FORBIDDEN`
  - `404 Not Found`: `COMPANY_NOT_FOUND`, `LOCATION_NOT_FOUND`, `DEPARTMENT_NOT_FOUND`, `GRADE_NOT_FOUND`, `JOB_TITLE_NOT_FOUND`, `MANAGER_NOT_FOUND`
  - `409 Conflict`: `DUPLICATE_EMPLOYEE_CODE`, `SETTING_PROJECTION_NOT_READY`
- **FR-013**: System MUST record structured audit log entries for all employee creation events containing `actorId`, `tenantCode`, `employeeId`, `action = "EMPLOYEE_CREATED"`, `timestamp`, `requestId`, and `traceId`.

---

### Key Entities *(include if feature involves data)*

- **Employee**: Represents the central employee entity containing system status, employment type, employment status, timeline dates, and tenant context.
- **EmployeeProfile**: Represents the personal profile and identity attributes of an employee (names, date of birth, gender, contact details, address).
- **EmploymentAssignment**: Represents the organizational assignment linking the employee to Company, Location, Department, Grade, Job Title, and Reporting Manager with effective date intervals.
- **Setting Projections**: Local read models (`CompanyProjectionEntity`, `DepartmentProjectionEntity`, `LocationProjectionEntity`, `GradeProjectionEntity`, `JobTitleProjectionEntity`) maintained via asynchronous Kafka `setting.*` events.
- **Transactional Outbox**: Outbox table storing domain events (`directory.employee.created`) committed synchronously with database state changes for CDC (Debezium) dispatch to Kafka.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of employee creation requests execute within a single atomic transaction, guaranteeing zero partial or orphaned database records upon error.
- **SC-002**: 100% of organizational reference validations are executed locally against read projections with zero synchronous RPC or HTTP network calls to external microservices.
- **SC-003**: 100% of successful employee creation requests produce an immutable `directory.employee.created` outbox event in the same transaction.
- **SC-004**: Multi-tenant isolation is strictly verified: zero cross-tenant references (manager or employee code uniqueness collisions across distinct tenants) are permitted.
- **SC-005**: End-to-end API response time for `POST /employees` remains under 250ms under standard operational load.

---

## Assumptions

- **Tenant Resolution**: Tenant code and authenticated user identity are supplied by upstream gateway/auth middleware via RS256 JWT tokens and injected into NestJS `RequestContext` / `AsyncLocalStorage`.
- **Local Projection Synchronization**: Setting Service publishes `setting.company.*`, `setting.department.*`, `setting.location.*`, `setting.grade.*`, and `setting.job_title.*` Kafka events, which are consumed and projected into local tables by the Directory Provisioning Module (`specs/003-directory-provisioning`).
- **Event Dispatch Mechanism**: An Outbox worker or Debezium CDC connector reads committed entries from the outbox table and streams them to the Kafka topic for downstream consumers.
- **Effective Dating**: The initial assignment created upon employee creation has `effectiveFrom` set to the employee's `joinedAt` date (or current date) with `effectiveTo = null` (open-ended).

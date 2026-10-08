# Feature Specification: Update Employee Information API in Directory Service

**Feature Branch**: `006-update-employee-info`  
**Created**: 2026-10-08  
**Status**: Draft  
**Input**: User description: "Add api update informantion of employee"  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Update Employee Personal & Profile Information (Priority: P1)

As an HR Administrator or HR Manager, I want to update an existing employee's personal profile attributes (such as names, preferred name, contact details, date of birth, gender, and residential address) so that the employee's personal record remains accurate and up-to-date across the organization.

**Why this priority**:
Personal and contact details change frequently (e.g., legal name changes, moves, updated phone numbers). Enabling profile updates is the primary administrative maintenance capability required once an employee record is established.

**Independent Test**:
Can be fully tested by submitting a `PATCH /employees/{id}` request containing updated profile attributes (e.g., `preferredName`, `personalPhone`, `address`), verifying a `200 OK` response with the updated profile values, verifying persistence of the employee profile, and verifying the generation of a `directory.employee.updated` transactional outbox event.

**Acceptance Scenarios**:

1. **Given** an existing active employee in the authenticated tenant, **When** submitting a `PATCH /employees/{id}` request with modified profile fields (`preferredName`, `personalPhone`, `address`), **Then** the system updates only the specified profile fields while preserving unmodified fields, atomically writes a `directory.employee.updated` event to the outbox, and returns HTTP `200 OK` with the complete updated employee response.
2. **Given** an employee update request with partial fields, **When** fields are omitted from the request body, **Then** the existing stored values for the omitted fields remain unchanged.
3. **Given** an update request providing empty or null values for optional profile fields (e.g., clearing `middleName` or `personalPhone`), **When** submitted, **Then** the corresponding fields in the profile are updated to null/empty.

---

### User Story 2 - Update Employment Lifecycle & Timeline Attributes (Priority: P2)

As an HR Administrator, I want to update an employee's employment type, employment status, system status, and lifecycle milestone dates (such as probation end date, hire date adjustments, or termination end date) so that employment transitions are correctly tracked.

**Why this priority**:
Employees transition between lifecycle stages (e.g., from `PENDING` to `ACTIVE`, extending probation, or initiating resignation/termination). Accurate status and date records are essential for company policies and downstream integrations (e.g., payroll eligibility, access provisioning).

**Independent Test**:
Can be tested by submitting a `PATCH /employees/{id}` with updated `employmentStatus = ACTIVE`, `status = ACTIVE`, and `probationEndAt`, asserting that the employee record reflects the updated status values, verifying the date consistency constraint (`endedAt >= joinedAt`), and verifying outbox event emission.

**Acceptance Scenarios**:

1. **Given** an employee in `INVITED` or `PENDING` status, **When** an HR Administrator updates `status` to `ACTIVE` and `employmentStatus` to `ACTIVE`, **Then** the system updates the employee lifecycle state, persists the change, and emits `directory.employee.updated`.
2. **Given** an employee update request where `endedAt` is earlier than `joinedAt`, **Then** the system rejects the request with HTTP `400 Bad Request` and error code `INVALID_EMPLOYMENT_DATES`.
3. **Given** an update request attempting to modify `employeeCode`, **Then** the system rejects the modification with HTTP `400 Bad Request` and error code `EMPLOYEE_CODE_IMMUTABLE`.

---

### User Story 3 - Update Organizational Assignment & Reporting Line (Priority: P3)

As an HR Administrator, I want to update an employee's organizational placement (Department, Location, Grade, Job Title, or Reporting Manager) so that internal transfers, promotions, and organizational restructuring are accurately maintained in the Directory Service.

**Why this priority**:
Organizational mobility (department transfers, manager reassignments, job title updates) is a frequent enterprise workflow. Assignments must be validated against local projections without cross-service latency and must prevent self-reporting or invalid cross-company assignments.

**Independent Test**:
Can be tested by submitting a `PATCH /employees/{id}` with new `departmentId` and `managerId`, verifying that the active assignment is updated, verifying that invalid or cross-company department IDs return HTTP 400, and asserting that cyclic or self-reporting manager assignments are blocked.

**Acceptance Scenarios**:

1. **Given** a valid existing employee and valid active Setting projections within the same company, **When** submitting updated assignment fields (`departmentId`, `locationId`, `jobTitleId`, `gradeId`), **Then** the system validates that all entities belong to the employee's assigned company in local projections, updates the active assignment, and returns HTTP `200 OK` with the resolved entity names.
2. **Given** an update request with a `managerId` referencing the employee themselves, **Then** the system rejects the request with HTTP `400 Bad Request` and error code `CANNOT_REPORT_TO_SELF`.
3. **Given** an update request with a `managerId` referencing a non-existent employee or an employee in a different tenant, **Then** the system rejects the request with HTTP `404 Not Found` and error code `MANAGER_NOT_FOUND`.
4. **Given** an update request referencing a `departmentId` or `locationId` that belongs to a different company, **Then** the system rejects the request with HTTP `400 Bad Request` and error code `INVALID_ORGANIZATION_ASSIGNMENT`.

---

### Edge Cases

- **Target Employee Not Found or Foreign Tenant**: What happens if the requested `id` does not exist or belongs to another tenant?  
  *Handling*: Lookups are scoped strictly by `tenantCode` and `id`. If no record is found, the system returns HTTP `404 Not Found` with error code `EMPLOYEE_NOT_FOUND`, preventing cross-tenant leakage.
- **Concurrent Update Collisions**: What happens if two administrators update the same employee simultaneously?  
  *Handling*: Optimistic concurrency control or row-level transactional locking ensures atomicity. If an optimistic lock conflict occurs, the system aborts the transaction and returns HTTP `409 Conflict` (`CONCURRENT_MODIFICATION`).
- **Partial Failure during Multi-Entity Update**: What happens if updating core employee records succeeds but updating profile or writing to the outbox fails?  
  *Handling*: All updates (`Employee`, `EmployeeProfile`, `EmploymentAssignment`, and outbox event) execute inside an explicit atomic database transaction. Any failure triggers a complete rollback; no partial state is persisted.
- **Reporting Hierarchy Loops**: What happens if updating an employee's manager creates an immediate reporting cycle (e.g., A reports to B, and B is updated to report to A)?  
  *Handling*: The manager validator checks for immediate circular reporting hierarchies and rejects the request with HTTP `400 Bad Request` (`CIRCULAR_REPORTING_HIERARCHY`).
- **Empty Update Payload**: What happens if an update request is sent with an empty JSON body `{}`?  
  *Handling*: The request is validated; if no fields are provided to update, the system returns HTTP `400 Bad Request` (`EMPTY_UPDATE_PAYLOAD`).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `PATCH /employees/:id` endpoint accessible only to authenticated users with the `employee.update` permission.
- **FR-002**: System MUST validate that the path parameter `:id` is a valid identifier (UUID).
- **FR-003**: System MUST strictly extract `tenantCode` and `actorId` from the verified authentication context and prohibit client overrides in request payloads or URL parameters.
- **FR-004**: System MUST verify that the target employee exists within the authenticated `tenantCode`, returning HTTP `404 Not Found` with error code `EMPLOYEE_NOT_FOUND` if not found.
- **FR-005**: System MUST accept partial profile updates: `firstName` (optional string, max 100), `lastName` (optional string, max 100), `middleName` (optional nullable string, max 100), `preferredName` (optional nullable string, max 100), `dateOfBirth` (optional nullable date string), `gender` (optional nullable string, max 32), `avatarUrl` (optional nullable string), `personalEmail` (optional nullable email string, max 320), `personalPhone` (optional nullable string, max 64), and `address` (optional nullable Address object).
- **FR-006**: System MUST accept partial employment updates: `employmentType` (optional enum: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `TEMPORARY`, `INTERN`), `employmentStatus` (optional enum: `PENDING`, `ACTIVE`, `PROBATION`, `NOTICE_PERIOD`, `TERMINATED`), `status` (optional enum: `INVITED`, `ACTIVE`, `INACTIVE`, `TERMINATED`, `SUSPENDED`), `joinedAt` (optional nullable date string), `probationEndAt` (optional nullable date string), and `endedAt` (optional nullable date string).
- **FR-007**: System MUST validate that if both `joinedAt` and `endedAt` are present on the employee (either from existing state or the update payload), `endedAt` MUST be greater than or equal to `joinedAt`.
- **FR-008**: System MUST treat `employeeCode` as immutable; update payloads MUST NOT modify `employeeCode`.
- **FR-009**: System MUST accept partial organizational assignment updates: `companyId` (optional UUID), `locationId` (optional nullable UUID), `departmentId` (optional nullable UUID), `gradeId` (optional nullable UUID), `jobTitleId` (optional nullable UUID), and `managerId` (optional nullable UUID).
- **FR-010**: System MUST validate organizational references (`companyId`, `locationId`, `departmentId`, `gradeId`, `jobTitleId`) solely against local Directory projections (`company_projections`, `location_projections`, `department_projections`, `grade_projections`, `job_title_projections`) without synchronous cross-service RPC or HTTP calls.
- **FR-011**: System MUST validate that any updated `departmentId` and `locationId` belong to the effective `companyId` in local projections.
- **FR-012**: System MUST validate that if `managerId` is supplied, it references an existing active employee within the same `tenantCode`, is not equal to the target employee's `id`, and does not introduce a direct circular reporting relationship.
- **FR-013**: System MUST execute updates across `Employee`, `EmployeeProfile`, and `EmploymentAssignment` records within a single atomic database transaction.
- **FR-014**: System MUST insert an outbox event `directory.employee.updated` into the transactional outbox table within the same atomic database transaction.
- **FR-015**: System MUST record structured audit log entries for all employee update operations containing `actorId`, `tenantCode`, `employeeId`, `action = "EMPLOYEE_UPDATED"`, `timestamp`, `requestId`, and `traceId`.
- **FR-016**: System MUST return HTTP `200 OK` with the complete updated employee response payload, including resolved organizational names from local projections and resolved manager details.
- **FR-017**: System MUST return standardized machine-readable error responses adhering to the enterprise exception structure with appropriate error codes:
  - `400 Bad Request`: `INVALID_REQUEST`, `EMPTY_UPDATE_PAYLOAD`, `INVALID_ORGANIZATION_ASSIGNMENT`, `INVALID_EMPLOYMENT_DATES`, `CANNOT_REPORT_TO_SELF`, `CIRCULAR_REPORTING_HIERARCHY`, `EMPLOYEE_CODE_IMMUTABLE`
  - `401 Unauthorized`: `UNAUTHORIZED`
  - `403 Forbidden`: `FORBIDDEN`
  - `404 Not Found`: `EMPLOYEE_NOT_FOUND`, `COMPANY_NOT_FOUND`, `LOCATION_NOT_FOUND`, `DEPARTMENT_NOT_FOUND`, `GRADE_NOT_FOUND`, `JOB_TITLE_NOT_FOUND`, `MANAGER_NOT_FOUND`
  - `409 Conflict`: `CONCURRENT_MODIFICATION`, `SETTING_PROJECTION_NOT_READY`

---

### Key Entities *(include if feature involves data)*

- **Employee**: Central employee entity containing status, employment type, employment status, timeline dates, and tenant context.
- **EmployeeProfile**: Personal profile entity storing demographic and contact attributes (`firstName`, `lastName`, `preferredName`, `dateOfBirth`, `gender`, `personalEmail`, `personalPhone`, `address`, `avatarUrl`) linked to Employee via a one-to-one relationship.
- **EmploymentAssignment**: Current organizational assignment linking the employee to `companyId`, `departmentId`, `locationId`, `gradeId`, `jobTitleId`, and `managerEmployeeId` with open-ended effective dates representing the active assignment.
- **Setting Projections**: Local read models (`company_projections`, `department_projections`, `location_projections`, `grade_projections`, `job_title_projections`) asynchronously synchronized from Setting Service domain events.
- **Transactional Outbox**: Stores the domain event `directory.employee.updated` within the same transaction to guarantee reliable asynchronous event publishing to downstream consumers.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of employee update requests execute within a single atomic database transaction, guaranteeing zero partial or inconsistent updates across profile, employee, assignment, and outbox records.
- **SC-002**: 100% of organizational reference validations are executed locally against read projections with zero synchronous RPC or HTTP network calls to external microservices.
- **SC-003**: 100% of successful employee updates generate an immutable `directory.employee.updated` outbox event within the same database transaction.
- **SC-004**: Multi-tenant isolation is strictly preserved: zero cross-tenant modifications are permitted, and requests targeting records outside the authenticated tenant return HTTP `404 Not Found`.
- **SC-005**: End-to-end API response time for `PATCH /employees/:id` remains under 250ms under standard operational load.
- **SC-006**: Unmodified fields retain their existing values in 100% of partial update requests.

---

## Assumptions

- **Authentication & Tenant Context**: Upstream authentication middleware verifies JWT RS256 tokens and populates `tenantCode` and user identity in the request context.
- **Partial Update Semantics**: The API uses HTTP `PATCH` for partial attribute updates, where omitted fields remain unchanged, while explicitly passed `null` values clear nullable attributes.
- **Immutability of Employee Code**: `employeeCode` is immutable via this general update endpoint to preserve audit trails, integrations with payroll, and contractual bindings.
- **Assignment Mutation Model**: For the scope of this API, updating organizational assignment fields modifies the currently active assignment record (`effectiveTo IS NULL`). Formal historic effective-dated transfer workflows (creating new assignment intervals) are handled via a dedicated organizational transfer workflow.
- **Event Dispatching**: Committed outbox events are dispatched asynchronously by an existing outbox worker or CDC pipeline to messaging topics.
- **Local Projections Freshness**: Setting projections are kept up to date by event consumers; any projection that does not yet exist locally returns HTTP `409 Conflict` (`SETTING_PROJECTION_NOT_READY`).

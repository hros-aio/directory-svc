# Research: Create Employee API in Directory Service

**Feature Branch**: `004-create-employee-api`  
**Date**: 2026-09-26  

---

## 1. Domain Ownership & Boundaries

- **Setting Service**: Master data authority for `Company`, `Location`, `Department`, `Grade`, and `JobTitle`. Emits `setting.*` events consumed by Directory Service Provisioning module.
- **Directory Service**: Master data authority for `Employee`, `EmployeeProfile`, and `EmploymentAssignment`. Maintains read projections of Setting entities (`company_projections`, `department_projections`, `location_projections`, `grade_projections`, `job_title_projections`).
- **Access Rule**: Directory Service MUST NOT access Setting Service database or synchronously call Setting HTTP APIs for employee creation. All validation is executed locally against synchronized projections.

---

## 2. Request & Response Lifecycle

```text
Admin / HR User
      │
      │ POST /employees
      ▼
EmployeeController (@Permissions('employee.create'), @UseGuards(AuthGuard, PermissionGuard))
      │
      ├── RequestContext / AsyncLocalStorage (tenantCode, userId, traceId)
      │
      ▼
EmployeeService.createEmployee(dto, context)
      │
      ├── 1. Format & normalize employeeCode
      ├── 2. Validate Setting references via local projection repositories:
      │      - Company exists & status = ACTIVE
      │      - Department exists, status = ACTIVE & companyId matches
      │      - Location exists, status = ACTIVE & companyId matches
      │      - Grade exists & status = ACTIVE
      │      - JobTitle exists & status = ACTIVE
      ├── 3. Validate managerEmployeeId (exists in tenant, not self, active)
      │
      ├── 4. Begin DB Transaction (TransactionService / runInTransaction)
      │      ├── Insert EmployeeEntity
      │      ├── Insert EmployeeProfileEntity
      │      ├── Insert EmploymentAssignmentEntity
      │      └── Insert OutboxEventEntity ('directory.employee.created')
      │      └── Commit DB Transaction
      │
      ▼
Return EmployeeResponseDto (HTTP 201 Created)
      │
      ▼ (Asynchronous / Post-Commit)
Outbox / Debezium CDC ──► Kafka Topic: directory.events ──► Downstream Consumers
```

---

## 3. Error Handling Hierarchy

All errors map to `BaseException` derivatives in `@new-hros/libs-apis` and `@new-hros/libs-core`:

| Error Code | HTTP Status | Exception Class | Trigger Condition |
|---|---|---|---|
| `INVALID_REQUEST` | 400 Bad Request | `ValidationException` | DTO validation failure (missing required fields, malformed formats) |
| `INVALID_ORGANIZATION_ASSIGNMENT` | 400 Bad Request | `BusinessException` | Department or Location does not belong to specified Company |
| `UNAUTHORIZED` | 401 Unauthorized | `UnauthorizedException` | Missing or invalid RS256 JWT token |
| `FORBIDDEN` | 403 Forbidden | `ForbiddenException` | Missing required `employee.create` permission |
| `COMPANY_NOT_FOUND` | 404 Not Found | `NotFoundException` | `companyId` not found in `company_projections` for tenant |
| `LOCATION_NOT_FOUND` | 404 Not Found | `NotFoundException` | `locationId` not found in `location_projections` for tenant |
| `DEPARTMENT_NOT_FOUND` | 404 Not Found | `NotFoundException` | `departmentId` not found in `department_projections` for tenant |
| `GRADE_NOT_FOUND` | 404 Not Found | `NotFoundException` | `gradeId` not found in `grade_projections` for tenant |
| `JOB_TITLE_NOT_FOUND` | 404 Not Found | `NotFoundException` | `jobTitleId` not found in `job_title_projections` for tenant |
| `MANAGER_NOT_FOUND` | 404 Not Found | `NotFoundException` | `managerId` not found in `employees` for tenant |
| `INVALID_MANAGER` | 400 Bad Request | `BusinessException` | Manager is self-referential or inactive |
| `DUPLICATE_EMPLOYEE_CODE` | 409 Conflict | `ConflictException` | Unique constraint violation on `(tenant_code, employee_code)` |
| `SETTING_PROJECTION_NOT_READY` | 409 Conflict | `ConflictException` | Referenced Setting entity is pending synchronization |

---

## 4. Multi-Tenant Isolation & Transactional Outbox

- **Tenant Isolation**: `tenantCode` is resolved strictly from `RequestContext` (`AsyncLocalStorage`) populated by auth middleware. DTO cannot override `tenantCode`. All queries and repository operations are bound to `tenantCode`.
- **Atomic Transaction**: Multi-entity write (`EmployeeEntity`, `EmployeeProfileEntity`, `EmploymentAssignmentEntity`, `OutboxEventEntity`) is executed atomically inside `transactionService.runInTransaction(...)`.
- **Outbox Pattern**: `OutboxEventEntity` stores the `directory.employee.created` payload in the same transaction. Debezium CDC / Kafka publisher reads from `outbox_events` and emits to Kafka topic `directory.events`.

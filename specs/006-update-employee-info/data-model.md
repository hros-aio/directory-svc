# Data Model: Update Employee Information API

**Feature Branch**: `006-update-employee-info`  
**Date**: 2026-10-08  
**Feature**: [specs/006-update-employee-info/spec.md](spec.md)  

---

## 1. Entity Models & Database Mapping

The update operation operates across three core domain tables and one transactional infrastructure table in the Directory Service schema:

```text
┌────────────────────────┐         1:1         ┌────────────────────────┐
│     EmployeeEntity     │ ─────────────────── │  EmployeeProfileEntity │
│      (employees)       │                     │  (employee_profiles)   │
└────────────────────────┘                     └────────────────────────┘
            │
            │ 1:N
            ▼
┌────────────────────────┐                     ┌────────────────────────┐
│EmploymentAssignmentEnt │                     │   OutboxEventEntity    │
│(employment_assignments)│                     │    (outbox_events)     │
└────────────────────────┘                     └────────────────────────┘
```

---

### 1.1 `EmployeeEntity` (`employees`)

Represents the core employment aggregate root.

| Column | Type | Nullable | Mutable via PATCH? | Constraints / Notes |
|---|---|---|---|---|
| `id` | `uuid` | No | No | Primary Key |
| `tenant_code` | `varchar(64)` | No | No | Tenant isolation, derived from JWT |
| `employee_code` | `varchar(64)` | No | **No (Immutable)** | Unique per tenant (`uq_employees_tenant_employee_code`) |
| `employment_type` | `enum(employment_type)` | No | Yes | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `TEMPORARY`, `INTERN` |
| `employment_status` | `enum(employment_status)` | No | Yes | `PENDING`, `ACTIVE`, `PROBATION`, `NOTICE_PERIOD`, `TERMINATED` |
| `status` | `enum(employee_status)` | No | Yes | `INVITED`, `ACTIVE`, `INACTIVE`, `TERMINATED`, `SUSPENDED` |
| `joined_at` | `timestamptz` | Yes | Yes | Hire / start date |
| `probation_end_at` | `timestamptz` | Yes | Yes | Probation completion milestone |
| `ended_at` | `timestamptz` | Yes | Yes | End / termination date. Check constraint: `ended_at IS NULL OR joined_at IS NULL OR ended_at >= joined_at` |
| `created_at` | `timestamptz` | No | No | Auto-generated timestamp |
| `updated_at` | `timestamptz` | No | Auto | Auto-updated timestamp on modification |
| `deleted_at` | `timestamptz` | Yes | No | Soft-delete timestamp |

---

### 1.2 `EmployeeProfileEntity` (`employee_profiles`)

Represents the personal profile and contact details of the employee.

| Column | Type | Nullable | Mutable via PATCH? | Constraints / Notes |
|---|---|---|---|---|
| `employee_id` | `uuid` | No | No | Primary Key & Foreign Key to `employees.id` (`CASCADE`) |
| `tenant_code` | `varchar(64)` | No | No | Tenant isolation |
| `first_name` | `varchar(100)` | No | Yes | Max 100 characters |
| `middle_name` | `varchar(100)` | Yes | Yes | Optional, can be cleared to `null` |
| `last_name` | `varchar(100)` | No | Yes | Max 100 characters |
| `preferred_name`| `varchar(100)` | Yes | Yes | Optional, can be cleared to `null` |
| `date_of_birth` | `date` | Yes | Yes | ISO 8601 date |
| `gender` | `varchar(32)` | Yes | Yes | Optional string |
| `avatar_url` | `text` | Yes | Yes | URI format |
| `personal_email`| `varchar(320)` | Yes | Yes | Valid email format |
| `personal_phone`| `varchar(64)` | Yes | Yes | Phone string |
| `address` | `jsonb` | Yes | Yes | Structured address object: `{ street, addressLine2, city, stateOrProvince, postalCode, countryCode }` |
| `updated_at` | `timestamptz` | No | Auto | Auto-updated timestamp |

---

### 1.3 `EmploymentAssignmentEntity` (`employment_assignments`)

Represents organizational placement and reporting hierarchy. The update targets the employee's active assignment (`where effective_to IS NULL`).

| Column | Type | Nullable | Mutable via PATCH? | Constraints / Notes |
|---|---|---|---|---|
| `id` | `uuid` | No | No | Primary Key |
| `tenant_code` | `varchar(64)` | No | No | Tenant isolation |
| `employee_id` | `uuid` | No | No | Foreign Key to `employees.id` |
| `company_id` | `uuid` | No | Yes | References `company_projections.id` (Status = `ACTIVE`) |
| `location_id` | `uuid` | Yes | Yes | References `location_projections.id` (Must belong to `company_id`) |
| `department_id` | `uuid` | Yes | Yes | References `department_projections.id` (Must belong to `company_id`) |
| `job_title_id` | `uuid` | Yes | Yes | References `job_title_projections.id` |
| `grade_id` | `uuid` | Yes | Yes | References `grade_projections.id` |
| `manager_employee_id` | `uuid` | Yes | Yes | References `employees.id`. Cannot equal `employee_id`; cannot be circular |
| `effective_from` | `date` | No | Yes | Start date of assignment |
| `effective_to` | `date` | Yes | No | `NULL` signifies current active assignment |
| `updated_at` | `timestamptz` | No | Auto | Auto-updated timestamp |

---

### 1.4 `OutboxEventEntity` (`outbox_events`)

Synchronously committed domain event for downstream Kafka consumption.

| Field | Value | Notes |
|---|---|---|
| `tenant_code` | `<tenantCode>` | Scoped to current tenant |
| `aggregate_type` | `'EMPLOYEE'` | Entity aggregate identifier |
| `aggregate_id` | `<employee.id>` | Employee UUID |
| `event_type` | `'directory.employee.updated'` | Domain event routing topic |
| `event_version` | `1` | Semantic event schema version |
| `payload` | `JSONB` | Serialized employee + assignment snapshot |
| `status` | `'PENDING'` | Ready for CDC dispatch |

**Payload Schema**:
```json
{
  "employeeId": "uuid",
  "tenantCode": "string",
  "employeeCode": "string",
  "status": "string",
  "employmentType": "string",
  "employmentStatus": "string",
  "companyId": "uuid",
  "locationId": "uuid | null",
  "departmentId": "uuid | null",
  "gradeId": "uuid | null",
  "jobTitleId": "uuid | null",
  "managerId": "uuid | null",
  "joinedAt": "ISO8601 string | null",
  "updatedAt": "ISO8601 string"
}
```

---

## 2. Validation Rules & Data Invariants

1. **Empty Payload Rejection**:
   - If incoming request body has zero defined properties or all fields are undefined, the system rejects with `400 Bad Request` (`EMPTY_UPDATE_PAYLOAD`).
2. **Employee Code Immutability**:
   - If `employeeCode` is present in the request body, the system returns `400 Bad Request` (`EMPLOYEE_CODE_IMMUTABLE`).
3. **Date Consistency Invariant**:
   - Effective `endedAt` must be `>=` effective `joinedAt`. Effective values are derived from merging the patch payload with the existing employee state.
4. **Organizational Hierarchy & Company Boundary**:
   - If `departmentId` is updated: Must belong to effective `companyId`.
   - If `locationId` is updated: Must belong to effective `companyId`.
   - If `companyId` is changed: Any updated or existing `departmentId` / `locationId` must be verified against the new `companyId`.
5. **Manager Invariants**:
   - `managerId !== employeeId` (`CANNOT_REPORT_TO_SELF`).
   - `managerId` must belong to an active, non-terminated employee in the same tenant (`MANAGER_NOT_FOUND` / `INVALID_MANAGER`).
   - 1-hop circular check: `manager.currentAssignment.managerEmployeeId !== employeeId` (`CIRCULAR_REPORTING_HIERARCHY`).

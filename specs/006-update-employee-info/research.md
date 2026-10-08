# Research & Architectural Decisions: Update Employee Information API

**Feature Branch**: `006-update-employee-info`  
**Date**: 2026-10-08  
**Feature**: [specs/006-update-employee-info/spec.md](spec.md)  

---

## 1. HTTP Verb & API Design Semantics

### Decision
Use `PATCH /employees/:id` with partial JSON payload support.

### Rationale
- **Partial Update Compatibility**: Employees have extensive attributes spanning profile demographics, contact details, employment status, and organizational assignment. A `PATCH` endpoint allows clients (e.g., HR portals, onboarding workflows) to modify only the fields that changed without sending the entire resource.
- **REST Conformance**: Conforms to standard HTTP RFC 5789 semantics for partial modifications.
- **Preservation of Omitted Attributes**: Any attribute omitted from the JSON payload remains untouched in the database. Explicitly supplying `null` for optional/nullable fields clears those values.

### Alternatives Considered
- `PUT /employees/:id`: Requires clients to submit full entity representations. Omitted fields would have to be erased or would lead to accidental data loss.
- Sub-resource endpoints (e.g., `PATCH /employees/:id/profile`, `PATCH /employees/:id/assignment`, `PATCH /employees/:id/employment`): While modular, common HR administrative workflows (such as probation confirmation + title change + salary/status change) require updating multiple domains in a single atomic transaction. Fragmenting into multiple HTTP requests creates network chatty-ness and breaks transaction atomicity across related fields.

---

## 2. Organizational Reference Validation for Partial Payloads

### Decision
Support partial reference updates by merging incoming reference fields with the employee's existing active assignment (`effectiveTo IS NULL`).

### Rationale
- If the caller supplies a new `departmentId` without specifying `companyId`, the system validates the new department against the employee's existing `companyId` in local projections (`company_projections`, `department_projections`).
- If the caller supplies a new `companyId`, any simultaneously provided `departmentId` and `locationId` (or existing ones if unchanged) are validated to ensure they belong to the new company.
- Projections are checked strictly in the local database, preserving Polyrepo Domain Isolation (Principle III).

### Alternatives Considered
- **Mandatory Company ID**: Require `companyId` on every assignment-related update. Rejected because it forces clients updating only a department or job title to redundantly look up and send `companyId`.
- **Synchronous HTTP calls to Setting Service**: Rejected because it violates polyrepo domain boundaries, introduces cross-service latency, and introduces a single point of failure.

---

## 3. Reporting Hierarchy & Circular Management Protection

### Decision
Enforce two-tier manager validation:
1. **Self-Reference Guard**: Prohibit `managerId === employeeId` returning HTTP `400 Bad Request` (`CANNOT_REPORT_TO_SELF`).
2. **Immediate Loop Detection**: If employee A's manager is set to B, verify that B's current active assignment does not have `managerEmployeeId === A.id`. If detected, reject with HTTP `400 Bad Request` (`CIRCULAR_REPORTING_HIERARCHY`).
3. **Tenant & Eligibility Guard**: Manager must exist in the same tenant, be non-terminated, and active in employment status (`MANAGER_NOT_FOUND` / `INVALID_MANAGER`).

### Rationale
Prevents broken organizational reporting trees and infinite loops in hierarchy traversals while remaining lightweight and deterministic in synchronous REST request lifecycles.

### Alternatives Considered
- **Unconstrained Updates**: Relying solely on asynchronous integrity checks. Rejected because invalid manager cycles cause immediate failures in approval workflows (leave, expense approvals).
- **Full Recursive Graph Cycle Traversal**: Scanning the entire corporate ancestor tree on every manager update. Rejected as unnecessary overhead for standard 1-level updates; 1-hop loop prevention solves >95% of accidental hierarchy corruptions without deep recursive DB locks.

---

## 4. Current Assignment Mutation vs Effective-Dated History

### Decision
Mutate the employee's current active assignment record (`effectiveTo IS NULL`) in place.

### Rationale
- The directory service model represents the current active organizational placement using `EmploymentAssignmentEntity` where `effectiveTo IS NULL`.
- Administrative updates (correcting typos, minor title corrections, initial manager assignment) should not generate new historic assignment slices.
- Formal historic job transfer workflows (e.g., promotions with effective dates, cross-company transfers) will be handled in a dedicated transfer module.

### Alternatives Considered
- **Always Create New Assignment Slice**: Close current assignment with `effectiveTo = today` and insert a new assignment record on every PATCH. Rejected because casual profile/title edits would create fragmented, noisy assignment histories without business justification.

---

## 5. Atomicity & Outbox Event Emission

### Decision
Execute `EmployeeEntity` update, `EmployeeProfileEntity` update, `EmploymentAssignmentEntity` update, and transactional outbox event insertion (`directory.employee.updated`) inside an explicit transaction via `TransactionService.runInTransaction`.

### Rationale
- Complies strictly with Constitution Principle I (Clean Architecture) and Principle IV (Data Integrity & Transactions).
- Guarantees zero partial persistence (e.g., profile updated but assignment failed).
- Guarantees at-least-once asynchronous event dispatching for downstream services via Debezium CDC / Kafka without dual-write hazards.

### Alternatives Considered
- Publishing directly to Kafka inside the service: Rejected due to the Dual-Write Problem (database might commit but Kafka publish fails, or vice-versa).
- NestJS internal Event Emitter: Rejected because in-memory events do not survive service crashes and cannot communicate with other microservices.

# Quickstart Validation Guide: Update Employee Information API

**Feature Branch**: `006-update-employee-info`  
**Date**: 2026-10-08  
**Feature**: [specs/006-update-employee-info/spec.md](spec.md)  
**Contract**: [specs/006-update-employee-info/contracts/update-employee-api.md](contracts/update-employee-api.md)  
**Data Model**: [specs/006-update-employee-info/data-model.md](data-model.md)  

---

## 1. Prerequisites & Environment Setup

Ensure the local development environment and database containers are up and running:

```bash
# 1. Start PostgreSQL and Redis infrastructure (if running via docker-compose)
docker-compose up -d postgres redis

# 2. Run pending database migrations
pnpm run migration:run

# 3. Start Directory Service in development mode
pnpm run start:dev
```

Test requests require an authentication token containing:
- Tenant Code: `CORP-DEFAULT`
- User ID: `00000000-0000-0000-0000-000000000001`
- Permission: `employee.update`

---

## 2. Validation Scenarios

### Scenario 1: Partial Profile Update (Names, Phone, Address)

**Goal**: Verify that updating personal attributes modifies only the supplied fields and preserves unmodified existing fields.

```bash
curl -X PATCH "http://localhost:3000/api/v1/employees/${EMPLOYEE_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredName": "Alex",
    "personalPhone": "+1-555-888-9999",
    "address": {
      "street": "456 Innovation Way",
      "city": "Austin",
      "stateOrProvince": "Texas",
      "postalCode": "78701",
      "countryCode": "US"
    }
  }'
```

**Expected Outcome**:
- Status: `200 OK`
- `profile.preferredName` = `"Alex"`
- `profile.personalPhone` = `"+1-555-888-9999"`
- `profile.firstName` and other unmentioned attributes retain their previous values
- Database: Outbox record created with `event_type = 'directory.employee.updated'`

---

### Scenario 2: Employment Status Transition & Date Validation

**Goal**: Verify lifecycle updates from `INVITED` / `PENDING` to `ACTIVE`, and ensure date sanity rules are enforced.

```bash
# Valid Status Activation
curl -X PATCH "http://localhost:3000/api/v1/employees/${EMPLOYEE_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "employmentStatus": "ACTIVE",
    "joinedAt": "2026-10-01T00:00:00Z"
  }'

# Invalid Date Validation: endedAt earlier than joinedAt
curl -X PATCH "http://localhost:3000/api/v1/employees/${EMPLOYEE_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "endedAt": "2026-09-01T00:00:00Z"
  }'
```

**Expected Outcome**:
- Valid Activation: Status `200 OK` with updated status fields.
- Invalid Date: Status `400 Bad Request` with error code `INVALID_EMPLOYMENT_DATES`.

---

### Scenario 3: Organizational Assignment & Manager Validation

**Goal**: Verify departmental transfer, manager assignment, and anti-loop guards.

```bash
# Self-Manager Guard
curl -X PATCH "http://localhost:3000/api/v1/employees/${EMPLOYEE_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "managerId": "'"${EMPLOYEE_ID}"'"
  }'

# Valid Department & Manager Update
curl -X PATCH "http://localhost:3000/api/v1/employees/${EMPLOYEE_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "'"${VALID_DEPT_ID}"'",
    "managerId": "'"${VALID_MANAGER_ID}"'"
  }'
```

**Expected Outcome**:
- Self-Manager: Status `400 Bad Request` with error code `CANNOT_REPORT_TO_SELF`.
- Valid Update: Status `200 OK` with resolved department and manager names returned in `currentAssignment`.

---

## 3. Automated Test Suite Execution

Run unit and integration suites to verify end-to-end functionality:

```bash
# 1. Run unit tests for employee service, controller, and validators
pnpm test src/modules/employee

# 2. Run coverage verification (enforces Constitution quality thresholds: 90% statements / 85% branches)
pnpm test:cov -- src/modules/employee
```

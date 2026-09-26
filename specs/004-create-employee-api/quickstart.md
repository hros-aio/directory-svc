# Quickstart: Create Employee API

**Feature Branch**: `004-create-employee-api`  
**Date**: 2026-09-26  

---

## 1. Prerequisites

- PostgreSQL instance running with latest migrations applied.
- Authenticated JWT token containing `tenantCode`, `sub` (`userId`), and `permissions` including `employee.create`.
- Local projection tables populated with valid `company_projections`, `department_projections`, `location_projections`, `grade_projections`, and `job_title_projections`.

---

## 2. API Request Example

```http
POST /api/v1/employees HTTP/1.1
Host: localhost:3000
Authorization: Bearer <JWT_RS256_TOKEN>
X-Tenant-Id: tenant-corp-001
Content-Type: application/json

{
  "employeeCode": "EMP-2026-001",
  "firstName": "Jane",
  "lastName": "Doe",
  "middleName": "Alexander",
  "preferredName": "Jane",
  "dateOfBirth": "1992-05-15",
  "gender": "FEMALE",
  "personalEmail": "jane.doe@example.com",
  "personalPhone": "+1-555-0199",
  "employmentType": "FULL_TIME",
  "employmentStatus": "PENDING",
  "joinedAt": "2026-10-01T00:00:00Z",
  "companyId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "departmentId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "locationId": "2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "gradeId": "3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "jobTitleId": "4e9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
}
```

---

## 3. Success Response Example (HTTP 201 Created)

```json
{
  "id": "e4eaaaf2-d142-11e1-b3e4-080027620cdd",
  "tenantCode": "tenant-corp-001",
  "employeeCode": "EMP-2026-001",
  "status": "INVITED",
  "employmentType": "FULL_TIME",
  "employmentStatus": "PENDING",
  "joinedAt": "2026-10-01T00:00:00.000Z",
  "probationEndAt": null,
  "endedAt": null,
  "createdAt": "2026-09-26T14:50:00.000Z",
  "updatedAt": "2026-09-26T14:50:00.000Z",
  "profile": {
    "firstName": "Jane",
    "middleName": "Alexander",
    "lastName": "Doe",
    "preferredName": "Jane",
    "fullName": "Jane Alexander Doe",
    "dateOfBirth": "1992-05-15",
    "gender": "FEMALE",
    "avatarUrl": null,
    "personalEmail": "jane.doe@example.com",
    "personalPhone": "+1-555-0199",
    "address": null
  },
  "currentAssignment": {
    "id": "a5eaaaf2-d142-11e1-b3e4-080027620cdd",
    "effectiveFrom": "2026-10-01",
    "effectiveTo": null,
    "company": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Acme Holdings Pte Ltd"
    },
    "department": {
      "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "name": "Engineering"
    },
    "location": {
      "id": "2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "name": "Singapore Headquarters"
    },
    "grade": {
      "id": "3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "name": "Senior IC"
    },
    "jobTitle": {
      "id": "4e9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "name": "Staff Software Engineer"
    },
    "manager": null
  }
}
```

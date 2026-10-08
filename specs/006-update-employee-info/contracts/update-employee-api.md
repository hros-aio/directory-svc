# API Contract: Update Employee Information

**Service**: Directory Service (`directory-svc`)  
**Feature Branch**: `006-update-employee-info`  
**Endpoint**: `PATCH /employees/:id`  
**Permission Required**: `employee.update`  

---

## 1. Request Specification

### HTTP Method & URI
```http
PATCH /employees/{id} HTTP/1.1
Host: api.hros.example.com
Authorization: Bearer <RS256-JWT>
Content-Type: application/json
X-Request-Id: 7d6c38b2-5a40-4dc9-9851-92b005118ea0
```

### Path Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `string (UUIDv4)` | Yes | Unique identifier of the employee within the tenant |

### Request Body Schema (`UpdateEmployeeDto`)

All fields are optional. Unspecified fields remain unchanged.

```json
{
  "firstName": "string (optional, max 100)",
  "lastName": "string (optional, max 100)",
  "middleName": "string | null (optional, max 100)",
  "preferredName": "string | null (optional, max 100)",
  "dateOfBirth": "string | null (optional, ISO 8601 date YYYY-MM-DD)",
  "gender": "string | null (optional, max 32)",
  "avatarUrl": "string | null (optional, URI)",
  "personalEmail": "string | null (optional, email, max 320)",
  "personalPhone": "string | null (optional, phone, max 64)",
  "address": {
    "street": "string (optional, max 255)",
    "addressLine2": "string (optional, max 255)",
    "city": "string (optional, max 100)",
    "stateOrProvince": "string (optional, max 100)",
    "postalCode": "string (optional, max 20)",
    "countryCode": "string (optional, ISO alpha-2, max 2)"
  },
  "employmentType": "FULL_TIME | PART_TIME | CONTRACT | TEMPORARY | INTERN (optional)",
  "employmentStatus": "PENDING | ACTIVE | PROBATION | NOTICE_PERIOD | TERMINATED (optional)",
  "status": "INVITED | ACTIVE | INACTIVE | TERMINATED | SUSPENDED (optional)",
  "joinedAt": "string | null (optional, ISO 8601 timestamptz)",
  "probationEndAt": "string | null (optional, ISO 8601 timestamptz)",
  "endedAt": "string | null (optional, ISO 8601 timestamptz)",
  "companyId": "string (optional, UUIDv4)",
  "locationId": "string | null (optional, UUIDv4)",
  "departmentId": "string | null (optional, UUIDv4)",
  "gradeId": "string | null (optional, UUIDv4)",
  "jobTitleId": "string | null (optional, UUIDv4)",
  "managerId": "string | null (optional, UUIDv4)",
  "effectiveFrom": "string (optional, ISO 8601 date)"
}
```

### Request Example (Partial Profile & Manager Update)
```json
{
  "preferredName": "Jenny",
  "personalPhone": "+1-555-019-2834",
  "jobTitleId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "managerId": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"
}
```

---

## 2. Response Specification

### Success Response (`200 OK`)

Returns the complete updated employee record with resolved organization projections and manager data.

```json
{
  "id": "e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c",
  "tenantCode": "CORP-DEFAULT",
  "employeeCode": "EMP-00101",
  "status": "ACTIVE",
  "employmentType": "FULL_TIME",
  "employmentStatus": "ACTIVE",
  "joinedAt": "2026-09-01T00:00:00.000Z",
  "probationEndAt": "2026-12-01T00:00:00.000Z",
  "endedAt": null,
  "profile": {
    "firstName": "Jennifer",
    "middleName": "Rose",
    "lastName": "Smith",
    "preferredName": "Jenny",
    "fullName": "Jennifer Rose Smith",
    "dateOfBirth": "1994-06-12",
    "gender": "FEMALE",
    "avatarUrl": "https://cdn.example.com/avatars/emp001.png",
    "personalEmail": "jenny.smith@example.com",
    "personalPhone": "+1-555-019-2834",
    "address": {
      "street": "123 Tech Park Ave",
      "addressLine2": "Suite 400",
      "city": "San Francisco",
      "stateOrProvince": "California",
      "postalCode": "94107",
      "countryCode": "US"
    }
  },
  "currentAssignment": {
    "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
    "effectiveFrom": "2026-09-01",
    "effectiveTo": null,
    "company": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "code": "CORP-HQ",
      "name": "Global Tech Corp"
    },
    "department": {
      "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "code": "ENG",
      "name": "Engineering"
    },
    "location": {
      "id": "2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "name": "San Francisco Campus"
    },
    "grade": {
      "id": "3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "code": "L5",
      "name": "Senior Staff"
    },
    "jobTitle": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "code": "SWE-SR",
      "name": "Senior Software Engineer"
    },
    "manager": {
      "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      "employeeCode": "EMP-00010",
      "fullName": "Robert Martin"
    }
  },
  "createdAt": "2026-09-01T08:00:00.000Z",
  "updatedAt": "2026-10-08T14:30:00.000Z"
}
```

---

## 3. Error Responses

Standard enterprise error envelope returned for all client and business exceptions:

```json
{
  "statusCode": 400,
  "errorCode": "CANNOT_REPORT_TO_SELF",
  "message": "An employee cannot report to themselves",
  "timestamp": "2026-10-08T14:30:00.000Z",
  "path": "/employees/e0a1b2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c",
  "requestId": "7d6c38b2-5a40-4dc9-9851-92b005118ea0"
}
```

### Error Code Catalog

| HTTP Status | Error Code | Trigger Condition |
|---|---|---|
| `400 Bad Request` | `EMPTY_UPDATE_PAYLOAD` | Request body contains no mutable attributes |
| `400 Bad Request` | `EMPLOYEE_CODE_IMMUTABLE` | Request body attempted to alter `employeeCode` |
| `400 Bad Request` | `INVALID_EMPLOYMENT_DATES` | `endedAt` is chronologically earlier than `joinedAt` |
| `400 Bad Request` | `CANNOT_REPORT_TO_SELF` | `managerId` matches the target employee's `id` |
| `400 Bad Request` | `CIRCULAR_REPORTING_HIERARCHY` | Manager directly reports back to target employee |
| `400 Bad Request` | `INVALID_ORGANIZATION_ASSIGNMENT` | Department or location does not belong to assigned company |
| `401 Unauthorized`| `UNAUTHORIZED` | Missing or invalid bearer JWT token |
| `403 Forbidden`   | `FORBIDDEN` | Caller lacks `employee.update` permission |
| `404 Not Found`   | `EMPLOYEE_NOT_FOUND` | Target employee not found in authenticated tenant |
| `404 Not Found`   | `COMPANY_NOT_FOUND` | Company ID not found or inactive in local projections |
| `404 Not Found`   | `DEPARTMENT_NOT_FOUND` | Department ID not found or inactive in local projections |
| `404 Not Found`   | `LOCATION_NOT_FOUND` | Location ID not found or inactive in local projections |
| `404 Not Found`   | `GRADE_NOT_FOUND` | Grade ID not found or inactive in local projections |
| `404 Not Found`   | `JOB_TITLE_NOT_FOUND` | Job title ID not found or inactive in local projections |
| `404 Not Found`   | `MANAGER_NOT_FOUND` | Manager employee not found or inactive in tenant |
| `409 Conflict`    | `SETTING_PROJECTION_NOT_READY` | Referenced projection record is in pending sync status |
| `409 Conflict`    | `CONCURRENT_MODIFICATION` | Conflicting concurrent update detected |

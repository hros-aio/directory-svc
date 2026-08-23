# Contract: Health & Readiness Endpoints

**Feature**: `001-init-base-source` | **Version**: `v1`

## 1. Liveness Probe

### Request
- **Method**: `GET`
- **Path**: `/health/live`
- **Headers**: None required

### Response (200 OK)
```json
{
  "status": "ok",
  "info": {
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "memory_heap": {
      "status": "up"
    }
  }
}
```

---

## 2. Readiness Probe

### Request
- **Method**: `GET`
- **Path**: `/health/ready`
- **Headers**: None required

### Response (200 OK)
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  }
}
```

### Response (503 Service Unavailable)
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  }
}
```

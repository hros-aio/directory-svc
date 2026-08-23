# Contract: OpenAPI / Swagger Specification Standard

**Feature**: `001-init-base-source` | **Version**: `v1`

## OpenAPI Bootstrap & Conventions

- **OpenAPI Endpoint**: `/docs` (Swagger UI), `/docs-json` (raw OpenAPI v3 JSON spec)
- **API Versioning**: Prefix `/api/v1/`
- **Security Schemes**:
  - `bearerAuth`: HTTP Bearer (JWT RS256 token)
- **Standard Error Response Envelope**:

```json
{
  "statusCode": 400,
  "timestamp": "2026-08-23T13:45:00.000Z",
  "path": "/api/v1/...",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "issue": "must be an email"
    }
  ]
}
```

- **Standard Pagination Query Contract**:
  - `limit`: `number` (optional, default: 20, max: 100)
  - `page`: `number` (optional, default: 1)
  - `sortBy`: `string` (optional)
  - `sortOrder`: `'ASC' | 'DESC'` (optional, default: `'ASC'`)

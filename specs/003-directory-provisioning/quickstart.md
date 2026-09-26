# Quickstart & Validation Guide: Directory Service Provisioning Module

## Prerequisites
- PostgreSQL running locally or via Testcontainers
- Kafka instance (or embedded Kafka test mock)
- Redis instance

---

## 1. End-to-End Validation Scenario

### 1.1 Emit Company Master Data Event
Publish a `setting.company.created` message to `setting.events` topic:
```json
{
  "eventId": "a0000000-0000-0000-0000-000000000001",
  "eventType": "setting.company.created",
  "eventVersion": 1,
  "tenantId": "tenant-test-01",
  "aggregateId": "c0000000-0000-0000-0000-000000000001",
  "occurredAt": "2026-09-26T12:00:00.000Z",
  "payload": {
    "id": "c0000000-0000-0000-0000-000000000001",
    "code": "ACME",
    "name": "Acme Corporation",
    "status": "ACTIVE",
    "version": 1
  }
}
```

### 1.2 Verify Local Projection
Query PostgreSQL:
```sql
SELECT * FROM company_projections WHERE tenant_code = 'tenant-test-01' AND id = 'c0000000-0000-0000-0000-000000000001';
SELECT * FROM processed_events WHERE event_id = 'a0000000-0000-0000-0000-000000000001';
```
- **Expected Outcome**: Exactly 1 company projection record created with `status = 'ACTIVE'`, and 1 processed event record created.

### 1.3 Verify Idempotent Duplicate Handling
Re-send the exact same message to `setting.events`.
- **Expected Outcome**: Message is acknowledged, no duplicate record in `company_projections`, no duplicate in `processed_events`, no exceptions thrown.

### 1.4 Verify Out-of-Order / Stale Event Rejection
Publish `setting.company.updated` with `version: 2` (applies successfully), followed by delayed `setting.company.updated` with `version: 1`.
- **Expected Outcome**: State retains `version: 2` data; `version: 1` event is logged as skipped.

---

## 2. Test Execution Commands

```bash
# Run unit tests for provisioning consumers, handlers, and services
pnpm test src/modules/provisioning

# Run test coverage
pnpm test:cov
```

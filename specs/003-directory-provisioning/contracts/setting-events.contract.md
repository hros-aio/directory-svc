# Setting Service Event Contracts

**Topic**: `setting.events`
**DLQ Topic**: `setting.events.dlq`
**Consumer Group**: `directory-service-provisioning`

---

## 1. Universal Event Envelope

All master data events follow the standard `SettingEvent<T>` envelope:

```typescript
export interface SettingEvent<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: SettingEventType;
  readonly eventVersion: number;
  readonly tenantId: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly actorId?: string;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly payload: TPayload;
}
```

---

## 2. Event Types & Payloads

### 2.1 Company Events
- Types: `setting.company.created`, `setting.company.updated`, `setting.company.deactivated`

```typescript
export interface CompanyPayload {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  readonly taxNumber?: string;
  readonly version: number;
}
```

### 2.2 Department Events
- Types: `setting.department.created`, `setting.department.updated`, `setting.department.deactivated`

```typescript
export interface DepartmentPayload {
  readonly id: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly parentDepartmentId?: string | null;
  readonly version: number;
}
```

### 2.3 Location Events
- Types: `setting.location.created`, `setting.location.updated`, `setting.location.deactivated`

```typescript
export interface LocationPayload {
  readonly id: string;
  readonly companyId: string;
  readonly name: string;
  readonly address?: Record<string, unknown>;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly version: number;
}
```

### 2.4 Grade Events
- Types: `setting.grade.created`, `setting.grade.updated`, `setting.grade.deactivated`

```typescript
export interface GradePayload {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly level: number;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly version: number;
}
```

### 2.5 Job Title Events
- Types: `setting.job_title.created`, `setting.job_title.updated`, `setting.job_title.deactivated`

```typescript
export interface JobTitlePayload {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly version: number;
}
```

# Setting Service Event Contracts

**Topic / Event Prefix**: `setting.*`
**DLQ Topic**: `setting.events.dlq`
**Consumer Group**: `directory-service-provisioning`

---

## 1. Universal Event Envelope

All master data events use `EventEnvelope<T>` from `@new-hros/libs-events`:

```typescript
export interface EventEnvelope<TPayload = unknown> {
  readonly id: string;
  readonly correlationId?: string;
  readonly payload: TPayload;
}
```

---

## 2. Event Types & Payloads

Event type definitions from `SettingEventType` (`src/common/enums/setting-event-type.enum.ts`):

### 2.1 Company Events
- **Types**: `setting.company.created`, `setting.company.updated`, `setting.company.activated`
- **Payload interface**: `CompanyPayload` (extends `Company` entity from `@new-hros/libs-sql`)

```typescript
export interface CompanyPayload extends Company {}
```

### 2.2 Department Events
- **Types**: `setting.department.created`, `setting.department.updated`, `setting.department.deactivated`
- **Payload interface**: `DepartmentPayload` (extends `Department` entity from `@new-hros/libs-sql`)

```typescript
export interface DepartmentPayload extends Department {}
```

### 2.3 Location Events
- **Types**: `setting.location.created`, `setting.location.updated`, `setting.location.deactivated`
- **Payload interface**: `LocationPayload` (extends `Location` entity from `@new-hros/libs-sql`)

```typescript
export interface LocationPayload extends Location {}
```

### 2.4 Grade Events
- **Types**: `setting.grade.created`, `setting.grade.updated`, `setting.grade.deactivated`
- **Payload interface**: `GradePayload` (extends `Grade` entity from `@new-hros/libs-sql`)

```typescript
export interface GradePayload extends Grade {}
```

### 2.5 Job Title Events
- **Types**: `setting.job_title.created`, `setting.job_title.updated`, `setting.job_title.deactivated`
- **Payload interface**: `JobTitlePayload` (extends `JobTitle` entity from `@new-hros/libs-sql`)

```typescript
export interface JobTitlePayload extends JobTitle {}
```

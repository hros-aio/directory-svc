# Data Model: Directory Service Provisioning Module

**Feature**: Directory Service Provisioning Module (`specs/003-directory-provisioning`)
**Date**: 2026-09-26

---

## 1. Entities & Projection Schemas

### 1.1 ProcessedEventEntity (`processed_events`)
Tracks processed events to guarantee idempotent execution.

```typescript
@Entity('processed_events')
@Unique('uq_processed_events_tenant_event', ['tenantCode', 'eventId'])
@Index('idx_processed_events_aggregate', ['tenantCode', 'aggregateId'])
export class ProcessedEventEntity extends BaseEntity {
  @Column({ name: 'event_id', type: 'uuid', nullable: false })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100, nullable: false })
  eventType: string;

  @Column({ name: 'aggregate_id', type: 'uuid', nullable: false })
  aggregateId: string;

  @Column({ name: 'event_version', type: 'int', nullable: false, default: 1 })
  eventVersion: number;

  @Column({ name: 'processed_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;
}
```

### 1.2 CompanyProjectionEntity (`company_projections` / `companies`)
Local read projection for Company master data.

```typescript
@Entity('company_projections')
@Unique('uq_company_projections_tenant_id', ['tenantCode', 'id'])
@Unique('uq_company_projections_tenant_code', ['tenantCode', 'code'])
export class CompanyProjectionEntity extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'version', type: 'int', nullable: false, default: 1 })
  version: number;
}
```

### 1.3 DepartmentProjectionEntity (`department_projections` / `departments`)
Local read projection for Department master data.

```typescript
@Entity('department_projections')
@Unique('uq_dept_projections_tenant_id', ['tenantCode', 'id'])
@Index('idx_dept_projections_company', ['tenantCode', 'companyId'])
export class DepartmentProjectionEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId: string;

  @Column({ name: 'code', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'version', type: 'int', nullable: false, default: 1 })
  version: number;
}
```

### 1.4 LocationProjectionEntity (`location_projections` / `locations`)
Local read projection for Location master data.

```typescript
@Entity('location_projections')
@Unique('uq_loc_projections_tenant_id', ['tenantCode', 'id'])
@Index('idx_loc_projections_company', ['tenantCode', 'companyId'])
export class LocationProjectionEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'address', type: 'jsonb', nullable: true })
  address?: Record<string, unknown> | null;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'version', type: 'int', nullable: false, default: 1 })
  version: number;
}
```

### 1.5 GradeProjectionEntity (`grade_projections` / `grades`)
Local read projection for Grade master data.

```typescript
@Entity('grade_projections')
@Unique('uq_grade_projections_tenant_id', ['tenantCode', 'id'])
export class GradeProjectionEntity extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'level', type: 'int', nullable: false, default: 1 })
  level: number;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'version', type: 'int', nullable: false, default: 1 })
  version: number;
}
```

### 1.6 JobTitleProjectionEntity (`job_title_projections` / `job_titles`)
Local read projection for Job Title master data.

```typescript
@Entity('job_title_projections')
@Unique('uq_job_title_projections_tenant_id', ['tenantCode', 'id'])
export class JobTitleProjectionEntity extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: false, default: 'ACTIVE' })
  status: string;

  @Column({ name: 'version', type: 'int', nullable: false, default: 1 })
  version: number;
}
```

---

## 2. Table Name Enumeration Update

Add the new projection tables to `src/common/enums/table-name.ts`:
- `ProcessedEvent = 'processed_events'`
- `CompanyProjection = 'company_projections'`
- `DepartmentProjection = 'department_projections'`
- `LocationProjection = 'location_projections'`
- `GradeProjection = 'grade_projections'`
- `JobTitleProjection = 'job_title_projections'`

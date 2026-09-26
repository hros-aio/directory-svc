# Data Model & DTO Specification: Create Employee API

**Feature Branch**: `004-create-employee-api`  
**Date**: 2026-09-26  

---

## 1. Request DTO (`CreateEmployeeDto`)

```typescript
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Address, EmploymentStatus, EmploymentType } from '@/common';

export class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateOrProvince?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;
}

export class CreateEmployeeDto {
  // --- Identity & Profile ---
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'employeeCode must contain only alphanumeric characters, underscores, or hyphens',
  })
  employeeCode: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gender?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  personalEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  personalPhone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  // --- Employment ---
  @IsNotEmpty()
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsDateString()
  probationEndAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  // --- Organization Assignment ---
  @IsNotEmpty()
  @IsUUID('4')
  companyId: string;

  @IsOptional()
  @IsUUID('4')
  locationId?: string;

  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @IsOptional()
  @IsUUID('4')
  gradeId?: string;

  @IsOptional()
  @IsUUID('4')
  jobTitleId?: string;

  @IsOptional()
  @IsUUID('4')
  managerId?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
```

---

## 2. Response DTO (`EmployeeResponseDto`)

```typescript
export interface ResolvedReference {
  readonly id: string;
  readonly code?: string;
  readonly name: string;
}

export interface ResolvedManager {
  readonly id: string;
  readonly employeeCode: string;
  readonly fullName: string;
}

export class EmployeeResponseDto {
  id: string;
  tenantCode: string;
  employeeCode: string;
  status: string;
  employmentType: string;
  employmentStatus: string;
  joinedAt: string | null;
  probationEndAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;

  profile: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    preferredName: string | null;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    avatarUrl: string | null;
    personalEmail: string | null;
    personalPhone: string | null;
    address: Record<string, unknown> | null;
  };

  currentAssignment: {
    id: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    company: ResolvedReference;
    department: ResolvedReference | null;
    location: ResolvedReference | null;
    grade: ResolvedReference | null;
    jobTitle: ResolvedReference | null;
    manager: ResolvedManager | null;
  };
}
```

---

## 3. Outbox Event Entity (`outbox_events`)

```typescript
import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index, Unique } from 'typeorm';
import { TableName } from '@/common';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('outbox_events')
@Unique('uq_outbox_events_tenant_id', ['tenantCode', 'id'])
@Index('idx_outbox_events_status_created', ['tenantCode', 'status', 'createdAt'])
export class OutboxEventEntity extends BaseEntity {
  @Column({ name: 'aggregate_type', type: 'varchar', length: 64, nullable: false })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'uuid', nullable: false })
  aggregateId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 128, nullable: false })
  eventType: string;

  @Column({ name: 'event_version', type: 'int', nullable: false, default: 1 })
  eventVersion: number;

  @Column({ name: 'payload', type: 'jsonb', nullable: false })
  payload: Record<string, unknown>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
    nullable: false,
  })
  status: OutboxStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}
```

---

## 4. Domain Event Contract: `directory.employee.created`

```json
{
  "eventId": "c7a8b4e2-6321-46fd-9c3f-95ec1d4f2091",
  "eventType": "directory.employee.created",
  "eventVersion": 1,
  "tenantId": "c85d70b3-9366-419b-b6fb-014c243a7589",
  "aggregateId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "occurredAt": "2026-09-26T14:55:00.000Z",
  "actorId": "8f3e2b1c-9a4d-4e5f-8c7b-6a5d4e3f2b1a",
  "correlationId": "4c9d2f1b-5e6a-7b8c-9d0e-1f2a3b4c5d6e",
  "traceId": "7d6e5f4a3b2c1d0e",
  "payload": {
    "employeeId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "employeeCode": "EMP-00101",
    "status": "INVITED",
    "employmentType": "FULL_TIME",
    "employmentStatus": "PENDING",
    "companyId": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    "locationId": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    "departmentId": "d4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a",
    "gradeId": "e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
    "jobTitleId": "f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c",
    "managerId": null,
    "joinedAt": "2026-10-01T00:00:00.000Z"
  }
}
```

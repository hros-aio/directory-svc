import { EmployeeStatus, EmploymentStatus, EmploymentType } from '../../../common/enums';

export interface EmployeeCreatedEventPayload {
  readonly employeeId: string;
  readonly tenantCode: string;
  readonly employeeCode: string;
  readonly status: EmployeeStatus;
  readonly employmentType: EmploymentType;
  readonly employmentStatus: EmploymentStatus;
  readonly companyId: string;
  readonly locationId: string | null;
  readonly departmentId: string | null;
  readonly gradeId: string | null;
  readonly jobTitleId: string | null;
  readonly managerId: string | null;
  readonly joinedAt: string | null;
  readonly createdAt: string;
}

export interface DirectoryEmployeeCreatedEvent {
  readonly eventId: string;
  readonly eventType: 'directory.employee.created';
  readonly eventVersion: number;
  readonly tenantId: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly payload: EmployeeCreatedEventPayload;
}

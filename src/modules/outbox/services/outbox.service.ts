import { Injectable } from '@nestjs/common';
import { OutboxEventEntity, OutboxStatus } from '@new-hros/libs-sql';

import { EmployeeEntity } from '../../employee/entities/employee.entity';
import { EmploymentAssignmentEntity } from '../../employment/entities/employment-assignment.entity';
import { OutboxRepository } from '../repositories/outbox.repository';

@Injectable()
export class OutboxService {
  constructor(private readonly outboxRepository: OutboxRepository) {}

  async fromEmployeeCreated(
    employee: EmployeeEntity,
    assignment: EmploymentAssignmentEntity,
  ): Promise<OutboxEventEntity> {
    const tenantCode = employee.tenantCode;
    const eventPayload = {
      employeeId: employee.id,
      tenantCode,
      employeeCode: employee.employeeCode,
      status: employee.status,
      employmentType: employee.employmentType,
      employmentStatus: employee.employmentStatus,
      companyId: assignment.companyId,
      locationId: assignment.locationId,
      departmentId: assignment.departmentId,
      gradeId: assignment.gradeId,
      jobTitleId: assignment.jobTitleId,
      managerId: assignment.managerEmployeeId,
      joinedAt: employee.joinedAt ? employee.joinedAt.toISOString() : null,
      createdAt: employee.createdAt ? employee.createdAt.toISOString() : new Date().toISOString(),
    };

    return this.outboxRepository.create({
      tenantCode,
      aggregateType: 'EMPLOYEE',
      aggregateId: employee.id,
      eventType: 'directory.employee.created',
      eventVersion: 1,
      payload: eventPayload,
      status: OutboxStatus.PENDING,
    });
  }

  async fromEmployeeUpdated(
    employee: EmployeeEntity,
    assignment: EmploymentAssignmentEntity,
  ): Promise<OutboxEventEntity> {
    const tenantCode = employee.tenantCode;
    const eventPayload = {
      employeeId: employee.id,
      tenantCode,
      employeeCode: employee.employeeCode,
      status: employee.status,
      employmentType: employee.employmentType,
      employmentStatus: employee.employmentStatus,
      companyId: assignment.companyId,
      locationId: assignment.locationId,
      departmentId: assignment.departmentId,
      gradeId: assignment.gradeId,
      jobTitleId: assignment.jobTitleId,
      managerId: assignment.managerEmployeeId,
      joinedAt: employee.joinedAt ? employee.joinedAt.toISOString() : null,
      updatedAt: employee.updatedAt ? employee.updatedAt.toISOString() : new Date().toISOString(),
    };

    return this.outboxRepository.create({
      tenantCode,
      aggregateType: 'EMPLOYEE',
      aggregateId: employee.id,
      eventType: 'directory.employee.updated',
      eventVersion: 1,
      payload: eventPayload,
      status: OutboxStatus.PENDING,
    });
  }
}

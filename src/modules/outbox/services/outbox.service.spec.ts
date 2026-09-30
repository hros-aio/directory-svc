import { Test, TestingModule } from '@nestjs/testing';
import { OutboxEventEntity, OutboxStatus } from '@new-hros/libs-sql';

import { OutboxService } from './outbox.service';
import { EmployeeStatus, EmploymentStatus, EmploymentType } from '../../../common/enums';
import { EmployeeEntity } from '../../employee/entities/employee.entity';
import { EmploymentAssignmentEntity } from '../../employment/entities/employment-assignment.entity';
import { OutboxRepository } from '../repositories/outbox.repository';

describe('OutboxService', () => {
  let service: OutboxService;
  let outboxRepo: jest.Mocked<OutboxRepository>;

  beforeEach(async () => {
    outboxRepo = {
      create: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxService, { provide: OutboxRepository, useValue: outboxRepo }],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
  });

  it('should create an outbox event from employee created', async () => {
    const employee: EmployeeEntity = {
      id: 'emp-1',
      tenantCode: 'tenant-1',
      employeeCode: 'EMP-001',
      status: EmployeeStatus.INVITED,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      joinedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as unknown as EmployeeEntity;

    const assignment: EmploymentAssignmentEntity = {
      companyId: 'comp-1',
      locationId: 'loc-1',
      departmentId: 'dept-1',
      gradeId: 'grade-1',
      jobTitleId: 'job-1',
      managerEmployeeId: 'mgr-1',
    } as unknown as EmploymentAssignmentEntity;

    const mockEvent = {
      id: 'outbox-1',
      status: OutboxStatus.PENDING,
    } as unknown as OutboxEventEntity;

    outboxRepo.create.mockResolvedValue(mockEvent);

    const result = await service.fromEmployeeCreated(employee, assignment);

    expect(result).toEqual(mockEvent);
    expect(outboxRepo.create).toHaveBeenCalledWith({
      tenantCode: 'tenant-1',
      aggregateType: 'EMPLOYEE',
      aggregateId: 'emp-1',
      eventType: 'directory.employee.created',
      eventVersion: 1,
      payload: {
        employeeId: 'emp-1',
        tenantCode: 'tenant-1',
        employeeCode: 'EMP-001',
        status: EmployeeStatus.INVITED,
        employmentType: EmploymentType.FULL_TIME,
        employmentStatus: EmploymentStatus.ACTIVE,
        companyId: 'comp-1',
        locationId: 'loc-1',
        departmentId: 'dept-1',
        gradeId: 'grade-1',
        jobTitleId: 'job-1',
        managerId: 'mgr-1',
        joinedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      status: OutboxStatus.PENDING,
    });
  });
});

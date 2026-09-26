import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '@new-hros/libs-core';
import { TransactionService } from '@new-hros/libs-sql';

import { EmployeeService } from './employee.service';
import {
  EmployeeStatus,
  EmploymentStatus,
  EmploymentType,
  OutboxStatus,
} from '../../../common/enums';
import { EmploymentAssignmentEntity } from '../../employment/entities/employment-assignment.entity';
import { EmploymentAssignmentRepository } from '../../employment/repositories/employment-assignment.repository';
import { OutboxEventEntity } from '../../outbox/entities/outbox-event.entity';
import { OutboxRepository } from '../../outbox/repositories/outbox.repository';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeProfileEntity } from '../entities/employee-profile.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeProfileRepository } from '../repositories/employee-profile.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { EmployeeReferenceValidator } from '../validators/employee-reference.validator';
import { ManagerValidator } from '../validators/manager.validator';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employeeRepo: jest.Mocked<EmployeeRepository>;
  let profileRepo: jest.Mocked<EmployeeProfileRepository>;
  let assignmentRepo: jest.Mocked<EmploymentAssignmentRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let referenceValidator: jest.Mocked<EmployeeReferenceValidator>;
  let managerValidator: jest.Mocked<ManagerValidator>;
  let transactionService: jest.Mocked<TransactionService>;
  let loggerService: jest.Mocked<LoggerService>;

  const tenantCode = 'tenant-corp-1';
  const userId = 'user-admin-1';
  const validDto: CreateEmployeeDto = {
    employeeCode: 'EMP-00101',
    firstName: 'Jane',
    lastName: 'Doe',
    employmentType: EmploymentType.FULL_TIME,
    companyId: 'company-1',
    departmentId: 'dept-1',
    locationId: 'loc-1',
    gradeId: 'grade-1',
    jobTitleId: 'job-1',
    managerId: 'mgr-1',
    joinedAt: '2026-10-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    employeeRepo = {
      findByCode: jest.fn(),
      findByIdAndTenant: jest.fn(),
      createAndSave: jest.fn(),
    } as unknown as jest.Mocked<EmployeeRepository>;

    profileRepo = {
      createAndSave: jest.fn(),
    } as unknown as jest.Mocked<EmployeeProfileRepository>;

    assignmentRepo = {
      createAndSave: jest.fn(),
    } as unknown as jest.Mocked<EmploymentAssignmentRepository>;

    outboxRepo = {
      createAndSave: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    referenceValidator = {
      validateAndResolve: jest.fn(),
    } as unknown as jest.Mocked<EmployeeReferenceValidator>;

    managerValidator = {
      validateManager: jest.fn(),
    } as unknown as jest.Mocked<ManagerValidator>;

    transactionService = {
      runInTransaction: jest.fn().mockImplementation((work: () => Promise<unknown>) => work()),
    } as unknown as jest.Mocked<TransactionService>;

    loggerService = {
      audit: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: EmployeeRepository, useValue: employeeRepo },
        { provide: EmployeeProfileRepository, useValue: profileRepo },
        { provide: EmploymentAssignmentRepository, useValue: assignmentRepo },
        { provide: OutboxRepository, useValue: outboxRepo },
        { provide: EmployeeReferenceValidator, useValue: referenceValidator },
        { provide: ManagerValidator, useValue: managerValidator },
        { provide: TransactionService, useValue: transactionService },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should successfully create an employee, profile, assignment, and outbox event', async () => {
    employeeRepo.findByCode.mockResolvedValue(null);

    referenceValidator.validateAndResolve.mockResolvedValue({
      company: { id: 'company-1', code: 'ACME', name: 'Acme Corp' },
      department: { id: 'dept-1', code: 'ENG', name: 'Engineering' },
      location: { id: 'loc-1', code: 'HQ', name: 'Singapore HQ' },
      grade: { id: 'grade-1', code: 'L5', name: 'Senior IC' },
      jobTitle: { id: 'job-1', code: 'SWE', name: 'Staff Engineer' },
    });

    managerValidator.validateManager.mockResolvedValue({
      manager: { id: 'mgr-1' } as unknown as EmployeeEntity,
      resolved: { id: 'mgr-1', employeeCode: 'MGR-001', fullName: 'Alice Smith' },
    });

    const mockSavedEmployee = {
      id: 'emp-uuid-1',
      tenantCode,
      employeeCode: 'EMP-00101',
      status: EmployeeStatus.INVITED,
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.PENDING,
      joinedAt: new Date('2026-10-01T00:00:00.000Z'),
      probationEndAt: null,
      endedAt: null,
      createdAt: new Date('2026-09-26T12:00:00.000Z'),
      updatedAt: new Date('2026-09-26T12:00:00.000Z'),
    } as unknown as EmployeeEntity;
    employeeRepo.createAndSave.mockResolvedValue(mockSavedEmployee);

    const mockSavedProfile = {
      id: 'profile-uuid-1',
      employeeId: 'emp-uuid-1',
      tenantCode,
      firstName: 'Jane',
      middleName: null,
      lastName: 'Doe',
      preferredName: null,
      dateOfBirth: null,
      gender: null,
      avatarUrl: null,
      personalEmail: null,
      personalPhone: null,
      address: null,
    } as unknown as EmployeeProfileEntity;
    profileRepo.createAndSave.mockResolvedValue(mockSavedProfile);

    const mockSavedAssignment = {
      id: 'assignment-uuid-1',
      employeeId: 'emp-uuid-1',
      tenantCode,
      companyId: 'company-1',
      departmentId: 'dept-1',
      locationId: 'loc-1',
      gradeId: 'grade-1',
      jobTitleId: 'job-1',
      managerEmployeeId: 'mgr-1',
      effectiveFrom: new Date('2026-10-01'),
      effectiveTo: null,
    } as unknown as EmploymentAssignmentEntity;
    assignmentRepo.createAndSave.mockResolvedValue(mockSavedAssignment);

    outboxRepo.createAndSave.mockResolvedValue({
      id: 'outbox-uuid-1',
      status: OutboxStatus.PENDING,
    } as unknown as OutboxEventEntity);

    const response = await service.createEmployee(validDto, {
      tenantCode,
      userId,
      traceId: 'trace-123',
    });

    expect(response.id).toBe('emp-uuid-1');
    expect(response.employeeCode).toBe('EMP-00101');
    expect(response.profile.fullName).toBe('Jane Doe');
    expect(response.currentAssignment.company.name).toBe('Acme Corp');
    expect(response.currentAssignment.manager?.fullName).toBe('Alice Smith');
    expect(outboxRepo.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'directory.employee.created',
        tenantCode,
        status: OutboxStatus.PENDING,
      }),
    );
    expect(loggerService.audit).toHaveBeenCalledWith(
      'EMPLOYEE_CREATED',
      userId,
      expect.objectContaining({ employeeId: 'emp-uuid-1', tenantCode }),
    );
  });

  it('should throw DUPLICATE_EMPLOYEE_CODE if employeeCode already exists in tenant', async () => {
    employeeRepo.findByCode.mockResolvedValue({
      id: 'existing-emp',
      employeeCode: 'EMP-00101',
    } as unknown as EmployeeEntity);

    await expect(service.createEmployee(validDto, { tenantCode, userId })).rejects.toMatchObject({
      code: 'DUPLICATE_EMPLOYEE_CODE',
      status: 409,
    });

    expect(transactionService.runInTransaction).not.toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { ManagerValidator } from './manager.validator';
import { EmployeeStatus, EmploymentStatus } from '../../../common/enums';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeRepository } from '../repositories/employee.repository';

describe('ManagerValidator', () => {
  let validator: ManagerValidator;
  let employeeRepo: jest.Mocked<EmployeeRepository>;
  const tenantCode = 'tenant-1';

  beforeEach(async () => {
    employeeRepo = {
      findByIdAndTenant: jest.fn(),
    } as unknown as jest.Mocked<EmployeeRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ManagerValidator, { provide: EmployeeRepository, useValue: employeeRepo }],
    }).compile();

    validator = module.get<ManagerValidator>(ManagerValidator);
  });

  it('should successfully validate an active manager with full profile', async () => {
    employeeRepo.findByIdAndTenant.mockResolvedValue({
      id: 'mgr-1',
      tenantCode,
      employeeCode: 'MGR-001',
      status: EmployeeStatus.ACTIVE,
      employmentStatus: EmploymentStatus.ACTIVE,
      profile: {
        firstName: 'Alice',
        middleName: 'M',
        lastName: 'Smith',
      },
    } as unknown as EmployeeEntity);

    const result = await validator.validateManager('mgr-1', tenantCode);
    expect(result.resolved).toEqual({
      id: 'mgr-1',
      employeeCode: 'MGR-001',
      fullName: 'Alice M Smith',
    });
  });

  it('should throw MANAGER_NOT_FOUND when manager does not exist', async () => {
    employeeRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(validator.validateManager('non-existent-mgr', tenantCode)).rejects.toMatchObject({
      code: 'MANAGER_NOT_FOUND',
      status: 404,
    });
  });

  it('should throw INVALID_MANAGER when manager is terminated or inactive', async () => {
    employeeRepo.findByIdAndTenant.mockResolvedValue({
      id: 'mgr-1',
      tenantCode,
      employeeCode: 'MGR-001',
      status: EmployeeStatus.TERMINATED,
      employmentStatus: EmploymentStatus.ENDED,
    } as unknown as EmployeeEntity);

    await expect(validator.validateManager('mgr-1', tenantCode)).rejects.toMatchObject({
      code: 'INVALID_MANAGER',
      status: 400,
    });
  });
});

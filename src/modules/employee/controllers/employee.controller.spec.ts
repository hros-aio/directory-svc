import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard, PermissionGuard } from '@new-hros/libs-apis';

import { EmployeeController } from './employee.controller';
import { EmploymentType } from '../../../common/enums';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { EmployeeService } from '../services/employee.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: jest.Mocked<EmployeeService>;

  beforeEach(async () => {
    service = {
      createEmployee: jest.fn(),
    } as unknown as jest.Mocked<EmployeeService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [{ provide: EmployeeService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  it('should delegate create request to EmployeeService with context', async () => {
    const dto: CreateEmployeeDto = {
      employeeCode: 'EMP-001',
      firstName: 'John',
      lastName: 'Doe',
      employmentType: EmploymentType.FULL_TIME,
      companyId: 'comp-1',
    };

    const expectedResponse = {
      id: 'emp-1',
      employeeCode: 'EMP-001',
    } as unknown as EmployeeResponseDto;

    service.createEmployee.mockResolvedValue(expectedResponse);

    const result = await controller.create(dto, 'tenant-123', 'user-456', undefined, 'trace-789');

    expect(result).toBe(expectedResponse);
    expect(service.createEmployee).toHaveBeenCalledWith(dto, {
      tenantCode: 'tenant-123',
      userId: 'user-456',
      traceId: 'trace-789',
    });
  });
});

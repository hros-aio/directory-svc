import { Test, TestingModule } from '@nestjs/testing';
import { BusinessException } from '@new-hros/libs-core';
import {
  Company,
  CompanyStatus,
  Department,
  Grade,
  JobTitle,
  Location,
  MasterDataStatus,
} from '@new-hros/libs-sql';

import { EmployeeReferenceValidator } from './employee-reference.validator';
import { EmploymentType } from '../../../common/enums';
import {
  CompanyProjectionRepository,
  DepartmentProjectionRepository,
  GradeProjectionRepository,
  JobTitleProjectionRepository,
  LocationProjectionRepository,
} from '../../provisioning/repositories';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

describe('EmployeeReferenceValidator', () => {
  let validator: EmployeeReferenceValidator;
  let companyRepo: jest.Mocked<CompanyProjectionRepository>;
  let deptRepo: jest.Mocked<DepartmentProjectionRepository>;
  let locRepo: jest.Mocked<LocationProjectionRepository>;
  let gradeRepo: jest.Mocked<GradeProjectionRepository>;
  let jobTitleRepo: jest.Mocked<JobTitleProjectionRepository>;

  const tenantCode = 'tenant-test-1';
  const validDto: CreateEmployeeDto = {
    employeeCode: 'EMP-001',
    firstName: 'Jane',
    lastName: 'Doe',
    employmentType: EmploymentType.FULL_TIME,
    companyId: 'company-uuid-1',
    departmentId: 'dept-uuid-1',
    locationId: 'loc-uuid-1',
    gradeId: 'grade-uuid-1',
    jobTitleId: 'job-uuid-1',
  };

  beforeEach(async () => {
    companyRepo = {
      findByIdAndTenant: jest.fn(),
    } as unknown as jest.Mocked<CompanyProjectionRepository>;

    deptRepo = {
      findByIdAndTenant: jest.fn(),
    } as unknown as jest.Mocked<DepartmentProjectionRepository>;

    locRepo = {
      findByIdAndTenant: jest.fn(),
    } as unknown as jest.Mocked<LocationProjectionRepository>;

    gradeRepo = {
      findByIdAndTenant: jest.fn(),
    } as unknown as jest.Mocked<GradeProjectionRepository>;

    jobTitleRepo = {
      findByIdAndTenant: jest.fn(),
    } as unknown as jest.Mocked<JobTitleProjectionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeReferenceValidator,
        { provide: CompanyProjectionRepository, useValue: companyRepo },
        { provide: DepartmentProjectionRepository, useValue: deptRepo },
        { provide: LocationProjectionRepository, useValue: locRepo },
        { provide: GradeProjectionRepository, useValue: gradeRepo },
        { provide: JobTitleProjectionRepository, useValue: jobTitleRepo },
      ],
    }).compile();

    validator = module.get<EmployeeReferenceValidator>(EmployeeReferenceValidator);
  });

  it('should successfully validate all valid references', async () => {
    companyRepo.findByIdAndTenant.mockResolvedValue({
      id: 'company-uuid-1',
      companyCode: 'CORP',
      legalName: 'Corp Legal',
      displayName: 'Corp Global',
      status: CompanyStatus.ACTIVE,
    } as unknown as Company);

    deptRepo.findByIdAndTenant.mockResolvedValue({
      id: 'dept-uuid-1',
      code: 'ENG',
      name: 'Engineering',
      companyId: 'company-uuid-1',
      status: MasterDataStatus.ACTIVE,
    } as unknown as Department);

    locRepo.findByIdAndTenant.mockResolvedValue({
      id: 'loc-uuid-1',
      code: 'HQ',
      name: 'Singapore HQ',
      companyId: 'company-uuid-1',
      status: MasterDataStatus.ACTIVE,
    } as unknown as Location);

    gradeRepo.findByIdAndTenant.mockResolvedValue({
      id: 'grade-uuid-1',
      code: 'L5',
      name: 'Senior IC',
      status: MasterDataStatus.ACTIVE,
    } as unknown as Grade);

    jobTitleRepo.findByIdAndTenant.mockResolvedValue({
      id: 'job-uuid-1',
      code: 'SWE',
      name: 'Software Engineer',
      status: MasterDataStatus.ACTIVE,
    } as unknown as JobTitle);

    const result = await validator.validateAndResolve(validDto, tenantCode);

    expect(result.company).toEqual({
      id: 'company-uuid-1',
      code: 'CORP',
      name: 'Corp Global',
    });
    expect(result.department).toEqual({
      id: 'dept-uuid-1',
      code: 'ENG',
      name: 'Engineering',
    });
    expect(result.location).toEqual({
      id: 'loc-uuid-1',
      code: 'HQ',
      name: 'Singapore HQ',
    });
    expect(result.grade).toEqual({
      id: 'grade-uuid-1',
      code: 'L5',
      name: 'Senior IC',
    });
    expect(result.jobTitle).toEqual({
      id: 'job-uuid-1',
      code: 'SWE',
      name: 'Software Engineer',
    });
  });

  it('should throw COMPANY_NOT_FOUND if company is missing or inactive', async () => {
    companyRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(validator.validateAndResolve(validDto, tenantCode)).rejects.toThrow(
      BusinessException,
    );

    companyRepo.findByIdAndTenant.mockResolvedValue({
      id: 'company-uuid-1',
      status: CompanyStatus.PENDING,
    } as unknown as Company);

    await expect(validator.validateAndResolve(validDto, tenantCode)).rejects.toMatchObject({
      code: 'COMPANY_NOT_FOUND',
      status: 404,
    });
  });

  it('should throw DEPARTMENT_NOT_FOUND if department does not exist', async () => {
    companyRepo.findByIdAndTenant.mockResolvedValue({
      id: 'company-uuid-1',
      companyCode: 'CORP',
      legalName: 'Corp',
      status: CompanyStatus.ACTIVE,
    } as unknown as Company);
    deptRepo.findByIdAndTenant.mockResolvedValue(null);

    await expect(validator.validateAndResolve(validDto, tenantCode)).rejects.toMatchObject({
      code: 'DEPARTMENT_NOT_FOUND',
      status: 404,
    });
  });

  it('should throw INVALID_ORGANIZATION_ASSIGNMENT if department belongs to another company', async () => {
    companyRepo.findByIdAndTenant.mockResolvedValue({
      id: 'company-uuid-1',
      companyCode: 'CORP',
      legalName: 'Corp',
      status: CompanyStatus.ACTIVE,
    } as unknown as Company);
    deptRepo.findByIdAndTenant.mockResolvedValue({
      id: 'dept-uuid-1',
      companyId: 'different-company-uuid',
      status: MasterDataStatus.ACTIVE,
    } as unknown as Department);

    await expect(validator.validateAndResolve(validDto, tenantCode)).rejects.toMatchObject({
      code: 'INVALID_ORGANIZATION_ASSIGNMENT',
      status: 400,
    });
  });

  it('should throw INVALID_ORGANIZATION_ASSIGNMENT if location belongs to another company', async () => {
    companyRepo.findByIdAndTenant.mockResolvedValue({
      id: 'company-uuid-1',
      companyCode: 'CORP',
      legalName: 'Corp',
      status: CompanyStatus.ACTIVE,
    } as unknown as Company);
    deptRepo.findByIdAndTenant.mockResolvedValue(null);
    const dtoNoDept = { ...validDto, departmentId: undefined };

    locRepo.findByIdAndTenant.mockResolvedValue({
      id: 'loc-uuid-1',
      companyId: 'different-company-uuid',
      status: MasterDataStatus.ACTIVE,
    } as unknown as Location);

    await expect(validator.validateAndResolve(dtoNoDept, tenantCode)).rejects.toMatchObject({
      code: 'INVALID_ORGANIZATION_ASSIGNMENT',
      status: 400,
    });
  });
});

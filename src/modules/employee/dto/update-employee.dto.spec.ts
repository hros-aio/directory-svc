import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateEmployeeDto } from './update-employee.dto';
import { EmployeeStatus, EmploymentStatus, EmploymentType } from '../../../common/enums';

describe('UpdateEmployeeDto', () => {
  it('should pass validation with empty object (syntactic DTO validation)', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with partial profile fields', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      preferredName: 'Johnny',
      personalPhone: '+1987654321',
      gender: 'MALE',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation with partial employment fields', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      employmentType: EmploymentType.CONTRACT,
      employmentStatus: EmploymentStatus.ACTIVE,
      status: EmployeeStatus.ACTIVE,
      joinedAt: '2026-10-01T00:00:00Z',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when personalEmail is invalid', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      personalEmail: 'invalid-email-string',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'personalEmail')).toBe(true);
  });

  it('should fail when employmentType is not a valid enum', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      employmentType: 'INVALID_TYPE',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'employmentType')).toBe(true);
  });

  it('should fail when companyId is not a valid UUID', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      companyId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'companyId')).toBe(true);
  });

  it('should fail when firstName exceeds max length', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      firstName: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('should pass with valid full partial payload including address and organization IDs', async () => {
    const dto = plainToInstance(UpdateEmployeeDto, {
      firstName: 'Alice',
      lastName: 'Smith',
      address: {
        street: '789 Elm St',
        city: 'Austin',
        countryCode: 'US',
      },
      companyId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      departmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      managerId: '5f9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

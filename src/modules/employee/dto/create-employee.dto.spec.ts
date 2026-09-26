import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateEmployeeDto } from './create-employee.dto';
import { EmploymentStatus, EmploymentType } from '../../../common/enums';

describe('CreateEmployeeDto', () => {
  const validPayload = {
    employeeCode: 'EMP-00101',
    firstName: 'Jane',
    lastName: 'Doe',
    employmentType: EmploymentType.FULL_TIME,
    companyId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  };

  it('should pass validation with valid required fields', async () => {
    const dto = plainToInstance(CreateEmployeeDto, validPayload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when employeeCode is missing or invalid', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      employeeCode: 'EMP!@#$',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('employeeCode');
  });

  it('should fail when firstName is missing', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      firstName: '',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('should fail when employmentType is not a valid enum', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      employmentType: 'UNKNOWN_TYPE',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'employmentType')).toBe(true);
  });

  it('should fail when companyId is not a UUID', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      companyId: 'invalid-uuid',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'companyId')).toBe(true);
  });

  it('should validate email format for personalEmail', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      personalEmail: 'not-an-email',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'personalEmail')).toBe(true);
  });

  it('should pass with full valid optional fields', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      middleName: 'Alexander',
      preferredName: 'Jane',
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      avatarUrl: 'https://example.com/avatar.jpg',
      personalEmail: 'jane@example.com',
      personalPhone: '+1234567890',
      employmentStatus: EmploymentStatus.ACTIVE,
      joinedAt: '2026-10-01T00:00:00Z',
      probationEndAt: '2027-01-01T00:00:00Z',
      departmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      locationId: '2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      gradeId: '3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      jobTitleId: '4e9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      managerId: '5f9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      address: {
        street: '123 Main St',
        city: 'Metropolis',
        countryCode: 'US',
      },
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

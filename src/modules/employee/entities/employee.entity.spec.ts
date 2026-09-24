import { EmployeeProfileEntity } from './employee-profile.entity';
import { EmployeeEntity } from './employee.entity';
import { EmployeeStatus, EmploymentStatus, EmploymentType } from '../../../common/enums';

describe('Employee and EmployeeProfile Entities', () => {
  it('should instantiate EmployeeEntity with valid properties', () => {
    const employee = new EmployeeEntity();
    employee.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    employee.tenantCode = 'DEFAULT';
    employee.employeeCode = 'EMP-001';
    employee.employmentType = EmploymentType.FULL_TIME;
    employee.employmentStatus = EmploymentStatus.ACTIVE;
    employee.status = EmployeeStatus.ACTIVE;
    employee.joinedAt = new Date('2026-01-01');
    employee.probationEndAt = new Date('2026-03-01');
    employee.endedAt = null;

    expect(employee.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(employee.tenantCode).toBe('DEFAULT');
    expect(employee.employeeCode).toBe('EMP-001');
    expect(employee.employmentType).toBe(EmploymentType.FULL_TIME);
    expect(employee.employmentStatus).toBe(EmploymentStatus.ACTIVE);
    expect(employee.status).toBe(EmployeeStatus.ACTIVE);
  });

  it('should instantiate EmployeeProfileEntity with address value object', () => {
    const profile = new EmployeeProfileEntity();
    profile.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    profile.tenantCode = 'DEFAULT';
    profile.firstName = 'John';
    profile.lastName = 'Doe';
    profile.middleName = 'M';
    profile.personalEmail = 'john.doe@example.com';
    profile.personalPhone = '+84987654321';
    profile.address = {
      street: '123 Tech Street',
      city: 'Hanoi',
      countryCode: 'VN',
      postalCode: '100000',
    };

    expect(profile.firstName).toBe('John');
    expect(profile.lastName).toBe('Doe');
    expect(profile.address?.countryCode).toBe('VN');
  });
});

import { EmploymentAssignmentEntity } from './employment-assignment.entity';

describe('EmploymentAssignmentEntity', () => {
  it('should instantiate EmploymentAssignmentEntity with valid properties', () => {
    const assignment = new EmploymentAssignmentEntity();
    assignment.id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    assignment.tenantCode = 'DEFAULT';
    assignment.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    assignment.companyId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    assignment.departmentId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
    assignment.locationId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
    assignment.jobTitleId = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
    assignment.gradeId = '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a77';
    assignment.managerEmployeeId = '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a88';
    assignment.effectiveFrom = new Date('2026-01-01');
    assignment.effectiveTo = null;

    expect(assignment.tenantCode).toBe('DEFAULT');
    expect(assignment.companyId).toBe('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33');
    expect(assignment.managerEmployeeId).toBe('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a88');
    expect(assignment.effectiveTo).toBeNull();
  });
});

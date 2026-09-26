import { BaseEntity } from '@new-hros/libs-sql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { EmployeeEntity } from '../../employee/entities/employee.entity';

import { TableName } from '@/common';

@Entity(TableName.EmploymentAssignment)
@Unique('uq_employment_assignments_tenant_id', ['tenantCode', 'id'])
@Index('idx_employment_assignments_employee', ['tenantCode', 'employeeId'])
@Index('idx_employment_assignments_company', ['tenantCode', 'companyId'])
@Index('idx_employment_assignments_department', ['tenantCode', 'departmentId'])
@Index('idx_employment_assignments_manager', ['tenantCode', 'managerEmployeeId'])
@Index('idx_employment_assignments_current', ['tenantCode', 'employeeId'], {
  where: 'effective_to IS NULL',
})
@Check('chk_employment_assignments_dates', `effective_to IS NULL OR effective_to >= effective_from`)
@Check(
  'chk_employment_assignments_not_self_manager',
  `manager_employee_id IS NULL OR manager_employee_id <> employee_id`,
)
export class EmploymentAssignmentEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', nullable: false })
  employeeId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId: string;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'job_title_id', type: 'uuid', nullable: true })
  jobTitleId: string | null;

  @Column({ name: 'grade_id', type: 'uuid', nullable: true })
  gradeId: string | null;

  @Column({ name: 'manager_employee_id', type: 'uuid', nullable: true })
  managerEmployeeId: string | null;

  @Column({ name: 'effective_from', type: 'date', nullable: false })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;

  @ManyToOne(() => EmployeeEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'manager_employee_id', referencedColumnName: 'id' })
  manager?: EmployeeEntity | null;
}

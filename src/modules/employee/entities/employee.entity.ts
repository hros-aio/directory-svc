import { BaseEntity } from '@new-hros/libs-sql';
import { Check, Column, Entity, Index, OneToMany, OneToOne, Unique } from 'typeorm';

import { EmployeeBankAccountEntity } from './employee-bank-account.entity';
import { EmployeeDocumentEntity } from './employee-document.entity';
import { EmployeeProfileEntity } from './employee-profile.entity';
import { EmployeeTaxProfileEntity } from './employee-tax-profile.entity';
import { OnboardingEntity } from './onboarding.entity';
import { EmployeeStatus, EmploymentStatus, EmploymentType } from '../../../common/enums';
import type { EmploymentAssignmentEntity } from '../../employment/entities/employment-assignment.entity';
import type { EmploymentContractEntity } from '../../employment/entities/employment-contract.entity';

@Entity('employees')
@Unique('uq_employees_tenant_employee_code', ['tenantCode', 'employeeCode'])
@Unique('uq_employees_tenant_id', ['tenantCode', 'id'])
@Index('idx_employees_tenant_status', ['tenantCode', 'status'])
@Index('idx_employees_tenant_employment_status', ['tenantCode', 'employmentStatus'])
@Check('chk_employees_dates', `ended_at IS NULL OR joined_at IS NULL OR ended_at >= joined_at`)
export class EmployeeEntity extends BaseEntity {
  @Column({ name: 'employee_code', type: 'varchar', length: 64, nullable: false })
  employeeCode!: string;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: EmploymentType,
    enumName: 'employment_type',
    nullable: false,
  })
  employmentType!: EmploymentType;

  @Column({
    name: 'employment_status',
    type: 'enum',
    enum: EmploymentStatus,
    enumName: 'employment_status',
    nullable: false,
    default: EmploymentStatus.PENDING,
  })
  employmentStatus!: EmploymentStatus;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt!: Date | null;

  @Column({ name: 'probation_end_at', type: 'timestamptz', nullable: true })
  probationEndAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EmployeeStatus,
    enumName: 'employee_status',
    nullable: false,
    default: EmployeeStatus.INVITED,
  })
  status!: EmployeeStatus;

  @OneToOne(() => EmployeeProfileEntity, (profile) => profile.employee, {
    cascade: true,
  })
  profile?: EmployeeProfileEntity;

  @OneToOne(() => OnboardingEntity, (onboarding) => onboarding.employee, {
    cascade: true,
  })
  onboarding?: OnboardingEntity;

  @OneToMany(() => EmployeeDocumentEntity, (doc) => doc.employee)
  documents?: EmployeeDocumentEntity[];

  @OneToMany(() => EmployeeBankAccountEntity, (account) => account.employee)
  bankAccounts?: EmployeeBankAccountEntity[];

  @OneToMany(() => EmployeeTaxProfileEntity, (tax) => tax.employee)
  taxProfiles?: EmployeeTaxProfileEntity[];

  assignments?: EmploymentAssignmentEntity[];

  contracts?: EmploymentContractEntity[];
}

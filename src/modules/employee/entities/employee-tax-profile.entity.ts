import { BaseEntity } from '@new-hros/libs-sql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { EmployeeEntity } from './employee.entity';
import { TableName, TaxProfileStatus } from '../../../common/enums';
import type { TaxMetadata } from '../../../common/interfaces';

@Entity(TableName.EmployeeTaxProfile)
@Unique('uq_employee_tax_profiles_tenant_id', ['tenantCode', 'id'])
@Index('idx_employee_tax_profiles_employee', ['tenantCode', 'employeeId'])
@Index('idx_employee_tax_profiles_country', ['tenantCode', 'countryCode'])
@Index('uq_employee_tax_profiles_active_country', ['tenantCode', 'employeeId', 'countryCode'], {
  unique: true,
  where: "status = 'ACTIVE'",
})
@Check(
  'chk_employee_tax_profiles_dates',
  `effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from`,
)
export class EmployeeTaxProfileEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', nullable: false })
  employeeId: string;

  @Column({ name: 'country_code', type: 'varchar', length: 2, nullable: false })
  countryCode: string;

  @Column({ name: 'tax_number', type: 'varchar', length: 128, nullable: true })
  taxNumber: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TaxProfileStatus,
    enumName: 'tax_profile_status',
    nullable: false,
    default: TaxProfileStatus.PENDING,
  })
  status: TaxProfileStatus;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom: Date | null;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: TaxMetadata | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.taxProfiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;
}

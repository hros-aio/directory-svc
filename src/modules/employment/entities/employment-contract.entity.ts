import { BaseEntity } from '@new-hros/libs-sql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { EmploymentContractStatus, EmploymentContractType, TableName } from '../../../common/enums';
import { EmployeeEntity } from '../../employee/entities/employee.entity';

@Entity(TableName.EmploymentContract)
@Unique('uq_employment_contracts_tenant_id', ['tenantCode', 'id'])
@Unique('uq_employment_contracts_tenant_number', ['tenantCode', 'contractNumber'])
@Index('idx_employment_contracts_employee', ['tenantCode', 'employeeId'])
@Index('idx_employment_contracts_status', ['tenantCode', 'status'])
@Check('chk_employment_contracts_dates', `end_date IS NULL OR end_date >= start_date`)
export class EmploymentContractEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', nullable: false })
  employeeId: string;

  @Column({
    name: 'contract_type',
    type: 'enum',
    enum: EmploymentContractType,
    enumName: 'employment_contract_type',
    nullable: false,
  })
  contractType: EmploymentContractType;

  @Column({ name: 'contract_number', type: 'varchar', length: 128, nullable: true })
  contractNumber: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: false })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EmploymentContractStatus,
    enumName: 'employment_contract_status',
    nullable: false,
    default: EmploymentContractStatus.DRAFT,
  })
  status: EmploymentContractStatus;

  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  documentId: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @Column({ name: 'terminated_at', type: 'timestamptz', nullable: true })
  terminatedAt: Date | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.contracts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;
}

import { BaseEntity } from '@new-hros/libs-sql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { EmployeeEntity } from './employee.entity';
import { BankAccountStatus, TableName } from '../../../common/enums';

@Entity(TableName.EmployeeBankAccount)
@Unique('uq_employee_bank_accounts_tenant_id', ['tenantCode', 'id'])
@Index('idx_employee_bank_accounts_employee', ['tenantCode', 'employeeId'])
@Index('uq_employee_bank_accounts_primary', ['tenantCode', 'employeeId'], {
  unique: true,
  where: 'is_primary = TRUE',
})
@Check(
  'chk_employee_bank_accounts_dates',
  `effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from`,
)
export class EmployeeBankAccountEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', nullable: false })
  employeeId: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: false })
  bankName: string;

  @Column({ name: 'bank_code', type: 'varchar', length: 64, nullable: true })
  bankCode: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 128, nullable: false })
  accountNumber: string;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 255, nullable: false })
  accountHolderName: string;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, nullable: false })
  currencyCode: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: BankAccountStatus,
    enumName: 'bank_account_status',
    nullable: false,
    default: BankAccountStatus.PENDING,
  })
  status: BankAccountStatus;

  @Column({ name: 'is_primary', type: 'boolean', nullable: false, default: false })
  isPrimary: boolean;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom: Date | null;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.bankAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;
}

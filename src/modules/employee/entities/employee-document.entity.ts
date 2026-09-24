import { BaseEntity } from '@new-hros/libs-sql';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { EmployeeEntity } from './employee.entity';
import { EmployeeDocumentStatus, EmployeeDocumentType } from '../../../common/enums';

@Entity('employee_documents')
@Unique('uq_employee_documents_tenant_id', ['tenantCode', 'id'])
@Index('idx_employee_documents_employee', ['tenantCode', 'employeeId'])
@Index('idx_employee_documents_type_status', ['tenantCode', 'documentType', 'status'])
@Check(
  'chk_employee_documents_dates',
  `expired_at IS NULL OR issued_at IS NULL OR expired_at >= issued_at`,
)
export class EmployeeDocumentEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid', nullable: false })
  employeeId!: string;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: EmployeeDocumentType,
    enumName: 'employee_document_type',
    nullable: false,
  })
  documentType!: EmployeeDocumentType;

  @Column({ name: 'document_number', type: 'varchar', length: 128, nullable: true })
  documentNumber!: string | null;

  @Column({ name: 'file_id', type: 'uuid', nullable: false })
  fileId!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EmployeeDocumentStatus,
    enumName: 'employee_document_status',
    nullable: false,
    default: EmployeeDocumentStatus.PENDING,
  })
  status!: EmployeeDocumentStatus;

  @Column({ name: 'issued_at', type: 'date', nullable: true })
  issuedAt!: Date | null;

  @Column({ name: 'expired_at', type: 'date', nullable: true })
  expiredAt!: Date | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;
}

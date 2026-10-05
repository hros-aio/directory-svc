import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { EmployeeImportProfileEntity } from './employee-import-profile.entity';
import { TableName } from '../../../common/enums';
import type { ImportJobConfig } from '../../../common/interfaces';

@Entity(TableName.EmployeeImportJob)
@Index('idx_import_jobs_tenant_company_status', ['tenantCode', 'companyId', 'status'])
export class EmployeeImportJobEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ name: 'status', type: 'varchar', length: 32, nullable: false, default: 'PENDING' })
  status: string;

  @Column({ name: 'profile_id', type: 'uuid', nullable: true })
  profileId: string | null;

  @Column({ name: 'profile_version', type: 'integer', nullable: true })
  profileVersion: number | null;

  @Column({ name: 'config_snapshot', type: 'jsonb', nullable: false })
  configSnapshot: ImportJobConfig;

  @Column({ name: 'created_by', type: 'varchar', length: 64, nullable: false })
  createdBy: string;

  @ManyToOne(() => EmployeeImportProfileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_id' })
  profile?: EmployeeImportProfileEntity | null;
}

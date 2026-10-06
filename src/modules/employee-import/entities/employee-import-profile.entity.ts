import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index } from 'typeorm';

import { TableName } from '../../../common/enums';
import type { ImportJobConfig } from '../../../common/interfaces';

@Entity(TableName.EmployeeImportProfile)
@Index('idx_import_profiles_tenant_company_active', ['tenantCode', 'companyId', 'isActive'])
export class EmployeeImportProfileEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: false })
  companyId: string;

  @Column({ name: 'name', type: 'varchar', length: 128, nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'config', type: 'jsonb', nullable: false })
  config: ImportJobConfig;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 64, nullable: false })
  createdBy: string;
}

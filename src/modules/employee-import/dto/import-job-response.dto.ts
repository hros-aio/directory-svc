import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ImportJobConfig } from '../../../common/interfaces';
import type { EmployeeImportJobEntity } from '../entities/employee-import-job.entity';

export class ImportJobResponseDto {
  @ApiProperty({ description: 'Import job UUID identifier' })
  readonly id: string;

  @ApiProperty({ description: 'Owning tenant identifier' })
  readonly tenantCode: string;

  @ApiPropertyOptional({ description: 'Target company UUID for import' })
  readonly companyId: string | null;

  @ApiProperty({ description: 'Job execution lifecycle status' })
  readonly status: string;

  @ApiPropertyOptional({ description: 'Referenced profile ID (if selected)' })
  readonly profileId: string | null;

  @ApiPropertyOptional({ description: 'Referenced profile version (if selected)' })
  readonly profileVersion: number | null;

  @ApiProperty({
    description: 'Immutable effective configuration snapshot resolved at job creation',
  })
  readonly configSnapshot: ImportJobConfig;

  @ApiProperty({ description: 'ID of the initiator' })
  readonly createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  readonly updatedAt: Date;

  constructor(entity: EmployeeImportJobEntity) {
    this.id = entity.id;
    this.tenantCode = entity.tenantCode;
    this.companyId = entity.companyId ?? null;
    this.status = entity.status;
    this.profileId = entity.profileId ?? null;
    this.profileVersion = entity.profileVersion ?? null;
    this.configSnapshot = entity.configSnapshot;
    this.createdBy = entity.createdBy;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}

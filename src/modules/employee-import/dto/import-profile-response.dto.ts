import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ImportJobConfig } from '../../../common/interfaces';
import type { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';

export class ImportProfileResponseDto {
  @ApiProperty({ description: 'Profile UUID identifier' })
  readonly id: string;

  @ApiPropertyOptional({ description: 'Tenant code, or null for system profiles' })
  readonly tenantCode: string | null;

  @ApiPropertyOptional({
    description: 'Scoped company UUID, or null for tenant-wide or system profiles',
  })
  readonly companyId: string | null;

  @ApiProperty({ description: 'Profile name' })
  readonly name: string;

  @ApiPropertyOptional({ description: 'Profile description' })
  readonly description: string | null;

  @ApiProperty({ description: 'Full policy configuration document' })
  readonly config: ImportJobConfig;

  @ApiProperty({ description: 'Optimistic concurrency version number' })
  readonly version: number;

  @ApiProperty({ description: 'Active status' })
  readonly isActive: boolean;

  @ApiProperty({ description: 'Whether this is a system-level profile' })
  readonly isSystem: boolean;

  @ApiProperty({ description: 'ID of the creator' })
  readonly createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  readonly updatedAt: Date;

  constructor(entity: EmployeeImportProfileEntity) {
    this.id = entity.id;
    this.tenantCode = entity.tenantCode;
    this.companyId = entity.companyId ?? null;
    this.name = entity.name;
    this.description = entity.description ?? null;
    this.config = entity.config;
    this.version = entity.version;
    this.isActive = entity.isActive;
    this.isSystem = entity.tenantCode === null;
    this.createdBy = entity.createdBy;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}

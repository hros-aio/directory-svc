import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { PartialImportJobConfigDto } from '../validators/configuration.validator';

export class UpdateImportProfileDto {
  @ApiPropertyOptional({
    description: 'Expected version token for optimistic concurrency control',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly expectedVersion?: number;

  @ApiPropertyOptional({
    description: 'Updated profile name',
    example: 'Updated Employee Bulk Import',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly name?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Updated scoped company UUID. Pass null or omitted to keep or clear.',
    example: 'e5b8d2a6-9f3c-4217-b715-2f9876543210',
  })
  @IsOptional()
  @IsUUID('4')
  readonly companyId?: string | null;

  @ApiPropertyOptional({ description: 'Partial configuration overrides' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialImportJobConfigDto)
  readonly config?: PartialImportJobConfigDto;
}

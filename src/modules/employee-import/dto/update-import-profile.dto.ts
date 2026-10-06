import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

import { PartialImportJobConfigDto } from '../validators/configuration.validator';

export class UpdateImportProfileDto {
  @ApiPropertyOptional({
    description: 'Expected version token for optimistic concurrency control',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;

  @ApiPropertyOptional({
    description: 'Updated profile name',
    example: 'Updated Employee Bulk Import',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Partial configuration overrides' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialImportJobConfigDto)
  config?: PartialImportJobConfigDto;
}

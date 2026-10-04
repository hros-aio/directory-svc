import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { ImportJobConfigDto } from '../validators/configuration.validator';

export class CreateImportProfileDto {
  @ApiProperty({
    description: 'Name of the import profile',
    example: 'Standard Employee Bulk Import',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  readonly name: string;

  @ApiPropertyOptional({ description: 'Optional description of the profile' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Optional scoped company UUID. If omitted, profile is tenant-wide.',
    example: 'e5b8d2a6-9f3c-4217-b715-2f9876543210',
  })
  @IsOptional()
  @IsUUID('4')
  readonly companyId?: string;

  @ApiProperty({ description: 'Validated import policies configuration' })
  @ValidateNested()
  @Type(() => ImportJobConfigDto)
  readonly config: ImportJobConfigDto;
}

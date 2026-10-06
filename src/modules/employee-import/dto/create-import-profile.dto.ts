import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { ImportJobConfigDto } from '../validators/configuration.validator';

export class CreateImportProfileDto {
  @ApiProperty({
    description: 'Name of the import profile',
    example: 'Standard Employee Bulk Import',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description of the profile' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Validated import policies configuration' })
  @ValidateNested()
  @Type(() => ImportJobConfigDto)
  config: ImportJobConfigDto;
}

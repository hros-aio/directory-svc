import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';

import { PartialImportJobConfigDto } from '../validators/configuration.validator';

export class CreateImportJobDto {
  @ApiPropertyOptional({
    description: 'Optional ID of reusable import profile to use',
    example: 'a4d3f56b-8c1e-450a-8d76-123456789abc',
  })
  @IsOptional()
  @IsUUID('4')
  profileId?: string;

  @ApiPropertyOptional({ description: 'Optional job-level policy overrides' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialImportJobConfigDto)
  overrides?: PartialImportJobConfigDto;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { AddressDto } from './create-employee.dto';
import { EmployeeStatus, EmploymentStatus, EmploymentType } from '../../../common/enums';

export class UpdateEmployeeDto {
  // --- Employee Code (Immutable Guard) ---
  @ApiPropertyOptional({ description: 'Employee code is immutable and cannot be updated' })
  @IsOptional()
  @IsString()
  readonly employeeCode?: string;

  // --- Identity & Profile ---
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly lastName?: string;

  @ApiPropertyOptional({ example: 'Alexander' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly middleName?: string | null;

  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly preferredName?: string | null;

  @ApiPropertyOptional({ example: '1992-05-15' })
  @IsOptional()
  @IsDateString()
  readonly dateOfBirth?: string | null;

  @ApiPropertyOptional({ example: 'FEMALE' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  readonly gender?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/emp001.png' })
  @IsOptional()
  @IsString()
  readonly avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'jane.doe@personal.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  readonly personalEmail?: string | null;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly personalPhone?: string | null;

  @ApiPropertyOptional({ type: () => AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  readonly address?: AddressDto | null;

  // --- Employment ---
  @ApiPropertyOptional({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsOptional()
  @IsEnum(EmploymentType)
  readonly employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: EmploymentStatus, example: EmploymentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  readonly employmentStatus?: EmploymentStatus;

  @ApiPropertyOptional({ enum: EmployeeStatus, example: EmployeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  readonly status?: EmployeeStatus;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  readonly joinedAt?: string | null;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  readonly probationEndAt?: string | null;

  @ApiPropertyOptional({ example: '2028-10-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  readonly endedAt?: string | null;

  // --- Organization Assignment ---
  @ApiPropertyOptional({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsOptional()
  @IsUUID('4')
  readonly companyId?: string;

  @ApiPropertyOptional({ example: '2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  readonly locationId?: string | null;

  @ApiPropertyOptional({ example: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  readonly departmentId?: string | null;

  @ApiPropertyOptional({ example: '3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  readonly gradeId?: string | null;

  @ApiPropertyOptional({ example: '4e9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  readonly jobTitleId?: string | null;

  @ApiPropertyOptional({ example: '5f9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  readonly managerId?: string | null;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  readonly effectiveFrom?: string;
}

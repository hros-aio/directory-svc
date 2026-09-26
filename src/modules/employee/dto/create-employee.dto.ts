import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { EmploymentStatus, EmploymentType } from '../../../common/enums';

export class AddressDto {
  @ApiPropertyOptional({ example: '123 Tech Park Ave' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({ example: 'Suite 400' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'California' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateOrProvince?: string;

  @ApiPropertyOptional({ example: '94107' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;
}

export class CreateEmployeeDto {
  // --- Identity & Profile ---
  @ApiProperty({ example: 'EMP-00101', description: 'Unique employee code within tenant' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'employeeCode must contain only alphanumeric characters, underscores, or hyphens',
  })
  employeeCode: string;

  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'Alexander' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string;

  @ApiPropertyOptional({ example: '1992-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'FEMALE' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  gender?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/emp001.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'jane.doe@personal.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  personalEmail?: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  personalPhone?: string;

  @ApiPropertyOptional({ type: () => AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  // --- Employment ---
  @ApiProperty({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsNotEmpty()
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiPropertyOptional({ enum: EmploymentStatus, example: EmploymentStatus.PENDING })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  probationEndAt?: string;

  @ApiPropertyOptional({ example: '2028-10-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  // --- Organization Assignment ---
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsNotEmpty()
  @IsUUID('4')
  companyId: string;

  @ApiPropertyOptional({ example: '2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  locationId?: string;

  @ApiPropertyOptional({ example: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiPropertyOptional({ example: '3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  gradeId?: string;

  @ApiPropertyOptional({ example: '4e9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  jobTitleId?: string;

  @ApiPropertyOptional({ example: '5f9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  @IsOptional()
  @IsUUID('4')
  managerId?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

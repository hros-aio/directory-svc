import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EmployeeEntity, EmployeeProfileEntity } from '../entities';

import { EmploymentAssignmentEntity } from '@/modules/employment';

export class ResolvedReferenceDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id: string;

  @ApiPropertyOptional({ example: 'CORP-HQ' })
  code?: string;

  @ApiProperty({ example: 'Acme Holdings Pte Ltd' })
  name: string;
}

export class ResolvedManagerDto {
  @ApiProperty({ example: '5f9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' })
  id: string;

  @ApiProperty({ example: 'EMP-00001' })
  employeeCode: string;

  @ApiProperty({ example: 'Alice Smith' })
  fullName: string;
}

export class EmployeeProfileResponseDto {
  @ApiProperty({ example: 'Jane' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Alexander' })
  middleName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: 'Jane' })
  preferredName: string;

  @ApiProperty({ example: 'Jane Alexander Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: '1992-05-15' })
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 'FEMALE' })
  gender: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/emp001.png' })
  avatarUrl: string;

  @ApiPropertyOptional({ example: 'jane.doe@personal.com' })
  personalEmail: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  personalPhone: string;

  @ApiPropertyOptional({ example: { city: 'San Francisco', countryCode: 'US' } })
  address: Record<string, unknown>;
}

export class AssignmentResponseDto {
  @ApiProperty({ example: 'a5eaaaf2-d142-11e1-b3e4-080027620cdd' })
  id: string;

  @ApiProperty({ example: '2026-10-01' })
  effectiveFrom: string;

  @ApiPropertyOptional({ example: null })
  effectiveTo?: string;

  @ApiProperty({ type: () => ResolvedReferenceDto })
  company: ResolvedReferenceDto;

  @ApiPropertyOptional({ type: () => ResolvedReferenceDto })
  department?: ResolvedReferenceDto;

  @ApiPropertyOptional({ type: () => ResolvedReferenceDto })
  location?: ResolvedReferenceDto;

  @ApiPropertyOptional({ type: () => ResolvedReferenceDto })
  grade?: ResolvedReferenceDto;

  @ApiPropertyOptional({ type: () => ResolvedReferenceDto })
  jobTitle?: ResolvedReferenceDto;

  @ApiPropertyOptional({ type: () => ResolvedManagerDto })
  manager?: ResolvedManagerDto;
}

export class EmployeeResponseDto {
  @ApiProperty({ example: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd' })
  id: string;

  @ApiProperty({ example: 'tenant-corp-001' })
  tenantCode: string;

  @ApiProperty({ example: 'EMP-00101' })
  employeeCode: string;

  @ApiProperty({ example: 'INVITED' })
  status: string;

  @ApiProperty({ example: 'FULL_TIME' })
  employmentType: string;

  @ApiProperty({ example: 'PENDING' })
  employmentStatus: string;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  joinedAt: string;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z' })
  probationEndAt: string;

  @ApiPropertyOptional({ example: null })
  endedAt: string;

  @ApiProperty({ example: '2026-09-26T14:50:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-26T14:50:00.000Z' })
  updatedAt: string;

  @ApiProperty({ type: () => EmployeeProfileResponseDto })
  profile: EmployeeProfileResponseDto;

  @ApiProperty({ type: () => AssignmentResponseDto })
  currentAssignment: AssignmentResponseDto;

  static mapToResponseDto(
    employee: EmployeeEntity,
    profile: EmployeeProfileEntity,
    assignment: EmploymentAssignmentEntity,
    resolved: {
      company: { id: string; code?: string; name: string };
      department?: { id: string; code?: string; name: string };
      location?: { id: string; name: string };
      grade?: { id: string; code?: string; name: string };
      jobTitle?: { id: string; code?: string; name: string };
    },
    resolvedManager?: ResolvedManagerDto,
  ): EmployeeResponseDto {
    const fullName = [profile.firstName, profile.middleName, profile.lastName]
      .filter(Boolean)
      .join(' ');

    const profileDto: EmployeeProfileResponseDto = {
      firstName: profile.firstName,
      middleName: profile.middleName || '',
      lastName: profile.lastName,
      preferredName: profile.preferredName || '',
      fullName,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      avatarUrl: profile.avatarUrl || '',
      personalEmail: profile.personalEmail || '',
      personalPhone: profile.personalPhone || '',
      address: profile.address as Record<string, unknown>,
    };

    const assignmentDto: AssignmentResponseDto = {
      id: assignment.id,
      effectiveFrom:
        assignment.effectiveFrom instanceof Date
          ? assignment.effectiveFrom.toISOString().split('T')[0]
          : String(assignment.effectiveFrom),
      effectiveTo: assignment.effectiveTo
        ? assignment.effectiveTo instanceof Date
          ? assignment.effectiveTo.toISOString().split('T')[0]
          : String(assignment.effectiveTo)
        : '',
      company: resolved.company,
      department: resolved.department,
      location: resolved.location,
      grade: resolved.grade,
      jobTitle: resolved.jobTitle,
      manager: resolvedManager,
    };

    return {
      id: employee.id,
      tenantCode: employee.tenantCode,
      employeeCode: employee.employeeCode,
      status: employee.status,
      employmentType: employee.employmentType,
      employmentStatus: employee.employmentStatus,
      joinedAt: employee.joinedAt ? employee.joinedAt.toISOString() : '',
      probationEndAt: employee.probationEndAt ? employee.probationEndAt.toISOString() : '',
      endedAt: employee.endedAt ? employee.endedAt.toISOString() : '',
      createdAt: employee.createdAt ? employee.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: employee.updatedAt ? employee.updatedAt.toISOString() : new Date().toISOString(),
      profile: profileDto,
      currentAssignment: assignmentDto,
    };
  }
}

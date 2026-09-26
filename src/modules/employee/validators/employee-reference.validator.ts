import { Injectable } from '@nestjs/common';
import { BusinessException } from '@new-hros/libs-core';
import { CompanyStatus, MasterDataStatus } from '@new-hros/libs-sql';

import {
  CompanyProjectionRepository,
  DepartmentProjectionRepository,
  GradeProjectionRepository,
  JobTitleProjectionRepository,
  LocationProjectionRepository,
} from '../../provisioning/repositories';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { ResolvedReferenceDto } from '../dto/employee-response.dto';

export interface ValidatedOrganizationReferences {
  readonly company: ResolvedReferenceDto;
  readonly department: ResolvedReferenceDto | null;
  readonly location: ResolvedReferenceDto | null;
  readonly grade: ResolvedReferenceDto | null;
  readonly jobTitle: ResolvedReferenceDto | null;
}

@Injectable()
export class EmployeeReferenceValidator {
  constructor(
    private readonly companyRepository: CompanyProjectionRepository,
    private readonly departmentRepository: DepartmentProjectionRepository,
    private readonly locationRepository: LocationProjectionRepository,
    private readonly gradeRepository: GradeProjectionRepository,
    private readonly jobTitleRepository: JobTitleProjectionRepository,
  ) {}

  async validateAndResolve(
    dto: CreateEmployeeDto,
    tenantCode: string,
  ): Promise<ValidatedOrganizationReferences> {
    // 1. Validate Company
    const company = await this.companyRepository.findByIdAndTenant(dto.companyId, tenantCode);
    if (!company || company.status !== CompanyStatus.ACTIVE) {
      throw new BusinessException(
        `Company '${dto.companyId}' not found or inactive`,
        'COMPANY_NOT_FOUND',
        404,
      );
    }

    // 2. Validate Department (if provided)
    let resolvedDepartment: ResolvedReferenceDto | null = null;
    if (dto.departmentId) {
      const department = await this.departmentRepository.findByIdAndTenant(
        dto.departmentId,
        tenantCode,
      );
      if (!department || department.status !== MasterDataStatus.ACTIVE) {
        throw new BusinessException(
          `Department '${dto.departmentId}' not found or inactive`,
          'DEPARTMENT_NOT_FOUND',
          404,
        );
      }
      if (department.companyId !== dto.companyId) {
        throw new BusinessException(
          `Department '${dto.departmentId}' does not belong to company '${dto.companyId}'`,
          'INVALID_ORGANIZATION_ASSIGNMENT',
          400,
        );
      }
      resolvedDepartment = {
        id: department.id,
        code: department.code,
        name: department.name,
      };
    }

    // 3. Validate Location (if provided)
    let resolvedLocation: ResolvedReferenceDto | null = null;
    if (dto.locationId) {
      const location = await this.locationRepository.findByIdAndTenant(dto.locationId, tenantCode);
      if (!location || location.status !== MasterDataStatus.ACTIVE) {
        throw new BusinessException(
          `Location '${dto.locationId}' not found or inactive`,
          'LOCATION_NOT_FOUND',
          404,
        );
      }
      if (location.companyId !== dto.companyId) {
        throw new BusinessException(
          `Location '${dto.locationId}' does not belong to company '${dto.companyId}'`,
          'INVALID_ORGANIZATION_ASSIGNMENT',
          400,
        );
      }
      resolvedLocation = {
        id: location.id,
        code: location.code,
        name: location.name,
      };
    }

    // 4. Validate Grade (if provided)
    let resolvedGrade: ResolvedReferenceDto | null = null;
    if (dto.gradeId) {
      const grade = await this.gradeRepository.findByIdAndTenant(dto.gradeId, tenantCode);
      if (!grade || grade.status !== MasterDataStatus.ACTIVE) {
        throw new BusinessException(
          `Grade '${dto.gradeId}' not found or inactive`,
          'GRADE_NOT_FOUND',
          404,
        );
      }
      resolvedGrade = {
        id: grade.id,
        code: grade.code,
        name: grade.name,
      };
    }

    // 5. Validate Job Title (if provided)
    let resolvedJobTitle: ResolvedReferenceDto | null = null;
    if (dto.jobTitleId) {
      const jobTitle = await this.jobTitleRepository.findByIdAndTenant(dto.jobTitleId, tenantCode);
      if (!jobTitle || jobTitle.status !== MasterDataStatus.ACTIVE) {
        throw new BusinessException(
          `Job Title '${dto.jobTitleId}' not found or inactive`,
          'JOB_TITLE_NOT_FOUND',
          404,
        );
      }
      resolvedJobTitle = {
        id: jobTitle.id,
        code: jobTitle.code,
        name: jobTitle.name,
      };
    }

    return {
      company: {
        id: company.id,
        code: company.companyCode,
        name: company.displayName || company.legalName,
      },
      department: resolvedDepartment,
      location: resolvedLocation,
      grade: resolvedGrade,
      jobTitle: resolvedJobTitle,
    };
  }
}

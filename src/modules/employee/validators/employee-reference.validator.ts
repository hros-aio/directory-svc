import { Injectable } from '@nestjs/common';
import { BusinessException } from '@new-hros/libs-core';
import { CompanyStatus, MasterDataStatus } from '@new-hros/libs-sql';

import { EmploymentAssignmentEntity } from '../../employment/entities/employment-assignment.entity';
import {
  CompanyProjectionRepository,
  DepartmentProjectionRepository,
  GradeProjectionRepository,
  JobTitleProjectionRepository,
  LocationProjectionRepository,
} from '../../provisioning/repositories';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { ResolvedReferenceDto } from '../dto/employee-response.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';

export interface ValidatedOrganizationReferences {
  readonly company: ResolvedReferenceDto;
  readonly department?: ResolvedReferenceDto;
  readonly location?: ResolvedReferenceDto;
  readonly grade?: ResolvedReferenceDto;
  readonly jobTitle?: ResolvedReferenceDto;
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

  async validateAndResolve(dto: CreateEmployeeDto): Promise<ValidatedOrganizationReferences> {
    // 1. Validate Company
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company || company.status !== CompanyStatus.ACTIVE) {
      throw new BusinessException(
        `Company '${dto.companyId}' not found or inactive`,
        'COMPANY_NOT_FOUND',
        404,
      );
    }

    // 2. Validate Department (if provided)
    let resolvedDepartment: ResolvedReferenceDto | undefined = undefined;
    if (dto.departmentId) {
      const department = await this.departmentRepository.findById(dto.departmentId);
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
    let resolvedLocation: ResolvedReferenceDto | undefined = undefined;
    if (dto.locationId) {
      const location = await this.locationRepository.findById(dto.locationId);
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
    let resolvedGrade: ResolvedReferenceDto | undefined = undefined;
    if (dto.gradeId) {
      const grade = await this.gradeRepository.findById(dto.gradeId);
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
    let resolvedJobTitle: ResolvedReferenceDto | undefined = undefined;
    if (dto.jobTitleId) {
      const jobTitle = await this.jobTitleRepository.findById(dto.jobTitleId);
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

  async validateAndResolveForUpdate(
    dto: UpdateEmployeeDto,
    currentAssignment?: EmploymentAssignmentEntity | null,
  ): Promise<ValidatedOrganizationReferences> {
    const effectiveCompanyId = dto.companyId ?? currentAssignment?.companyId;
    if (!effectiveCompanyId) {
      throw new BusinessException(
        'Company reference is missing for employee assignment',
        'COMPANY_NOT_FOUND',
        404,
      );
    }

    // 1. Validate Company
    const company = await this.companyRepository.findById(effectiveCompanyId);
    if (!company || company.status !== CompanyStatus.ACTIVE) {
      throw new BusinessException(
        `Company '${effectiveCompanyId}' not found or inactive`,
        'COMPANY_NOT_FOUND',
        404,
      );
    }

    // 2. Validate Department
    let resolvedDepartment: ResolvedReferenceDto | undefined = undefined;
    if (dto.departmentId !== undefined) {
      if (dto.departmentId !== null) {
        const department = await this.departmentRepository.findById(dto.departmentId);
        if (!department || department.status !== MasterDataStatus.ACTIVE) {
          throw new BusinessException(
            `Department '${dto.departmentId}' not found or inactive`,
            'DEPARTMENT_NOT_FOUND',
            404,
          );
        }
        if (department.companyId !== effectiveCompanyId) {
          throw new BusinessException(
            `Department '${dto.departmentId}' does not belong to company '${effectiveCompanyId}'`,
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
    } else if (currentAssignment?.departmentId) {
      const department = await this.departmentRepository.findById(currentAssignment.departmentId);
      if (dto.companyId !== undefined && dto.companyId !== currentAssignment.companyId) {
        if (!department || department.companyId !== effectiveCompanyId) {
          throw new BusinessException(
            `Department '${currentAssignment.departmentId}' does not belong to company '${effectiveCompanyId}'`,
            'INVALID_ORGANIZATION_ASSIGNMENT',
            400,
          );
        }
      }
      if (department) {
        resolvedDepartment = {
          id: department.id,
          code: department.code,
          name: department.name,
        };
      }
    }

    // 3. Validate Location
    let resolvedLocation: ResolvedReferenceDto | undefined = undefined;
    if (dto.locationId !== undefined) {
      if (dto.locationId !== null) {
        const location = await this.locationRepository.findById(dto.locationId);
        if (!location || location.status !== MasterDataStatus.ACTIVE) {
          throw new BusinessException(
            `Location '${dto.locationId}' not found or inactive`,
            'LOCATION_NOT_FOUND',
            404,
          );
        }
        if (location.companyId !== effectiveCompanyId) {
          throw new BusinessException(
            `Location '${dto.locationId}' does not belong to company '${effectiveCompanyId}'`,
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
    } else if (currentAssignment?.locationId) {
      const location = await this.locationRepository.findById(currentAssignment.locationId);
      if (dto.companyId !== undefined && dto.companyId !== currentAssignment.companyId) {
        if (!location || location.companyId !== effectiveCompanyId) {
          throw new BusinessException(
            `Location '${currentAssignment.locationId}' does not belong to company '${effectiveCompanyId}'`,
            'INVALID_ORGANIZATION_ASSIGNMENT',
            400,
          );
        }
      }
      if (location) {
        resolvedLocation = {
          id: location.id,
          code: location.code,
          name: location.name,
        };
      }
    }

    // 4. Validate Grade
    let resolvedGrade: ResolvedReferenceDto | undefined = undefined;
    if (dto.gradeId !== undefined) {
      if (dto.gradeId !== null) {
        const grade = await this.gradeRepository.findById(dto.gradeId);
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
    } else if (currentAssignment?.gradeId) {
      const grade = await this.gradeRepository.findById(currentAssignment.gradeId);
      if (grade) {
        resolvedGrade = {
          id: grade.id,
          code: grade.code,
          name: grade.name,
        };
      }
    }

    // 5. Validate Job Title
    let resolvedJobTitle: ResolvedReferenceDto | undefined = undefined;
    if (dto.jobTitleId !== undefined) {
      if (dto.jobTitleId !== null) {
        const jobTitle = await this.jobTitleRepository.findById(dto.jobTitleId);
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
    } else if (currentAssignment?.jobTitleId) {
      const jobTitle = await this.jobTitleRepository.findById(currentAssignment.jobTitleId);
      if (jobTitle) {
        resolvedJobTitle = {
          id: jobTitle.id,
          code: jobTitle.code,
          name: jobTitle.name,
        };
      }
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

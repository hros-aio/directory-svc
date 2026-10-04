import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, RequestContextService } from '@new-hros/libs-core';
import { CompanyStatus } from '@new-hros/libs-sql';

import { ConfigurationResolverService } from './configuration-resolver.service';
import type { ImportJobConfig } from '../../../common/interfaces';
import { CompanyProjectionRepository } from '../../provisioning/repositories/company-projection.repository';
import type { CreateImportJobDto } from '../dto/create-import-job.dto';
import { ImportJobResponseDto } from '../dto/import-job-response.dto';
import { EmployeeImportJobRepository } from '../repositories/employee-import-job.repository';
import { EmployeeImportProfileRepository } from '../repositories/employee-import-profile.repository';

@Injectable()
export class EmployeeImportJobService {
  constructor(
    private readonly jobRepository: EmployeeImportJobRepository,
    private readonly profileRepository: EmployeeImportProfileRepository,
    private readonly resolverService: ConfigurationResolverService,
    private readonly companyProjectionRepository: CompanyProjectionRepository,
  ) {}

  /**
   * Creates an employee import job and persists the resolved effective configuration
   * as an immutable snapshot.
   */
  async createJob(dto: CreateImportJobDto): Promise<ImportJobResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const actorId = RequestContextService.getUser().userId;

    if (dto.companyId) {
      await this.validateCompany(dto.companyId, tenantCode);
    }

    let profileId: string | null = null;
    let profileVersion: number | null = null;
    let profileConfig: ImportJobConfig | null = null;
    let effectiveCompanyId: string | null = dto.companyId ?? null;

    if (dto.profileId) {
      const profile = await this.profileRepository.findByIdAccessible(dto.profileId, tenantCode);

      if (!profile) {
        throw new BusinessException(
          `Import profile with ID '${dto.profileId}' not found`,
          'PROFILE_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!profile.isActive) {
        throw new BusinessException(
          `Cannot create import job: referenced profile '${profile.name}' is inactive`,
          'PROFILE_INACTIVE',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check company scope compatibility
      if (profile.companyId) {
        if (!dto.companyId) {
          effectiveCompanyId = profile.companyId;
        } else if (dto.companyId !== profile.companyId) {
          throw new BusinessException(
            `Job companyId '${dto.companyId}' does not match referenced profile companyId '${profile.companyId}'`,
            'COMPANY_SCOPE_MISMATCH',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      profileId = profile.id;
      profileVersion = profile.version;
      profileConfig = profile.config;
    }

    // Resolve 3-tier effective configuration with system safety limit checks
    const resolvedConfig = this.resolverService.resolve(profileConfig, dto.overrides);

    const savedJob = await this.jobRepository.create({
      tenantCode,
      companyId: effectiveCompanyId,
      status: 'PENDING',
      profileId,
      profileVersion,
      configSnapshot: resolvedConfig,
      createdBy: actorId,
    });

    return new ImportJobResponseDto(savedJob);
  }

  async getJobById(id: string): Promise<ImportJobResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const job = await this.jobRepository.findByIdAndTenant(id, tenantCode);

    if (!job) {
      throw new BusinessException(
        `Import job with ID '${id}' not found`,
        'JOB_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return new ImportJobResponseDto(job);
  }

  private async validateCompany(companyId: string, tenantCode: string): Promise<void> {
    const company = await this.companyProjectionRepository.findOne(
      { id: companyId, tenantCode },
      { withTenancy: false },
    );
    if (!company) {
      throw new BusinessException(
        `Company with ID '${companyId}' not found for tenant '${tenantCode}'`,
        'COMPANY_NOT_FOUND',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (company.status !== CompanyStatus.ACTIVE) {
      throw new BusinessException(
        `Company with ID '${companyId}' is not active`,
        'COMPANY_INACTIVE',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

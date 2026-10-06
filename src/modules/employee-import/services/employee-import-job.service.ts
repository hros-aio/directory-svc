import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, RequestContextService } from '@new-hros/libs-core';

import { ConfigurationResolverService } from './configuration-resolver.service';
import type { ImportJobConfig } from '../../../common/interfaces';
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
  ) {}

  /**
   * Creates an employee import job and persists the resolved effective configuration
   * as an immutable snapshot.
   */
  async createJob(dto: CreateImportJobDto): Promise<ImportJobResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const actorId = RequestContextService.getUser().userId;

    let profileId: string | null = null;
    let profileVersion: number | null = null;
    let profileConfig: ImportJobConfig | null = null;
    let effectiveCompanyId: string | null = null;

    if (dto.profileId) {
      const profile = await this.profileRepository.findById(dto.profileId, { required: true });
      if (!profile.isActive) {
        throw new BusinessException(
          `Cannot create import job: referenced profile '${profile.name}' is inactive`,
          'PROFILE_INACTIVE',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check company scope compatibility

      profileId = profile.id;
      profileVersion = profile.version;
      profileConfig = profile.config;
      effectiveCompanyId = profile.companyId;
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
    const job = await this.jobRepository.findById(id, { required: true });

    return new ImportJobResponseDto(job);
  }
}

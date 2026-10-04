import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, RequestContextService } from '@new-hros/libs-core';
import { CompanyStatus } from '@new-hros/libs-sql';

import type { ImportJobConfig } from '../../../common/interfaces';
import { CompanyProjectionRepository } from '../../provisioning/repositories/company-projection.repository';
import type { CreateImportProfileDto, UpdateImportProfileDto } from '../dto';
import { ImportProfileResponseDto } from '../dto/import-profile-response.dto';
import { EmployeeImportProfileRepository } from '../repositories/employee-import-profile.repository';
import { ConfigurationValidator, DeepPartial } from '../validators/configuration.validator';

@Injectable()
export class EmployeeImportProfileService {
  constructor(
    private readonly profileRepository: EmployeeImportProfileRepository,
    private readonly configurationValidator: ConfigurationValidator,
    private readonly companyProjectionRepository: CompanyProjectionRepository,
  ) {}

  async create(dto: CreateImportProfileDto): Promise<ImportProfileResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const actorId = RequestContextService.getUser().userId;

    if (dto.companyId) {
      await this.validateCompany(dto.companyId, tenantCode);
    }

    // Check name uniqueness within tenant & company scope
    const existing = await this.profileRepository.findByNameAndTenant(
      dto.name.trim(),
      tenantCode,
      dto.companyId ?? null,
    );
    if (existing) {
      throw new BusinessException(
        `Profile with name '${dto.name}' already exists in tenant '${tenantCode}'`,
        'DUPLICATE_PROFILE_NAME',
        HttpStatus.CONFLICT,
      );
    }

    // Validate configuration
    const validatedConfig = this.configurationValidator.validateComplete(dto.config);

    const saved = await this.profileRepository.create({
      tenantCode,
      companyId: dto.companyId ?? null,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      config: validatedConfig,
      isActive: true,
      createdBy: actorId,
    });

    return new ImportProfileResponseDto(saved);
  }

  async list(isActive?: boolean, companyId?: string): Promise<ImportProfileResponseDto[]> {
    const tenantCode = RequestContextService.getTenantCode();
    const profiles = await this.profileRepository.findAccessibleProfiles(
      tenantCode,
      isActive,
      companyId,
    );
    return profiles.map((p) => new ImportProfileResponseDto(p));
  }

  async getById(id: string): Promise<ImportProfileResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const profile = await this.profileRepository.findByIdAccessible(id, tenantCode);

    if (!profile) {
      throw new BusinessException(
        `Profile not found with ID: ${id}`,
        'PROFILE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return new ImportProfileResponseDto(profile);
  }

  async update(id: string, dto: UpdateImportProfileDto): Promise<ImportProfileResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const profile = await this.profileRepository.findById(id, { withTenancy: false });

    if (!profile) {
      throw new BusinessException(
        `Profile not found with ID: ${id}`,
        'PROFILE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // Protect system-level profiles from modification by tenant administrators
    if (profile.tenantCode === null) {
      throw new BusinessException(
        'System-level profiles are immutable and cannot be modified',
        'SYSTEM_PROFILE_IMMUTABLE',
        HttpStatus.FORBIDDEN,
      );
    }

    // Enforce tenant isolation
    if (profile.tenantCode !== tenantCode) {
      throw new BusinessException(
        `Profile not found with ID: ${id}`,
        'PROFILE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate company if updated
    if (dto.companyId !== undefined && dto.companyId !== null) {
      await this.validateCompany(dto.companyId, tenantCode);
    }

    // Optimistic concurrency control check
    if (dto.expectedVersion !== undefined && dto.expectedVersion !== profile.version) {
      throw new BusinessException(
        `Version conflict: expected version ${dto.expectedVersion} but current version is ${profile.version}`,
        'STALE_PROFILE_VERSION',
        HttpStatus.CONFLICT,
      );
    }

    // If name or companyId is changing, check uniqueness
    const targetName = dto.name ? dto.name.trim() : profile.name;
    const targetCompanyId = dto.companyId !== undefined ? dto.companyId : profile.companyId;

    if (dto.name || dto.companyId !== undefined) {
      const duplicate = await this.profileRepository.findByNameAndTenant(
        targetName,
        tenantCode,
        targetCompanyId,
      );
      if (duplicate && duplicate.id !== id) {
        throw new BusinessException(
          `Profile with name '${targetName}' already exists in tenant '${tenantCode}'`,
          'DUPLICATE_PROFILE_NAME',
          HttpStatus.CONFLICT,
        );
      }
    }

    let effectiveConfig = profile.config;
    if (dto.config) {
      const partialValidated = this.configurationValidator.validatePartial(dto.config);
      effectiveConfig = this.deepMergeConfig(profile.config, partialValidated);
      this.configurationValidator.validateComplete(effectiveConfig);
    }

    const expectedVersion = dto.expectedVersion ?? profile.version;
    const updateData: {
      name?: string;
      description?: string | null;
      companyId?: string | null;
      config?: ImportJobConfig;
    } = {};

    if (dto.name) {
      updateData.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description?.trim() ?? null;
    }
    if (dto.companyId !== undefined) {
      updateData.companyId = dto.companyId;
    }
    if (dto.config) {
      updateData.config = effectiveConfig;
    }

    const updated = await this.profileRepository.updateWithVersion(id, expectedVersion, updateData);
    if (!updated) {
      throw new BusinessException(
        `Failed to update profile: version conflict occurred`,
        'STALE_PROFILE_VERSION',
        HttpStatus.CONFLICT,
      );
    }

    const refreshed = await this.profileRepository.findById(id, { withTenancy: false });
    return new ImportProfileResponseDto(refreshed!);
  }

  async activate(id: string): Promise<ImportProfileResponseDto> {
    return this.toggleActiveStatus(id, true);
  }

  async deactivate(id: string): Promise<ImportProfileResponseDto> {
    return this.toggleActiveStatus(id, false);
  }

  private async toggleActiveStatus(
    id: string,
    isActive: boolean,
  ): Promise<ImportProfileResponseDto> {
    const tenantCode = RequestContextService.getTenantCode();
    const profile = await this.profileRepository.findById(id, { withTenancy: false });

    if (!profile) {
      throw new BusinessException(
        `Profile not found with ID: ${id}`,
        'PROFILE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (profile.tenantCode === null) {
      throw new BusinessException(
        'System-level profiles cannot be activated or deactivated by tenants',
        'SYSTEM_PROFILE_IMMUTABLE',
        HttpStatus.FORBIDDEN,
      );
    }

    if (profile.tenantCode !== tenantCode) {
      throw new BusinessException(
        `Profile not found with ID: ${id}`,
        'PROFILE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.profileRepository.updateWithVersion(id, profile.version, {
      isActive,
    });
    if (!updated) {
      throw new BusinessException(
        `Failed to update profile status: version conflict occurred`,
        'STALE_PROFILE_VERSION',
        HttpStatus.CONFLICT,
      );
    }

    const refreshed = await this.profileRepository.findById(id, { withTenancy: false });
    return new ImportProfileResponseDto(refreshed!);
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

  private deepMergeConfig(
    base: ImportJobConfig,
    override: DeepPartial<ImportJobConfig>,
  ): ImportJobConfig {
    return {
      errorPolicy: {
        ...base.errorPolicy,
        ...(override.errorPolicy || {}),
      },
      retryPolicy: {
        ...base.retryPolicy,
        ...(override.retryPolicy || {}),
      },
      timeoutPolicy: {
        ...base.timeoutPolicy,
        ...(override.timeoutPolicy || {}),
      },
      executionPolicy: {
        ...base.executionPolicy,
        ...(override.executionPolicy || {}),
      },
    };
  }
}

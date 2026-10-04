import { Test, TestingModule } from '@nestjs/testing';
import { AuthContext, BusinessException, RequestContextService } from '@new-hros/libs-core';
import { Company, CompanyStatus } from '@new-hros/libs-sql';

import { EmployeeImportProfileService } from './employee-import-profile.service';
import { ImportRowErrorMode } from '../../../common/enums';
import type { ImportJobConfig } from '../../../common/interfaces';
import { CompanyProjectionRepository } from '../../provisioning/repositories/company-projection.repository';
import type { CreateImportProfileDto, UpdateImportProfileDto } from '../dto';
import { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';
import { EmployeeImportProfileRepository } from '../repositories/employee-import-profile.repository';
import { ConfigurationValidator } from '../validators/configuration.validator';

describe('EmployeeImportProfileService', () => {
  let service: EmployeeImportProfileService;
  let repository: jest.Mocked<EmployeeImportProfileRepository>;
  let companyRepo: jest.Mocked<CompanyProjectionRepository>;

  const tenantCode = 'TENANT_A';
  const userId = 'user-123';
  const companyId = 'e5b8d2a6-9f3c-4217-b715-2f9876543210';

  const sampleConfig: ImportJobConfig = {
    errorPolicy: {
      mode: ImportRowErrorMode.CONTINUE_ON_ROW_ERROR,
      maxErrorRows: 1000,
      maxErrorRate: 0.05,
    },
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2.0,
    },
    timeoutPolicy: {
      jobTimeoutSeconds: 1800,
      batchTimeoutSeconds: 60,
      idleTimeoutSeconds: 300,
    },
    executionPolicy: {
      batchSize: 500,
      maxConcurrentBatches: 1,
    },
  };

  const createProfileEntity = (
    overrides?: Omit<Partial<EmployeeImportProfileEntity>, 'tenantCode'> & {
      tenantCode?: string | null;
    },
  ): EmployeeImportProfileEntity => {
    const entity = new EmployeeImportProfileEntity();
    entity.id = overrides?.id ?? 'uuid-123';
    entity.tenantCode =
      overrides?.tenantCode !== undefined
        ? (overrides.tenantCode as unknown as string)
        : tenantCode;
    entity.companyId = overrides?.companyId ?? null;
    entity.name = overrides?.name ?? 'Standard Import';
    entity.description = overrides?.description ?? 'Sample description';
    entity.config = overrides?.config ?? sampleConfig;
    entity.version = overrides?.version ?? 1;
    entity.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    entity.createdBy = overrides?.createdBy ?? userId;
    entity.createdAt = overrides?.createdAt ?? new Date('2026-10-04T10:00:00Z');
    entity.updatedAt = overrides?.updatedAt ?? new Date('2026-10-04T10:00:00Z');
    return entity;
  };

  beforeEach(async () => {
    jest.spyOn(RequestContextService, 'getTenantCode').mockReturnValue(tenantCode);
    jest.spyOn(RequestContextService, 'getUser').mockReturnValue({
      userId,
      tenantCode,
      sessionId: 'session-1',
      roles: ['ADMIN'],
      scopes: [],
      permissions: ['import_profile.create', 'import_profile.update'],
    } as unknown as AuthContext);

    const mockRepo = {
      create: jest.fn(),
      findByNameAndTenant: jest.fn(),
      findAccessibleProfiles: jest.fn(),
      findByIdAccessible: jest.fn(),
      findById: jest.fn(),
      updateWithVersion: jest.fn(),
    };

    const mockCompanyRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeImportProfileService,
        ConfigurationValidator,
        {
          provide: EmployeeImportProfileRepository,
          useValue: mockRepo,
        },
        {
          provide: CompanyProjectionRepository,
          useValue: mockCompanyRepo,
        },
      ],
    }).compile();

    service = module.get<EmployeeImportProfileService>(EmployeeImportProfileService);
    repository = module.get(EmployeeImportProfileRepository);
    companyRepo = module.get(CompanyProjectionRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    const createDto: CreateImportProfileDto = {
      name: 'Standard Import',
      description: 'Test description',
      config: sampleConfig as unknown as CreateImportProfileDto['config'],
    };

    it('should create a tenant-wide profile successfully when companyId is omitted', async () => {
      repository.findByNameAndTenant.mockResolvedValue(null);
      const savedEntity = createProfileEntity();
      repository.create.mockResolvedValue(savedEntity);

      const result = await service.create(createDto);

      expect(repository.findByNameAndTenant).toHaveBeenCalledWith(
        'Standard Import',
        tenantCode,
        null,
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantCode,
          companyId: null,
          name: 'Standard Import',
          createdBy: userId,
          isActive: true,
        }),
      );
      expect(result.id).toBe(savedEntity.id);
      expect(result.name).toBe('Standard Import');
      expect(result.companyId).toBeNull();
      expect(result.isSystem).toBe(false);
    });

    it('should create a company-scoped profile when valid active companyId is provided', async () => {
      const activeCompany = { id: companyId, tenantCode, status: CompanyStatus.ACTIVE } as Company;
      companyRepo.findOne.mockResolvedValue(activeCompany);
      repository.findByNameAndTenant.mockResolvedValue(null);

      const savedEntity = createProfileEntity({ companyId });
      repository.create.mockResolvedValue(savedEntity);

      const result = await service.create({
        ...createDto,
        companyId,
      });

      expect(companyRepo.findOne).toHaveBeenCalledWith(
        { id: companyId, tenantCode },
        { withTenancy: false },
      );
      expect(repository.findByNameAndTenant).toHaveBeenCalledWith(
        'Standard Import',
        tenantCode,
        companyId,
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantCode,
          companyId,
          name: 'Standard Import',
        }),
      );
      expect(result.companyId).toBe(companyId);
    });

    it('should throw BadRequestException when companyId is not found', async () => {
      companyRepo.findOne.mockResolvedValue(null);

      try {
        await service.create({ ...createDto, companyId });
        fail('Should have thrown BusinessException');
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessException);
        expect((err as BusinessException).code).toBe('COMPANY_NOT_FOUND');
      }
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when company is inactive', async () => {
      const inactiveCompany = {
        id: companyId,
        tenantCode,
        status: CompanyStatus.PENDING,
      } as Company;
      companyRepo.findOne.mockResolvedValue(inactiveCompany);

      try {
        await service.create({ ...createDto, companyId });
        fail('Should have thrown BusinessException');
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessException);
        expect((err as BusinessException).code).toBe('COMPANY_INACTIVE');
      }
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when profile name is duplicate in tenant/company scope', async () => {
      repository.findByNameAndTenant.mockResolvedValue(createProfileEntity());

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return accessible profiles for tenant and company', async () => {
      const tenantProfile = createProfileEntity({ id: 'p1', companyId });
      const systemProfile = createProfileEntity({ id: 'p2', tenantCode: null });
      repository.findAccessibleProfiles.mockResolvedValue([tenantProfile, systemProfile]);

      const result = await service.list(true, companyId);

      expect(repository.findAccessibleProfiles).toHaveBeenCalledWith(tenantCode, true, companyId);
      expect(result).toHaveLength(2);
      expect(result[0].companyId).toBe(companyId);
      expect(result[1].isSystem).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return profile when found and accessible', async () => {
      const profile = createProfileEntity();
      repository.findByIdAccessible.mockResolvedValue(profile);

      const result = await service.getById('uuid-123');

      expect(repository.findByIdAccessible).toHaveBeenCalledWith('uuid-123', tenantCode);
      expect(result.id).toBe('uuid-123');
    });

    it('should throw NotFoundException when profile is not accessible', async () => {
      repository.findByIdAccessible.mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update profile and increment version', async () => {
      const existing = createProfileEntity({ version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.findByNameAndTenant.mockResolvedValue(null);
      repository.updateWithVersion.mockResolvedValue(true);

      const updatedEntity = createProfileEntity({
        version: 2,
        name: 'Updated Name',
      });
      repository.findById.mockResolvedValueOnce(updatedEntity);

      const updateDto: UpdateImportProfileDto = {
        expectedVersion: 1,
        name: 'Updated Name',
      };

      const result = await service.update('uuid-123', updateDto);

      expect(repository.updateWithVersion).toHaveBeenCalledWith(
        'uuid-123',
        1,
        expect.objectContaining({ name: 'Updated Name' }),
      );
      expect(result.version).toBe(2);
      expect(result.name).toBe('Updated Name');
    });

    it('should update companyId after validating company projection', async () => {
      const existing = createProfileEntity({ version: 1, companyId: null });
      repository.findById.mockResolvedValueOnce(existing);

      const activeCompany = { id: companyId, tenantCode, status: CompanyStatus.ACTIVE } as Company;
      companyRepo.findOne.mockResolvedValue(activeCompany);
      repository.findByNameAndTenant.mockResolvedValue(null);
      repository.updateWithVersion.mockResolvedValue(true);

      const updatedEntity = createProfileEntity({ version: 2, companyId });
      repository.findById.mockResolvedValueOnce(updatedEntity);

      const updateDto: UpdateImportProfileDto = {
        companyId,
      };

      const result = await service.update('uuid-123', updateDto);

      expect(companyRepo.findOne).toHaveBeenCalledWith(
        { id: companyId, tenantCode },
        { withTenancy: false },
      );
      expect(repository.updateWithVersion).toHaveBeenCalledWith(
        'uuid-123',
        1,
        expect.objectContaining({ companyId }),
      );
      expect(result.companyId).toBe(companyId);
    });

    it('should throw ConflictException on expected version mismatch', async () => {
      const existing = createProfileEntity({ version: 2 });
      repository.findById.mockResolvedValue(existing);

      const updateDto: UpdateImportProfileDto = {
        expectedVersion: 1,
        name: 'Updated Name',
      };

      await expect(service.update('uuid-123', updateDto)).rejects.toThrow(BusinessException);
      expect(repository.updateWithVersion).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when updating system profile', async () => {
      const systemProfile = createProfileEntity({ tenantCode: null });
      repository.findById.mockResolvedValue(systemProfile);

      const updateDto: UpdateImportProfileDto = {
        name: 'Updated Name',
      };

      await expect(service.update('uuid-system', updateDto)).rejects.toThrow(BusinessException);
      expect(repository.updateWithVersion).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating another tenant profile', async () => {
      const otherTenantProfile = createProfileEntity({ tenantCode: 'OTHER_TENANT' });
      repository.findById.mockResolvedValue(otherTenantProfile);

      await expect(service.update('uuid-other', { name: 'New' })).rejects.toThrow(
        BusinessException,
      );
      expect(repository.updateWithVersion).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when update name conflicts with existing profile', async () => {
      const existing = createProfileEntity({ id: 'uuid-123', name: 'Original Name' });
      repository.findById.mockResolvedValue(existing);
      const duplicate = createProfileEntity({ id: 'uuid-other', name: 'Taken Name' });
      repository.findByNameAndTenant.mockResolvedValue(duplicate);

      await expect(service.update('uuid-123', { name: 'Taken Name' })).rejects.toThrow(
        BusinessException,
      );
      expect(repository.updateWithVersion).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updateWithVersion returns false (concurrent update)', async () => {
      const existing = createProfileEntity({ version: 1 });
      repository.findById.mockResolvedValue(existing);
      repository.updateWithVersion.mockResolvedValue(false);

      await expect(service.update('uuid-123', { description: 'New description' })).rejects.toThrow(
        BusinessException,
      );
    });

    it('should update profile with partial config and description', async () => {
      const existing = createProfileEntity({ version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.updateWithVersion.mockResolvedValue(true);
      repository.findById.mockResolvedValueOnce(
        createProfileEntity({
          version: 2,
          description: 'Updated Description',
          config: {
            ...sampleConfig,
            executionPolicy: { batchSize: 300, maxConcurrentBatches: 1 },
          },
        }),
      );

      const result = await service.update('uuid-123', {
        description: 'Updated Description',
        config: {
          executionPolicy: { batchSize: 300 },
        },
      });

      expect(result.description).toBe('Updated Description');
      expect(result.config.executionPolicy.batchSize).toBe(300);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate an inactive profile', async () => {
      const existing = createProfileEntity({ isActive: false, version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.updateWithVersion.mockResolvedValue(true);
      repository.findById.mockResolvedValueOnce(
        createProfileEntity({ isActive: true, version: 2 }),
      );

      const result = await service.activate('uuid-123');

      expect(repository.updateWithVersion).toHaveBeenCalledWith('uuid-123', 1, { isActive: true });
      expect(result.isActive).toBe(true);
    });

    it('should deactivate an active profile', async () => {
      const existing = createProfileEntity({ isActive: true, version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.updateWithVersion.mockResolvedValue(true);
      repository.findById.mockResolvedValueOnce(
        createProfileEntity({ isActive: false, version: 2 }),
      );

      const result = await service.deactivate('uuid-123');

      expect(repository.updateWithVersion).toHaveBeenCalledWith('uuid-123', 1, { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('should forbid deactivating system profile', async () => {
      const systemProfile = createProfileEntity({ tenantCode: null });
      repository.findById.mockResolvedValue(systemProfile);

      await expect(service.deactivate('uuid-system')).rejects.toThrow(BusinessException);
    });

    it('should forbid activating system profile', async () => {
      const systemProfile = createProfileEntity({ tenantCode: null, isActive: false });
      repository.findById.mockResolvedValue(systemProfile);

      await expect(service.activate('uuid-system')).rejects.toThrow(BusinessException);
    });

    it('should throw NotFoundException when activating another tenant profile', async () => {
      const otherTenantProfile = createProfileEntity({ tenantCode: 'OTHER_TENANT' });
      repository.findById.mockResolvedValue(otherTenantProfile);

      await expect(service.activate('uuid-other')).rejects.toThrow(BusinessException);
    });

    it('should throw ConflictException when status update conflicts', async () => {
      const existing = createProfileEntity({ isActive: true, version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.updateWithVersion.mockResolvedValue(false);

      await expect(service.deactivate('uuid-123')).rejects.toThrow(BusinessException);
    });

    it('should throw NotFoundException when activating non-existent profile', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.activate('uuid-missing')).rejects.toThrow(BusinessException);
    });
  });
});

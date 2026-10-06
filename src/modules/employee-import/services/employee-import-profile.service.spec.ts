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
    overrides?: Partial<EmployeeImportProfileEntity>,
  ): EmployeeImportProfileEntity => {
    const entity = new EmployeeImportProfileEntity();
    entity.id = overrides?.id ?? 'uuid-123';
    entity.tenantCode = overrides?.tenantCode ?? tenantCode;
    entity.companyId = overrides?.companyId ?? companyId;
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
      employee: {
        companyId,
      },
    } as unknown as AuthContext);

    const mockRepo = {
      create: jest.fn(),
      findByNameAndCompany: jest.fn(),
      findAccessibleProfiles: jest.fn(),
      findById: jest.fn(),
      updateWithVersion: jest.fn(),
    };

    const mockCompanyRepo = {
      findById: jest.fn(),
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

    it('should create a profile successfully', async () => {
      const activeCompany = { id: companyId, tenantCode, status: CompanyStatus.ACTIVE } as Company;
      companyRepo.findById.mockResolvedValue(activeCompany);
      repository.findByNameAndCompany.mockResolvedValue(null);
      const savedEntity = createProfileEntity();
      repository.create.mockResolvedValue(savedEntity);

      const result = await service.create(createDto);

      expect(companyRepo.findById).toHaveBeenCalledWith(companyId, { required: true });
      expect(repository.findByNameAndCompany).toHaveBeenCalledWith('Standard Import', companyId);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantCode,
          companyId,
          name: 'Standard Import',
          createdBy: userId,
          isActive: true,
        }),
      );
      expect(result.id).toBe(savedEntity.id);
      expect(result.name).toBe('Standard Import');
      expect(result.companyId).toBe(companyId);
    });

    it('should throw when company is inactive', async () => {
      const inactiveCompany = {
        id: companyId,
        tenantCode,
        status: CompanyStatus.PENDING,
      } as Company;
      companyRepo.findById.mockResolvedValue(inactiveCompany);

      try {
        await service.create(createDto);
        fail('Should have thrown BusinessException');
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessException);
        expect((err as BusinessException).code).toBe('COMPANY_INACTIVE');
      }
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when profile name is duplicate in company scope', async () => {
      const activeCompany = { id: companyId, tenantCode, status: CompanyStatus.ACTIVE } as Company;
      companyRepo.findById.mockResolvedValue(activeCompany);
      repository.findByNameAndCompany.mockResolvedValue(createProfileEntity());

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return accessible profiles for company', async () => {
      const profile1 = createProfileEntity({ id: 'p1', companyId });
      const profile2 = createProfileEntity({ id: 'p2', companyId });
      repository.findAccessibleProfiles.mockResolvedValue([profile1, profile2]);

      const result = await service.list(true);

      expect(repository.findAccessibleProfiles).toHaveBeenCalledWith(companyId, true);
      expect(result).toHaveLength(2);
      expect(result[0].companyId).toBe(companyId);
    });
  });

  describe('getById', () => {
    it('should return profile when found', async () => {
      const profile = createProfileEntity();
      repository.findById.mockResolvedValue(profile);

      const result = await service.getById('uuid-123');

      expect(repository.findById).toHaveBeenCalledWith('uuid-123', { required: true });
      expect(result.id).toBe('uuid-123');
    });

    it('should throw when profile is not found', async () => {
      repository.findById.mockRejectedValue(new Error('Record not found with ID: non-existent'));

      await expect(service.getById('non-existent')).rejects.toThrow('Record not found');
    });
  });

  describe('update', () => {
    it('should update profile and increment version', async () => {
      const existing = createProfileEntity({ version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.findByNameAndCompany.mockResolvedValue(null);
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

    it('should throw ConflictException when update name conflicts with existing profile', async () => {
      const existing = createProfileEntity({ id: 'uuid-123', name: 'Original Name' });
      repository.findById.mockResolvedValue(existing);
      const duplicate = createProfileEntity({ id: 'uuid-other', name: 'Taken Name' });
      repository.findByNameAndCompany.mockResolvedValue(duplicate);

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

    it('should throw ConflictException when status update conflicts', async () => {
      const existing = createProfileEntity({ isActive: true, version: 1 });
      repository.findById.mockResolvedValueOnce(existing);
      repository.updateWithVersion.mockResolvedValue(false);

      await expect(service.deactivate('uuid-123')).rejects.toThrow(BusinessException);
    });

    it('should throw when activating non-existent profile', async () => {
      repository.findById.mockRejectedValue(new Error('Record not found with ID: uuid-missing'));

      await expect(service.activate('uuid-missing')).rejects.toThrow('Record not found');
    });
  });
});

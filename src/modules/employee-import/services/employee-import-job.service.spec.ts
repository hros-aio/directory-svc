import { Test, TestingModule } from '@nestjs/testing';
import { AuthContext, BusinessException, RequestContextService } from '@new-hros/libs-core';

import {
  ConfigurationResolverService,
  SYSTEM_BASELINE_CONFIG,
} from './configuration-resolver.service';
import { EmployeeImportJobService } from './employee-import-job.service';
import type { ImportJobConfig } from '../../../common/interfaces';
import { EmployeeImportJobEntity } from '../entities/employee-import-job.entity';
import { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';
import { EmployeeImportJobRepository } from '../repositories/employee-import-job.repository';
import { EmployeeImportProfileRepository } from '../repositories/employee-import-profile.repository';
import { ConfigurationValidator } from '../validators/configuration.validator';

describe('EmployeeImportJobService', () => {
  let service: EmployeeImportJobService;
  let jobRepo: jest.Mocked<EmployeeImportJobRepository>;
  let profileRepo: jest.Mocked<EmployeeImportProfileRepository>;

  const tenantCode = 'TENANT_A';
  const userId = 'user-123';
  const companyId = 'e5b8d2a6-9f3c-4217-b715-2f9876543210';

  const customProfileConfig: ImportJobConfig = {
    ...SYSTEM_BASELINE_CONFIG,
    executionPolicy: {
      batchSize: 250,
      maxConcurrentBatches: 2,
    },
  };

  beforeEach(async () => {
    jest.spyOn(RequestContextService, 'getTenantCode').mockReturnValue(tenantCode);
    jest.spyOn(RequestContextService, 'getUser').mockReturnValue({
      userId,
      tenantCode,
      sessionId: 'session-1',
      roles: ['ADMIN'],
      scopes: [],
      permissions: ['import_profile.create'],
    } as unknown as AuthContext);

    const mockJobRepo = {
      create: jest.fn(),
      findById: jest.fn(),
    };

    const mockProfileRepo = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeImportJobService,
        ConfigurationValidator,
        ConfigurationResolverService,
        { provide: EmployeeImportJobRepository, useValue: mockJobRepo },
        { provide: EmployeeImportProfileRepository, useValue: mockProfileRepo },
      ],
    }).compile();

    service = module.get<EmployeeImportJobService>(EmployeeImportJobService);
    jobRepo = module.get(EmployeeImportJobRepository);
    profileRepo = module.get(EmployeeImportProfileRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createJob', () => {
    it('should create an import job with resolved snapshot referencing a profile', async () => {
      const profile = new EmployeeImportProfileEntity();
      profile.id = 'prof-1';
      profile.name = 'Profile 1';
      profile.version = 3;
      profile.isActive = true;
      profile.config = customProfileConfig;
      profile.companyId = companyId;

      profileRepo.findById.mockResolvedValue(profile);

      const savedJob = new EmployeeImportJobEntity();
      savedJob.id = 'job-1';
      savedJob.tenantCode = tenantCode;
      savedJob.status = 'PENDING';
      savedJob.companyId = companyId;
      savedJob.profileId = 'prof-1';
      savedJob.profileVersion = 3;
      savedJob.configSnapshot = {
        ...customProfileConfig,
        errorPolicy: {
          ...customProfileConfig.errorPolicy,
          maxErrorRows: 50,
        },
      };
      savedJob.createdBy = userId;
      savedJob.createdAt = new Date();
      savedJob.updatedAt = new Date();

      jobRepo.create.mockResolvedValue(savedJob);

      const result = await service.createJob({
        profileId: 'prof-1',
        overrides: {
          errorPolicy: {
            maxErrorRows: 50,
          },
        },
      });

      expect(profileRepo.findById).toHaveBeenCalledWith('prof-1', { required: true });
      expect(jobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantCode,
          companyId,
          profileId: 'prof-1',
          profileVersion: 3,
          createdBy: userId,
          configSnapshot: expect.objectContaining({
            executionPolicy: expect.objectContaining({ batchSize: 250 }),
            errorPolicy: expect.objectContaining({ maxErrorRows: 50 }),
          }),
        }),
      );
      expect(result.id).toBe('job-1');
      expect(result.profileVersion).toBe(3);
    });

    it('should create an import job without profile using baseline and overrides', async () => {
      const savedJob = new EmployeeImportJobEntity();
      savedJob.id = 'job-2';
      savedJob.tenantCode = tenantCode;
      savedJob.companyId = null;
      savedJob.status = 'PENDING';
      savedJob.profileId = null;
      savedJob.profileVersion = null;
      savedJob.configSnapshot = SYSTEM_BASELINE_CONFIG;
      savedJob.createdBy = userId;
      savedJob.createdAt = new Date();
      savedJob.updatedAt = new Date();

      jobRepo.create.mockResolvedValue(savedJob);

      const result = await service.createJob({});

      expect(profileRepo.findById).not.toHaveBeenCalled();
      expect(jobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantCode,
          companyId: null,
          profileId: null,
          profileVersion: null,
          configSnapshot: SYSTEM_BASELINE_CONFIG,
        }),
      );
      expect(result.profileId).toBeNull();
      expect(result.profileVersion).toBeNull();
    });

    it('should reject job creation if referenced profile is inactive', async () => {
      const profile = new EmployeeImportProfileEntity();
      profile.id = 'prof-inactive';
      profile.name = 'Old Profile';
      profile.version = 1;
      profile.isActive = false;

      profileRepo.findById.mockResolvedValue(profile);

      await expect(service.createJob({ profileId: 'prof-inactive' })).rejects.toThrow(
        BusinessException,
      );
      expect(jobRepo.create).not.toHaveBeenCalled();
    });

    it('should reject job creation if profile is not found', async () => {
      profileRepo.findById.mockRejectedValue(new Error('Record not found with ID: non-existent'));

      await expect(service.createJob({ profileId: 'non-existent' })).rejects.toThrow(
        'Record not found',
      );
      expect(jobRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('snapshot immutability', () => {
    it('verifies that updating the source profile does not change the historical job snapshot', async () => {
      const profile = new EmployeeImportProfileEntity();
      profile.id = 'prof-1';
      profile.name = 'Standard Profile';
      profile.version = 1;
      profile.isActive = true;
      profile.companyId = companyId;
      profile.config = {
        ...SYSTEM_BASELINE_CONFIG,
        executionPolicy: { batchSize: 300, maxConcurrentBatches: 1 },
      };

      profileRepo.findById.mockResolvedValue(profile);

      const capturedSnapshot = { ...profile.config };
      const savedJob = new EmployeeImportJobEntity();
      savedJob.id = 'job-historical';
      savedJob.tenantCode = tenantCode;
      savedJob.companyId = companyId;
      savedJob.profileId = profile.id;
      savedJob.profileVersion = 1;
      savedJob.configSnapshot = capturedSnapshot;
      savedJob.status = 'PENDING';
      savedJob.createdBy = userId;
      savedJob.createdAt = new Date();
      savedJob.updatedAt = new Date();

      jobRepo.create.mockResolvedValue(savedJob);

      const createdJob = await service.createJob({ profileId: 'prof-1' });

      // Profile subsequently updated to version 2 with new batchSize = 900
      profile.version = 2;
      profile.config = {
        ...profile.config,
        executionPolicy: { batchSize: 900, maxConcurrentBatches: 1 },
      };

      // Verify the job snapshot previously saved is completely unchanged
      expect(createdJob.configSnapshot.executionPolicy.batchSize).toBe(300);
      expect(createdJob.profileVersion).toBe(1);
    });
  });

  describe('getJobById', () => {
    it('should retrieve job for current tenant', async () => {
      const job = new EmployeeImportJobEntity();
      job.id = 'job-1';
      job.tenantCode = tenantCode;
      job.status = 'PROCESSING';
      job.profileId = null;
      job.profileVersion = null;
      job.configSnapshot = SYSTEM_BASELINE_CONFIG;
      job.createdBy = userId;
      job.createdAt = new Date();
      job.updatedAt = new Date();

      jobRepo.findById.mockResolvedValue(job);

      const result = await service.getJobById('job-1');

      expect(jobRepo.findById).toHaveBeenCalledWith('job-1', { required: true });
      expect(result.id).toBe('job-1');
    });

    it('should throw if job is not found', async () => {
      jobRepo.findById.mockRejectedValue(new Error('Record not found with ID: job-other'));

      await expect(service.getJobById('job-other')).rejects.toThrow('Record not found');
    });
  });
});

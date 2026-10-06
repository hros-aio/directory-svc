import { RequestContextService } from '@new-hros/libs-core';
import { TransactionService } from '@new-hros/libs-sql';

import { EmployeeImportProfileRepository } from './employee-import-profile.repository';
import { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';

interface MockProfileTypeormRepo {
  findOne: jest.Mock;
  find: jest.Mock;
  save: jest.Mock;
}

describe('EmployeeImportProfileRepository', () => {
  let repository: EmployeeImportProfileRepository;
  let mockTypeormRepo: MockProfileTypeormRepo;
  let mockTransactionService: { getManager: jest.Mock };

  beforeEach(() => {
    jest.spyOn(RequestContextService, 'getTenantCode').mockReturnValue('TENANT_A');

    mockTypeormRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    mockTransactionService = {
      getManager: jest.fn().mockReturnValue({
        getRepository: jest.fn().mockReturnValue(mockTypeormRepo),
      }),
    };

    repository = new EmployeeImportProfileRepository(
      mockTransactionService as unknown as TransactionService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findByNameAndCompany', () => {
    it('should query by name, companyId, and tenantCode when companyId is provided', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(new EmployeeImportProfileEntity());

      const result = await repository.findByNameAndCompany('Import Profile', 'company-uuid');

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'Import Profile', companyId: 'company-uuid', tenantCode: 'TENANT_A' },
      });
      expect(result).toBeDefined();
    });

    it('should query by name and tenantCode when companyId is not provided', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(new EmployeeImportProfileEntity());

      const result = await repository.findByNameAndCompany('Import Profile');

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'Import Profile', companyId: undefined, tenantCode: 'TENANT_A' },
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAccessibleProfiles', () => {
    it('should query accessible profiles with isActive filter and companyId', async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAccessibleProfiles('company-uuid', true);

      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'company-uuid', isActive: true, tenantCode: 'TENANT_A' },
      });
      expect(result).toEqual([]);
    });

    it('should query accessible profiles with isActive = false', async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAccessibleProfiles('company-uuid', false);

      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'company-uuid', isActive: false, tenantCode: 'TENANT_A' },
      });
      expect(result).toEqual([]);
    });

    it('should query accessible profiles without isActive filter', async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAccessibleProfiles('company-uuid');

      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'company-uuid', isActive: undefined, tenantCode: 'TENANT_A' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateWithVersion', () => {
    it('should find existing record by id and version, update it, and return true', async () => {
      const existing = new EmployeeImportProfileEntity();
      existing.id = 'uuid-1';
      existing.version = 2;
      mockTypeormRepo.findOne.mockResolvedValue(existing);
      mockTypeormRepo.save.mockResolvedValue({ ...existing, name: 'New Name' });

      const success = await repository.updateWithVersion('uuid-1', 2, { name: 'New Name' });

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1', version: 2, tenantCode: 'TENANT_A' },
      });
      expect(mockTypeormRepo.save).toHaveBeenCalledWith({
        id: 'uuid-1',
        name: 'New Name',
      });
      expect(success).toBe(true);
    });

    it('should return false when record with matching version is not found', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(null);

      const success = await repository.updateWithVersion('uuid-1', 2, { name: 'New Name' });

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1', version: 2, tenantCode: 'TENANT_A' },
      });
      expect(mockTypeormRepo.save).not.toHaveBeenCalled();
      expect(success).toBe(false);
    });
  });
});

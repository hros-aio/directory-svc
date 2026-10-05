import { TransactionService } from '@new-hros/libs-sql';
import { IsNull, Repository } from 'typeorm';

import { EmployeeImportProfileRepository } from './employee-import-profile.repository';
import { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';

interface MockProfileTypeormRepo {
  findOne: jest.Mock;
  find: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
}

describe('EmployeeImportProfileRepository', () => {
  let repository: EmployeeImportProfileRepository;
  let mockTypeormRepo: MockProfileTypeormRepo;
  let mockTransactionService: { getManager: jest.Mock };

  beforeEach(() => {
    mockTypeormRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
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

  describe('findByNameAndTenant', () => {
    it('should query by name, tenantCode, and companyId when companyId is provided', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(new EmployeeImportProfileEntity());

      const result = await repository.findByNameAndTenant(
        'Import Profile',
        'TENANT_A',
        'company-uuid',
      );

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'Import Profile', tenantCode: 'TENANT_A', companyId: 'company-uuid' },
        withTenancy: false,
      });
      expect(result).toBeDefined();
    });

    it('should query by name, tenantCode, and IsNull(companyId) when companyId is not provided', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(new EmployeeImportProfileEntity());

      const result = await repository.findByNameAndTenant('Import Profile', 'TENANT_A');

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'Import Profile', tenantCode: 'TENANT_A', companyId: IsNull() },
        withTenancy: false,
      });
      expect(result).toBeDefined();
    });

    it('should query by name and IsNull(tenantCode) when tenantCode is null', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByNameAndTenant('System Profile', null);

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'System Profile', tenantCode: IsNull() },
        withTenancy: false,
      });
      expect(result).toBeNull();
    });
  });

  describe('findAccessibleProfiles', () => {
    it('should query accessible profiles with isActive filter and companyId', async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAccessibleProfiles('TENANT_A', true, 'company-uuid');

      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: [
          { tenantCode: 'TENANT_A', companyId: 'company-uuid', isActive: true },
          { tenantCode: 'TENANT_A', companyId: IsNull(), isActive: true },
          { tenantCode: IsNull(), isActive: true },
        ],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([]);
    });

    it('should query accessible profiles without companyId', async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAccessibleProfiles('TENANT_A', false);

      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: [
          { tenantCode: 'TENANT_A', isActive: false },
          { tenantCode: IsNull(), isActive: false },
        ],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([]);
    });

    it('should query accessible profiles without isActive filter', async () => {
      mockTypeormRepo.find.mockResolvedValue([]);

      const result = await repository.findAccessibleProfiles('TENANT_A');

      expect(mockTypeormRepo.find).toHaveBeenCalledWith({
        where: [{ tenantCode: 'TENANT_A' }, { tenantCode: IsNull() }],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('findByIdAccessible', () => {
    it('should query profile by id and accessible tenant or system', async () => {
      mockTypeormRepo.findOne.mockResolvedValue(new EmployeeImportProfileEntity());

      const result = await repository.findByIdAccessible('uuid-1', 'TENANT_A');

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith({
        where: [
          { id: 'uuid-1', tenantCode: 'TENANT_A' },
          { id: 'uuid-1', tenantCode: IsNull() },
        ],
      });
      expect(result).toBeDefined();
    });
  });

  describe('updateWithVersion', () => {
    it('should execute update query builder and return true when rows affected', async () => {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      } as unknown as ReturnType<Repository<EmployeeImportProfileEntity>['createQueryBuilder']>;
      mockTypeormRepo.createQueryBuilder.mockReturnValue(qb);

      const success = await repository.updateWithVersion('uuid-1', 2, { name: 'New Name' });

      expect(qb.update).toHaveBeenCalledWith(EmployeeImportProfileEntity);
      expect(qb.where).toHaveBeenCalledWith('id = :id AND version = :expectedVersion', {
        id: 'uuid-1',
        expectedVersion: 2,
      });
      expect(success).toBe(true);
    });

    it('should return false when 0 rows affected', async () => {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      } as unknown as ReturnType<Repository<EmployeeImportProfileEntity>['createQueryBuilder']>;
      mockTypeormRepo.createQueryBuilder.mockReturnValue(qb);

      const success = await repository.updateWithVersion('uuid-1', 2, { name: 'New Name' });

      expect(success).toBe(false);
    });
  });
});

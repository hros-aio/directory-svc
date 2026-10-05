import { RequestContextService } from '@new-hros/libs-core';
import { TransactionService } from '@new-hros/libs-sql';

import { EmployeeImportJobRepository } from './employee-import-job.repository';
import { EmployeeImportJobEntity } from '../entities/employee-import-job.entity';

interface MockJobTypeormRepo {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

describe('EmployeeImportJobRepository', () => {
  let repository: EmployeeImportJobRepository;
  let mockTypeormRepo: MockJobTypeormRepo;
  let mockTransactionService: { getManager: jest.Mock };

  beforeEach(() => {
    jest.spyOn(RequestContextService, 'getTenantCode').mockReturnValue('TENANT_A');

    mockTypeormRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
    };

    mockTransactionService = {
      getManager: jest.fn().mockReturnValue({
        getRepository: jest.fn().mockReturnValue(mockTypeormRepo),
      }),
    };

    repository = new EmployeeImportJobRepository(
      mockTransactionService as unknown as TransactionService,
    );
  });

  describe('findByIdAndTenant', () => {
    it('should query job by id and tenantCode', async () => {
      const job = new EmployeeImportJobEntity();
      mockTypeormRepo.findOne.mockResolvedValue(job);

      const result = await repository.findByIdAndTenant('job-1', 'TENANT_A');

      expect(mockTypeormRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'job-1', tenantCode: 'TENANT_A' }),
        }),
      );
      expect(result).toBe(job);
    });
  });
});

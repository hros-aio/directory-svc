import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { EmployeeImportJobEntity } from '../entities/employee-import-job.entity';

@Injectable()
export class EmployeeImportJobRepository extends BaseRepository<EmployeeImportJobEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeImportJobEntity, transactionService);
  }

  async findByIdAndTenant(id: string, tenantCode: string): Promise<EmployeeImportJobEntity | null> {
    return this.findOne({ id, tenantCode });
  }
}

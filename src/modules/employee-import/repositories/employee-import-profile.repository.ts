import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';

@Injectable()
export class EmployeeImportProfileRepository extends BaseRepository<EmployeeImportProfileEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeImportProfileEntity, transactionService);
  }

  async findByNameAndCompany(
    name: string,
    companyId?: string,
  ): Promise<EmployeeImportProfileEntity | null> {
    return this.findOne({ name, companyId });
  }

  async findAccessibleProfiles(
    companyId: string,
    isActive?: boolean,
  ): Promise<EmployeeImportProfileEntity[]> {
    return this.find({ companyId, isActive });
  }

  async updateWithVersion(
    id: string,
    expectedVersion: number,
    data: Partial<EmployeeImportProfileEntity>,
  ): Promise<boolean> {
    const record = await this.findOne({ id, version: expectedVersion });
    if (!record) {
      return false;
    }

    await this.update(id, data);
    return true;
  }
}

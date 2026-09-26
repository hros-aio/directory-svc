import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { EmployeeProfileEntity } from '../entities/employee-profile.entity';

@Injectable()
export class EmployeeProfileRepository extends BaseRepository<EmployeeProfileEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeProfileEntity, transactionService);
  }

  async findByEmployeeIdAndTenant(
    employeeId: string,
    tenantCode: string,
  ): Promise<EmployeeProfileEntity | null> {
    return this.repository.findOne({
      where: { employeeId, tenantCode },
    });
  }

  async createAndSave(data: Partial<EmployeeProfileEntity>): Promise<EmployeeProfileEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}

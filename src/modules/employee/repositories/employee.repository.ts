import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { EmployeeEntity } from '../entities/employee.entity';

@Injectable()
export class EmployeeRepository extends BaseRepository<EmployeeEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeEntity, transactionService);
  }

  async findByCode(tenantCode: string, employeeCode: string): Promise<EmployeeEntity | null> {
    return this.repository.findOne({
      where: { tenantCode, employeeCode },
    });
  }

  async findByIdAndTenant(id: string, tenantCode: string): Promise<EmployeeEntity | null> {
    return this.repository.findOne({
      where: { id, tenantCode },
      relations: ['profile'],
    });
  }

  async createAndSave(data: Partial<EmployeeEntity>): Promise<EmployeeEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
